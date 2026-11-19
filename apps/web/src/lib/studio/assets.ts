/**
 * Import et cache des images (logos) pour la composition de l'atlas.
 * Contrôles côté client (CDC F-20, S-04) ; le contrôle serveur (signature binaire,
 * nettoyage SVG, recompression) s'ajoute en phase 3.
 */
import type { ImageSource } from "@wear3d/editor-2d";
import { elementByAssetId, elementSvg } from "./elements";
import { logoByAssetId, logoSvg } from "./logos";
import { deleteAsset, listAssets, loadAsset, saveAsset, type StoredAsset } from "./persistence";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"] as const;

const cache = new Map<string, ImageSource>();
const pending = new Map<string, Promise<ImageSource | undefined>>();

export class AssetImportError extends Error {
  override name = "AssetImportError";
}

/** Vérifie la signature binaire réelle du fichier (pas seulement l'extension). */
async function sniffType(file: Blob): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47)
    return "image/png";
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  const text = new TextDecoder().decode(head).trimStart().toLowerCase();
  if (text.startsWith("<svg") || (text.startsWith("<?xml") && text.includes("<svg"))) {
    return "image/svg+xml";
  }
  return null;
}

/** Supprime scripts, gestionnaires d'événements et liens externes d'un SVG. */
async function sanitizeSvg(file: Blob): Promise<Blob> {
  const doc = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
  if (doc.querySelector("parsererror")) throw new AssetImportError("SVG invalide");
  doc.querySelectorAll("script, foreignObject").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      if (
        (name === "href" || name === "xlink:href") &&
        !value.startsWith("#") &&
        !value.startsWith("data:image/")
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });
  const svg = doc.documentElement;
  // Taille explicite : nécessaire à Firefox pour dessiner le SVG dans un canvas.
  if (!svg.getAttribute("width") || !svg.getAttribute("height")) {
    const vb = svg
      .getAttribute("viewBox")
      ?.split(/[\s,]+/)
      .map(Number);
    const w = vb?.[2] && vb[2] > 0 ? vb[2] : 1024;
    const h = vb?.[3] && vb[3] > 0 ? vb[3] : 1024;
    const scale = 2048 / Math.max(w, h);
    svg.setAttribute("width", String(Math.round(w * scale)));
    svg.setAttribute("height", String(Math.round(h * scale)));
  }
  return new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" });
}

function decode(blob: Blob): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";
    img.onload = () =>
      resolve({ image: img, width: img.naturalWidth || 1024, height: img.naturalHeight || 1024 });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AssetImportError("Image illisible"));
    };
    img.src = url;
  });
}

/** Importe un fichier utilisateur : contrôle, stockage local, mise en cache. */
export async function importImage(file: File, idPrefix = "asset_"): Promise<StoredAsset> {
  if (file.size > MAX_UPLOAD_BYTES)
    throw new AssetImportError("Fichier trop lourd (10 Mo maximum)");
  const type = await sniffType(file);
  if (!type) throw new AssetImportError("Format non pris en charge (PNG, JPG ou SVG)");
  const blob = type === "image/svg+xml" ? await sanitizeSvg(file) : file;
  const source = await decode(blob);
  const asset: StoredAsset = {
    id: `${idPrefix}${crypto.randomUUID()}`,
    name: file.name,
    type,
    blob,
    width: source.width,
    height: source.height,
  };
  await saveAsset(asset);
  cache.set(asset.id, source);
  // Copie en ligne (utilisateur connecté), sans bloquer ni faire échouer l'import.
  void import("./cloud-assets").then((m) => m.uploadAsset(asset));
  return asset;
}

/** Supprime une image importée : navigateur et copie en ligne. */
export async function deleteImage(id: string): Promise<void> {
  await deleteAsset(id);
  cache.delete(id);
  void import("./cloud-assets").then((m) => m.removeCloudAsset(id));
}

/** Images locales, complétées par celles du compte absentes de ce navigateur. */
export async function listAllAssets(): Promise<StoredAsset[]> {
  const local = await listAssets().catch(() => [] as StoredAsset[]);
  try {
    const m = await import("./cloud-assets");
    const known = new Set(local.map((a) => a.id));
    for (const remote of await m.listCloudAssets()) {
      if (known.has(remote.id)) continue;
      const asset = await m.downloadAsset(remote.id);
      if (asset) {
        await saveAsset(asset);
        local.push(asset);
      }
    }
  } catch {
    // Hors ligne ou non connecté : les images locales suffisent.
  }
  return local;
}

export function getCachedImage(assetId: string): ImageSource | undefined {
  return cache.get(assetId);
}

/** Charge (une seule fois) une image stockée localement. */
export function ensureImage(assetId: string): Promise<ImageSource | undefined> {
  const hit = cache.get(assetId);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(assetId);
  if (!p) {
    // Logo intégré : rasterisé depuis son SVG, sans passer par le stockage local.
    const builtin = logoByAssetId(assetId);
    const element = elementByAssetId(assetId);
    const svg = builtin ? logoSvg(builtin) : element ? elementSvg(element, "#000000") : null;
    p = (
      svg
        ? decode(new Blob([svg], { type: "image/svg+xml" }))
        : loadAsset(assetId)
            .then(async (asset) => {
              if (asset) return asset;
              // Autre appareil : récupère l'image du compte puis la garde en local.
              const remote = await import("./cloud-assets").then((m) => m.downloadAsset(assetId));
              if (remote) await saveAsset(remote);
              return remote;
            })
            .then((asset) => (asset ? decode(asset.blob) : undefined))
    )
      .then((src) => {
        if (src) cache.set(assetId, src);
        return src;
      })
      .catch(() => undefined)
      .finally(() => pending.delete(assetId));
    pending.set(assetId, p);
  }
  return p;
}
