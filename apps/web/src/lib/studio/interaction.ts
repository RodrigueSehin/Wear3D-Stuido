/**
 * Sélection et glisser des calques à partir d'un point de l'atlas (u, v).
 * Partagé par la vue 3D (raycast) et la vue 2D à plat (pointeur sur l'atlas).
 */
import type { Layer } from "@wear3d/design-schema";
import { atlasUvToZone, pickLayer, zoneRectPx, type ZoneRect } from "@wear3d/editor-2d";
import { ATLAS_SIZE } from "@wear3d/garment-engine";
import { getCachedImage } from "./assets";
import { useStudio } from "./store";

export interface AtlasHit {
  zone: string;
  u: number;
  v: number;
}

let drag: { id: string; dx: number; dy: number } | null = null;

function zoneRect(code: string): ZoneRect | undefined {
  const z = useStudio.getState().definition?.zones.find((d) => d.code === code);
  return z ? { code: z.code, ...z.uvRect } : undefined;
}

const aspect = (assetId: string) => {
  const img = getCachedImage(assetId);
  return img ? img.width / img.height : undefined;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Appui sur la surface : sélectionne un calque (et démarre le glisser) ou une zone. */
export function surfaceDown(hit: AtlasHit): boolean {
  const s = useStudio.getState();
  if (!s.doc || s.preview) return false;
  const rect = zoneRect(hit.zone);
  if (!rect) return false;
  const local = atlasUvToZone(rect, hit.u, hit.v);
  const layer = pickLayer(
    s.doc.layers,
    hit.zone,
    zoneRectPx(rect, ATLAS_SIZE.studio),
    local,
    aspect,
  );
  if (layer) {
    s.select({ kind: "layer", id: layer.id });
    drag = { id: layer.id, dx: local.x - layer.transform.x, dy: local.y - layer.transform.y };
    s.setDragging(true);
    return true;
  }
  if (s.tool === "select") {
    s.selectZone(hit.zone);
    s.select({ kind: "base" });
  }
  return false;
}

/** Capacité de zone requise par un type de calque. */
function capabilityOf(layer: Layer): "text" | "image" {
  return layer.type === "image" ? "image" : "text";
}

/** Vrai si la zone accepte ce calque (texte, numéro ou image). */
export function zoneAccepts(zone: string, layer: Layer): boolean {
  const z = useStudio.getState().definition?.zones.find((d) => d.code === zone);
  return Boolean(z?.allows.includes(capabilityOf(layer)));
}

/**
 * Calque transféré dans une autre zone (devant → dos, manche, col…), à la position
 * donnée (coordonnées de la nouvelle zone). Sa taille réelle sur le vêtement est conservée.
 */
export function withZone(layer: Layer, zone: string, x: number, y: number): Layer {
  const def = useStudio.getState().definition;
  const from = def?.zones.find((z) => z.code === layer.zone)?.uvRect;
  const to = def?.zones.find((z) => z.code === zone)?.uvRect;
  if (!from || !to) return layer;
  const kw = from.w / to.w;
  const kh = from.h / to.h;
  const transform = {
    ...layer.transform,
    x: clamp(x),
    y: clamp(y),
    w: Math.min(2, Math.max(0.02, layer.transform.w * kw)),
    ...(layer.transform.h !== undefined
      ? { h: Math.min(2, Math.max(0.02, layer.transform.h * kh)) }
      : {}),
  };
  if (layer.type === "text") {
    return {
      ...layer,
      zone,
      transform,
      text: { ...layer.text, size: Math.min(1, Math.max(0.005, layer.text.size * kh)) },
    };
  }
  return { ...layer, zone, transform };
}

/** Change un calque de zone en gardant sa position relative (menu « Déplacer vers »). */
export function moveLayerToZone(id: string, zone: string): void {
  const s = useStudio.getState();
  const layer = s.doc?.layers.find((l) => l.id === id);
  if (!layer || layer.zone === zone || !zoneAccepts(zone, layer)) return;
  s.seal();
  s.updateLayer(id, (l) => withZone(l, zone, l.transform.x, l.transform.y));
  s.seal();
  s.select({ kind: "layer", id });
}

/**
 * Déplacement : le calque suit le pointeur. `over` est le point réellement sous le
 * pointeur (vues 2D et Patron) : s'il tombe sur une autre zone qui accepte le calque,
 * celui-ci y est transféré (devant → dos, manches, col).
 */
export function surfaceMove(hits: readonly AtlasHit[], over?: AtlasHit | null): void {
  if (!drag) return;
  const s = useStudio.getState();
  const layer = s.doc?.layers.find((l) => l.id === drag!.id);
  if (!layer) return;
  if (over && over.zone !== layer.zone && zoneAccepts(over.zone, layer)) {
    const rect = zoneRect(over.zone);
    if (rect) {
      const local = atlasUvToZone(rect, over.u, over.v);
      // Le calque se centre sous le pointeur dans sa nouvelle zone.
      drag = { ...drag, dx: 0, dy: 0 };
      s.updateLayer(drag.id, (l) => withZone(l, over.zone, local.x, local.y), `drag:${drag.id}`);
      // Sans sceller l'historique : tout le glisser reste une seule étape d'annulation.
      useStudio.setState({ selectedZone: over.zone });
      return;
    }
  }
  const hit = hits.find((h) => h.zone === layer.zone);
  const rect = hit && zoneRect(hit.zone);
  if (!hit || !rect) return;
  const local = atlasUvToZone(rect, hit.u, hit.v);
  const x = clamp(local.x - drag.dx);
  const y = clamp(local.y - drag.dy);
  s.updateLayer(drag.id, (l) => ({ ...l, transform: { ...l.transform, x, y } }), `drag:${drag.id}`);
}

export function endDrag(): void {
  if (!drag) return;
  drag = null;
  const s = useStudio.getState();
  s.setDragging(false);
  s.seal();
}

/** Zone contenant un point de l'atlas (vue 2D). */
export function zoneAtUv(u: number, v: number): string | undefined {
  const def = useStudio.getState().definition;
  return def?.zones.find(
    (z) =>
      u >= z.uvRect.x &&
      u <= z.uvRect.x + z.uvRect.w &&
      v >= z.uvRect.y &&
      v <= z.uvRect.y + z.uvRect.h,
  )?.code;
}
