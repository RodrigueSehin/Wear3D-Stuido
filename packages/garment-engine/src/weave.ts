import type { WeaveKind } from "./materials";

/**
 * Hauteur du relief (0..1) d'un motif de tissu sur une tuile périodique (x, y ∈ [0, 1]).
 * Sert à la normal map 3D et aux vignettes de tissu de l'interface.
 */
export function weaveHeight(kind: WeaveKind, x: number, y: number): number {
  const tau = Math.PI * 2;
  switch (kind) {
    case "jersey": {
      const col = Math.sin(x * tau * 2);
      const row = Math.abs(Math.sin((y + Math.abs(col) * 0.25) * tau * 2));
      return 0.5 + 0.5 * row * (0.6 + 0.4 * Math.abs(col));
    }
    case "twill":
      return 0.5 + 0.5 * Math.sin((x + y) * tau * 3);
    case "mesh": {
      const cx = (x * 3) % 1;
      const cy = (y * 3 + Math.floor(x * 3) * 0.5) % 1;
      const d = Math.hypot(cx - 0.5, cy - 0.5);
      return d < 0.22 ? 0 : 1 - Math.max(0, 0.35 - d);
    }
    case "honeycomb": {
      // Alvéoles hexagonales : arêtes en relief, creux au centre.
      const px = (x * 2) % 1;
      const py = (y * 2 * 1.732) % 1;
      const odd = Math.floor(y * 2 * 1.732) % 2;
      const ax = Math.abs(((px + odd * 0.5) % 1) - 0.5);
      const ay = Math.abs(py - 0.5);
      const d = Math.max(ax * 1.732 + ay, ay * 2);
      return Math.min(1, Math.max(0, d * 1.1));
    }
    case "knit": {
      // Mailles en « V » alternées.
      const col = (x * 6) % 1;
      const row = (y * 6) % 1;
      const v = Math.abs(col - 0.5) * 2;
      return 0.5 + 0.5 * Math.sin((row + v * 0.5) * tau);
    }
    case "satin":
      return 0.5 + 0.05 * Math.sin((x + y) * tau);
    case "carbon": {
      // Sergé 2×2 : damier de fils croisés.
      const cx = Math.floor(x * 4) % 2;
      const cy = Math.floor(y * 4) % 2;
      const fx = (x * 4) % 1;
      const fy = (y * 4) % 1;
      return cx === cy ? 0.5 + 0.5 * Math.sin(fx * Math.PI) : 0.5 + 0.5 * Math.sin(fy * Math.PI);
    }
    case "smooth":
      return 0.5 + 0.08 * Math.sin(x * tau) * Math.sin(y * tau);
  }
}
