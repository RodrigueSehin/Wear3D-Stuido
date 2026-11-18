/**
 * Géométrie des calques dans l'atlas. Les coordonnées d'un calque sont relatives
 * à sa zone (0..1) ; l'atlas est carré, donc le pixel est isotrope.
 */
import type { Layer } from "@wear3d/design-schema";

export interface ZoneRect {
  code: string;
  /** Fractions de l'atlas, origine en haut à gauche. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function zoneRectPx(rect: ZoneRect, atlasSize: number): PxRect {
  return {
    x: rect.x * atlasSize,
    y: rect.y * atlasSize,
    w: rect.w * atlasSize,
    h: rect.h * atlasSize,
  };
}

/** Coordonnée UV d'atlas → coordonnée locale de zone, ou null si hors du rectangle. */
export function atlasUvToZone(rect: ZoneRect, u: number, v: number): { x: number; y: number } {
  return { x: (u - rect.x) / rect.w, y: (v - rect.y) / rect.h };
}

export function isInsideZone(local: { x: number; y: number }): boolean {
  return local.x >= 0 && local.x <= 1 && local.y >= 0 && local.y <= 1;
}

/** Taille d'un calque en pixels, avant rotation. `imageAspect` = largeur / hauteur. */
export function layerSizePx(
  layer: Layer,
  zonePx: PxRect,
  imageAspect: (assetId: string) => number | undefined = () => 1,
): { w: number; h: number } {
  const w = layer.transform.w * zonePx.w;
  switch (layer.type) {
    case "text":
      return { w, h: layer.text.size * zonePx.h * 1.15 };
    case "number":
      return { w, h: numberFontPx(w) };
    case "image": {
      const aspect = imageAspect(layer.assetId) ?? 1;
      return { w, h: w / aspect };
    }
  }
}

/** Corps du numéro : un numéro à 2 chiffres en police condensée occupe ~la largeur donnée. */
export function numberFontPx(boxWidthPx: number): number {
  return boxWidthPx * 1.15;
}

/**
 * Test de sélection : le point (coordonnées locales de zone) est-il dans le calque,
 * en tenant compte de la rotation ?
 */
export function hitTestLayer(
  layer: Layer,
  zonePx: PxRect,
  point: { x: number; y: number },
  imageAspect?: (assetId: string) => number | undefined,
): boolean {
  const size = layerSizePx(layer, zonePx, imageAspect);
  const dx = (point.x - layer.transform.x) * zonePx.w;
  const dy = (point.y - layer.transform.y) * zonePx.h;
  const a = (-layer.transform.rotation * Math.PI) / 180;
  const lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(lx) <= size.w / 2 && Math.abs(ly) <= size.h / 2;
}

/** Calque visible et déverrouillé le plus haut sous le point (les derniers sont au-dessus). */
export function pickLayer(
  layers: readonly Layer[],
  zone: string,
  zonePx: PxRect,
  point: { x: number; y: number },
  imageAspect?: (assetId: string) => number | undefined,
): Layer | undefined {
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i]!;
    if (layer.zone !== zone || !layer.visible || layer.locked) continue;
    if (hitTestLayer(layer, zonePx, point, imageAspect)) return layer;
  }
  return undefined;
}

/**
 * Résolution effective d'une image placée (CDC F-27) : pixels source par pouce à la
 * taille imprimée. `zoneWidthMm` = largeur imprimable réelle de la zone.
 */
export function effectiveDpi(sourceWidthPx: number, layerW: number, zoneWidthMm: number): number {
  const printedInches = (layerW * zoneWidthMm) / 25.4;
  return printedInches > 0 ? sourceWidthPx / printedInches : Infinity;
}

export const MIN_PRINT_DPI = 150;
