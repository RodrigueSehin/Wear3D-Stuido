/**
 * Pont entre l'interface (barres, menus) et le viewer 3D chargé à la demande.
 * Le viewport enregistre ses fonctions ici à son montage.
 */
import type { ViewPreset } from "@wear3d/garment-engine";
import type { GarmentViewerHandle } from "@wear3d/garment-engine/react";

export interface ViewerBridge {
  viewer: GarmentViewerHandle | null;
  /** Rendu HD : atlas 4096 px recomposé, capture à la largeur demandée. */
  renderHd: ((width: number) => Promise<Blob>) | null;
}

export const viewerBridge: ViewerBridge = { viewer: null, renderHd: null };

/** Commandes de la vue 2D (zoom, recadrage), enregistrées par la vue à son montage. */
export const flatBridge: {
  zoom: ((step: number) => void) | null;
  fit: (() => void) | null;
} = { zoom: null, fit: null };

export function setView(view: ViewPreset): void {
  viewerBridge.viewer?.setView(view);
}

export type ExportFormat = "png" | "jpg";

export interface CaptureOptions {
  /** Largeur de capture en pixels. */
  width: number;
  /** Hauteur du cadre final : le rendu y est centré (format 16:9, carré…). Absente = libre. */
  height?: number;
  /** Atlas 4096 px recomposé pour la netteté des impressions (au-delà de 2048 px). */
  hd?: boolean;
  /** Qualité JPG (0..1). */
  quality?: number;
  /** Décor de scène placé derrière le vêtement (couvre le cadre). */
  backdrop?: { url: string; blur: boolean };
  /** Ajustements de scène (filtre Canvas : luminosité, contraste, saturation). */
  filter?: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Décor de scène illisible"));
    img.src = url;
  });
}

/** Capture du rendu courant, au format et à la taille demandés. */
export async function captureImage(format: ExportFormat, opts: CaptureOptions): Promise<Blob> {
  const png =
    opts.hd && viewerBridge.renderHd
      ? await viewerBridge.renderHd(opts.width)
      : await (viewerBridge.viewer?.capture(opts.width) ??
          Promise.reject(new Error("Vue 3D indisponible")));
  const filter = opts.filter && opts.filter !== "none" ? opts.filter : undefined;
  if (format === "png" && !opts.height && !opts.backdrop && !filter) return png;
  const bitmap = await createImageBitmap(png);
  const canvas = document.createElement("canvas");
  canvas.width = opts.height ? opts.width : bitmap.width;
  canvas.height = opts.height ?? bitmap.height;
  const ctx = canvas.getContext("2d")!;
  // JPG : fond blanc (pas de transparence) ; PNG : fond transparent.
  if (format === "jpg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (opts.backdrop) {
    // Décor en « cover » ; le flou d'arrière-plan est proportionnel à la taille de sortie.
    const bg = await loadImage(opts.backdrop.url);
    const c = Math.max(canvas.width / bg.width, canvas.height / bg.height);
    const blur = opts.backdrop.blur ? Math.round(canvas.width / 160) : 0;
    ctx.filter = [filter, blur ? `blur(${blur}px)` : ""].filter(Boolean).join(" ") || "none";
    // Le décor déborde de 3 × le flou : les bords du cadre restent opaques.
    const m = blur * 3;
    const dw = bg.width * c + 2 * m;
    const dh = bg.height * c + 2 * m;
    ctx.drawImage(bg, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }
  ctx.filter = filter ?? "none";
  // Rendu centré et contenu dans le cadre, sans déformation.
  const k = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const w = bitmap.width * k;
  const h = bitmap.height * k;
  ctx.drawImage(bitmap, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  const type = format === "jpg" ? "image/jpeg" : "image/png";
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export impossible"))),
      type,
      opts.quality ?? 0.92,
    ),
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
