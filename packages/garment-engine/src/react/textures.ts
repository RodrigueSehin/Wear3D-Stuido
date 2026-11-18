import * as THREE from "three";
import type { WeaveKind } from "../materials";
import { weaveHeight } from "../weave";

/**
 * Texture d'atlas issue du compositeur 2D. flipY = false : les UV suivent la
 * convention glTF (origine en haut à gauche), comme le canvas.
 */
export function createAtlasTexture(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

const weaveCache = new Map<WeaveKind, THREE.Texture>();

/** Normal map procédurale (tuile 128 px, répétée). Mise en cache par motif. */
export function weaveNormalMap(kind: WeaveKind): THREE.Texture {
  const cached = weaveCache.get(kind);
  if (cached) return cached;

  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const h = (i: number, j: number) =>
    weaveHeight(kind, ((i + size) % size) / size, ((j + size) % size) / size);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const dx = (h(i + 1, j) - h(i - 1, j)) * 2;
      const dy = (h(i, j + 1) - h(i, j - 1)) * 2;
      const len = Math.hypot(dx, dy, 1);
      const k = (j * size + i) * 4;
      data[k] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      data[k + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      data[k + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[k + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  weaveCache.set(kind, texture);
  return texture;
}

/** Halo radial (dégradé) pour la lueur du podium. */
export function createGlowTexture(color = "#3b82f6"): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.55, `${color}88`);
  g.addColorStop(1, `${color}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
