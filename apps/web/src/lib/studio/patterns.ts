/**
 * Motifs graphiques intégrés (CDC F-15), dessinés à la volée dans la couleur demandée.
 * Identifiant d'asset : `pattern:<code>`. Tuiles transparentes, couleur unique.
 */
import type { ImageSource } from "@wear3d/editor-2d";

export interface PatternDef {
  code: string;
  label: string;
  /** placed = motif unique couvrant la zone ; repeat = tuile répétée. */
  mode: "placed" | "repeat";
  /** pattern = motif graphique ; effect = effet d'ombrage / lumière (onglet « Effets »). */
  kind: "pattern" | "effect";
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}

const S = 512;

/** Couleur hexadécimale (#RRGGBB) avec opacité, pour les dégradés vers le transparent. */
function withAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Générateur pseudo-aléatoire déterministe (tuiles identiques à chaque rendu). */
function rng(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296;
    return t / 4294967296;
  };
}

export const PATTERNS: readonly PatternDef[] = [
  {
    code: "band-diagonal",
    label: "Bandes diagonales",
    mode: "placed",
    kind: "pattern",
    draw(ctx, s) {
      // Trois bandes parallèles de largeurs différentes, comme le maillot de la maquette.
      ctx.translate(s / 2, s / 2);
      ctx.rotate(-Math.PI / 4.2);
      for (const [y, h, a] of [
        [-0.02, 0.1, 1],
        [0.13, 0.05, 0.85],
        [0.22, 0.025, 0.7],
      ] as const) {
        ctx.globalAlpha = a;
        ctx.fillRect(-s, y * s, 2 * s, h * s);
      }
    },
  },
  {
    code: "shards",
    label: "Éclats géométriques",
    mode: "placed",
    kind: "pattern",
    draw(ctx, s) {
      const tris: [number, number][][] = [
        [
          [0.05, 0.1],
          [0.45, 0.02],
          [0.25, 0.38],
        ],
        [
          [0.55, 0.05],
          [0.95, 0.2],
          [0.7, 0.42],
        ],
        [
          [0.1, 0.5],
          [0.4, 0.42],
          [0.3, 0.8],
        ],
        [
          [0.5, 0.5],
          [0.9, 0.55],
          [0.62, 0.92],
        ],
        [
          [0.02, 0.85],
          [0.25, 0.7],
          [0.3, 0.98],
        ],
        [
          [0.75, 0.7],
          [0.98, 0.8],
          [0.85, 0.98],
        ],
      ];
      tris.forEach((t, i) => {
        ctx.globalAlpha = 0.35 + (i % 3) * 0.2;
        ctx.beginPath();
        t.forEach(([x, y], k) => (k ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
        ctx.closePath();
        ctx.fill();
      });
    },
  },
  {
    code: "chevron",
    label: "Chevron",
    mode: "placed",
    kind: "pattern",
    draw(ctx, s) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.lineTo(s / 2, s * 0.6);
      ctx.lineTo(s, s * 0.35);
      ctx.lineTo(s, s * 0.47);
      ctx.lineTo(s / 2, s * 0.72);
      ctx.lineTo(0, s * 0.47);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    code: "stripes",
    label: "Rayures",
    mode: "repeat",
    kind: "pattern",
    draw(ctx, s) {
      ctx.fillRect(0, 0, s * 0.35, s);
    },
  },
  {
    code: "diagonal",
    label: "Fines diagonales",
    mode: "repeat",
    kind: "pattern",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.12;
      ctx.strokeStyle = ctx.fillStyle;
      for (const o of [-s, 0, s]) {
        ctx.beginPath();
        ctx.moveTo(o, s);
        ctx.lineTo(o + s, 0);
        ctx.stroke();
      }
    },
  },
  {
    code: "dots",
    label: "Points",
    mode: "repeat",
    kind: "pattern",
    draw(ctx, s) {
      for (const [x, y] of [
        [0.25, 0.25],
        [0.75, 0.75],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x * s, y * s, s * 0.11, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    code: "hexagons",
    label: "Nid d'abeille",
    mode: "repeat",
    kind: "pattern",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.04;
      ctx.strokeStyle = ctx.fillStyle;
      const r = s / 4;
      for (const [cx, cy] of [
        [s / 4, s / 4],
        [(3 * s) / 4, (3 * s) / 4],
        [(3 * s) / 4, -s / 4],
        [s / 4, (5 * s) / 4],
        [-s / 4, (3 * s) / 4],
        [(5 * s) / 4, s / 4],
      ] as const) {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k + Math.PI / 6;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          if (k) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    },
  },
  {
    code: "camouflage",
    label: "Camouflage",
    mode: "repeat",
    kind: "pattern",
    draw(ctx, s) {
      const rand = rng(7);
      for (let i = 0; i < 26; i++) {
        const x = rand() * s;
        const y = rand() * s;
        const rx = s * (0.07 + rand() * 0.09);
        const ry = rx * (0.5 + rand() * 0.6);
        const rot = rand() * Math.PI;
        ctx.globalAlpha = 0.45 + rand() * 0.45;
        // Dessiné aux 4 coins pour que la tuile se raccorde.
        for (const [dx, dy] of [
          [0, 0],
          [s, 0],
          [-s, 0],
          [0, s],
          [0, -s],
        ] as const) {
          ctx.beginPath();
          ctx.ellipse(x + dx, y + dy, rx, ry, rot, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  {
    code: "gradient",
    label: "Dégradé",
    mode: "placed",
    kind: "effect",
    draw(ctx, s) {
      const g = ctx.createLinearGradient(0, s, 0, 0);
      const c = ctx.fillStyle as string;
      g.addColorStop(0, withAlpha(c, 0.95));
      g.addColorStop(0.55, withAlpha(c, 0.35));
      g.addColorStop(1, withAlpha(c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    },
  },
  {
    code: "spotlight",
    label: "Halo lumineux",
    mode: "placed",
    kind: "effect",
    draw(ctx, s) {
      const c = ctx.fillStyle as string;
      const g = ctx.createRadialGradient(s * 0.5, s * 0.4, 0, s * 0.5, s * 0.4, s * 0.6);
      g.addColorStop(0, withAlpha(c, 0.9));
      g.addColorStop(1, withAlpha(c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    },
  },
  {
    code: "grain",
    label: "Grain",
    mode: "repeat",
    kind: "effect",
    draw(ctx, s) {
      const rand = rng(3);
      for (let i = 0; i < 1400; i++) {
        ctx.globalAlpha = 0.15 + rand() * 0.5;
        const r = 0.6 + rand() * 1.4;
        ctx.beginPath();
        ctx.arc(rand() * s, rand() * s, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    code: "splatter",
    label: "Éclaboussures",
    mode: "placed",
    kind: "effect",
    draw(ctx, s) {
      const rand = rng(11);
      for (let i = 0; i < 70; i++) {
        const t = rand();
        const x = s * (0.1 + rand() * 0.8);
        const y = s * (0.1 + rand() * 0.8);
        ctx.globalAlpha = 0.35 + rand() * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, s * (0.004 + t * t * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
];

export const PATTERN_PREFIX = "pattern:";

export function patternByAssetId(assetId: string): PatternDef | undefined {
  return assetId.startsWith(PATTERN_PREFIX)
    ? PATTERNS.find((p) => p.code === assetId.slice(PATTERN_PREFIX.length))
    : undefined;
}

const cache = new Map<string, ImageSource>();

/** Tuile d'un motif intégré dans une couleur donnée (mise en cache). */
export function resolvePattern(assetId: string, color: string): ImageSource | undefined {
  if (typeof document === "undefined") return undefined;
  const def = patternByAssetId(assetId);
  if (!def) return undefined;
  const key = `${assetId}|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = color;
  def.draw(ctx, S);
  const src = { image: canvas, width: S, height: S };
  cache.set(key, src);
  return src;
}

/** Aperçu (data URL) d'un motif sur un fond, pour les vignettes de l'interface. */
export function patternPreview(assetId: string, color: string, background: string): string {
  const tile = resolvePattern(assetId, color);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 96, 96);
  const def = patternByAssetId(assetId);
  if (tile && def?.mode === "placed") ctx.drawImage(tile.image, 0, 0, 96, 96);
  else if (tile) {
    const fill = ctx.createPattern(tile.image, "repeat");
    if (fill) {
      ctx.scale(96 / S / 2, 96 / S / 2);
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, S * 2, S * 2);
    }
  }
  return canvas.toDataURL();
}
