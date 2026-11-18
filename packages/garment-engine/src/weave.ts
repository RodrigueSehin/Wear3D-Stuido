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
    case "smooth":
      return 0.5 + 0.08 * Math.sin(x * tau) * Math.sin(y * tau);
  }
}
