/** Vignettes de tissu (sélecteur « Tissu ») : relief de maille éclairé, teinté. */
import type { MaterialCode } from "@wear3d/design-schema";
import { MATERIAL_PRESETS, weaveHeight } from "@wear3d/garment-engine";

const cache = new Map<string, string>();

export function fabricSwatch(material: MaterialCode, color: string, size = 64): string {
  if (typeof document === "undefined") return "";
  const key = `${material}|${color}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(size, size);
  const n = Number.parseInt(color.slice(1), 16);
  const base = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const { weave } = MATERIAL_PRESETS[material];
  const repeat = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = ((x / size) * repeat) % 1;
      const v = ((y / size) * repeat) % 1;
      const h = weaveHeight(weave, u, v);
      const hx = weaveHeight(weave, (u + 0.02) % 1, v);
      // Lumière rasante venant du haut à gauche + légère diagonale de drapé.
      const shade = 0.72 + 0.35 * h + 1.2 * (hx - h) + 0.12 * Math.sin(((x + y) / size) * Math.PI);
      const k = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) img.data[k + c] = Math.max(0, Math.min(255, base[c]! * shade));
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}
