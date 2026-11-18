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
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}

const S = 512;

export const PATTERNS: readonly PatternDef[] = [
  {
    code: "band-diagonal",
    label: "Bandes diagonales",
    mode: "placed",
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
    draw(ctx, s) {
      ctx.fillRect(0, 0, s * 0.35, s);
    },
  },
  {
    code: "diagonal",
    label: "Fines diagonales",
    mode: "repeat",
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
