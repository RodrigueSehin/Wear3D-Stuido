/**
 * Sélection et glisser des calques à partir d'un point de l'atlas (u, v).
 * Partagé par la vue 3D (raycast) et la vue 2D à plat (pointeur sur l'atlas).
 */
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

/** Déplacement : le calque suit le pointeur, en restant dans sa zone. */
export function surfaceMove(hits: readonly AtlasHit[]): void {
  if (!drag) return;
  const s = useStudio.getState();
  const layer = s.doc?.layers.find((l) => l.id === drag!.id);
  if (!layer) return;
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
