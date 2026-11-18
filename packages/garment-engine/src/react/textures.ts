import * as THREE from "three";
import type { WeaveKind } from "../materials";

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

/** Hauteur du relief (0..1) d'un motif de tissu, sur une tuile périodique. */
function height(kind: WeaveKind, x: number, y: number): number {
  const tau = Math.PI * 2;
  switch (kind) {
    case "jersey": {
      // Mailles en V alternées.
      const col = Math.sin(x * tau * 2);
      const row = Math.abs(Math.sin((y + Math.abs(col) * 0.25) * tau * 2));
      return 0.5 + 0.5 * row * (0.6 + 0.4 * Math.abs(col));
    }
    case "twill":
      // Diagonales serrées.
      return 0.5 + 0.5 * Math.sin((x + y) * tau * 3);
    case "mesh": {
      // Trous ronds réguliers.
      const cx = (x * 3) % 1;
      const cy = (y * 3 + Math.floor(x * 3) * 0.5) % 1;
      const d = Math.hypot(cx - 0.5, cy - 0.5);
      return d < 0.22 ? 0 : 1 - Math.max(0, 0.35 - d);
    }
    case "smooth":
      return 0.5 + 0.08 * Math.sin(x * tau) * Math.sin(y * tau);
  }
}

/** Normal map procédurale (tuile 128 px, répétée). Mise en cache par motif. */
export function weaveNormalMap(kind: WeaveKind): THREE.Texture {
  const cached = weaveCache.get(kind);
  if (cached) return cached;

  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const h = (i: number, j: number) =>
    height(kind, ((i + size) % size) / size, ((j + size) % size) / size);
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
