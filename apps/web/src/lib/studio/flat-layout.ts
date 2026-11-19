/**
 * Mise à plat du vêtement pour la vue 2D : chaque vue (Face, Dos, manches) place les
 * zones de l'atlas dans une silhouette de maillot. Les correspondances sont linéaires
 * (rectangle de vue ↔ rectangle UV), ce qui permet de sélectionner et de glisser les
 * calques exactement comme en 3D.
 */
import type { GarmentDefinition } from "@wear3d/garment-engine";

export type FlatView = "front" | "back" | "left" | "right";
export type FlatMode = FlatView | "both";

export const FLAT_VIEW_LABELS: Record<FlatView, string> = {
  front: "Face",
  back: "Dos",
  left: "Gauche",
  right: "Droite",
};

type Pt = readonly [number, number];

export interface Placement {
  zone: string;
  /** Rectangle (unités de vue) où est projeté le rectangle UV de la zone. */
  rect: { x: number; y: number; w: number; h: number };
  /** Silhouette de découpe (unités de vue). */
  outline: readonly Pt[];
  /** Ombrage de tissu (bords plus sombres) : torse et manches. */
  shade?: boolean;
}

export interface ViewLayout {
  view: FlatView;
  /** Cadre de la vue (unités), y compris les marges. */
  box: { x: number; y: number; w: number; h: number };
  placements: readonly Placement[];
}

const bbox = (pts: readonly Pt[]) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [1000 - x, y] as const);

/** Silhouette propre à chaque famille de vêtement (encolure, longueur du corps, manches, capuche). */
interface FlatStyle {
  /** Encolure : en V (pointe) ou ronde (courbe). */
  neck: "v" | "round";
  frontDepth: number;
  backDepth: number;
  sleeve: Pt[];
  /** Bas du corps. */
  hem: number;
  hood?: boolean;
  box: { x: number; y: number; w: number; h: number };
}

const SLEEVE_SHORT: Pt[] = [
  [300, 150],
  [130, 225],
  [50, 425],
  [212, 478],
  [222, 300],
];
const SLEEVE_LONG: Pt[] = [
  [300, 150],
  [150, 230],
  [20, 690],
  [150, 725],
  [222, 330],
];

const STYLES: Record<string, FlatStyle> = {
  tshirts: {
    neck: "round",
    frontDepth: 190,
    backDepth: 150,
    sleeve: SLEEVE_SHORT,
    hem: 860,
    box: { x: 20, y: 100, w: 960, h: 790 },
  },
  football: {
    neck: "v",
    frontDepth: 215,
    backDepth: 160,
    sleeve: SLEEVE_SHORT,
    hem: 860,
    box: { x: 20, y: 100, w: 960, h: 790 },
  },
  hoodies: {
    neck: "round",
    frontDepth: 170,
    backDepth: 150,
    sleeve: SLEEVE_LONG,
    hem: 816,
    hood: true,
    box: { x: 10, y: 10, w: 980, h: 920 },
  },
};
const styleOf = (def: GarmentDefinition): FlatStyle => STYLES[def.family] ?? STYLES.tshirts!;

const torso = (st: FlatStyle, neckDepth: number): Pt[] => {
  const neckline: Pt[] =
    st.neck === "v"
      ? [
          [400, 132],
          [500, neckDepth],
          [600, 132],
        ]
      : [
          [400, 132],
          [430, neckDepth - 22],
          [500, neckDepth],
          [570, neckDepth - 22],
          [600, 132],
        ];
  return [
    [300, 150],
    ...neckline,
    [700, 150],
    [780, 300],
    [776, st.hem],
    [224, st.hem],
    [220, 300],
  ];
};
/** Capuche vue de face (ouverte autour du cou) ou de dos (à plat sur les épaules). */
const hood = (front: boolean): Pt[] =>
  front
    ? [
        [380, 140],
        [345, 70],
        [420, 22],
        [500, 12],
        [580, 22],
        [655, 70],
        [620, 140],
        [500, 190],
      ]
    : [
        [380, 140],
        [350, 80],
        [430, 40],
        [500, 34],
        [570, 40],
        [650, 80],
        [620, 140],
        [500, 175],
      ];
const collar = (depth: number): Pt[] => [
  [392, 128],
  [500, depth],
  [608, 128],
  [630, 136],
  [500, depth + 32],
  [370, 136],
];

const place = (zone: string, outline: readonly Pt[], shade = false, rect = bbox(outline)) => ({
  zone,
  outline,
  rect,
  shade,
});

/** Torse : rectangle fixe en largeur (le col ne réduit pas la zone imprimable) ; la hauteur suit l'UV. */
const TORSO_W = 560;
const torsoRect = (st: FlatStyle) => ({ x: 220, y: 132, w: TORSO_W, h: st.hem - 132 });

/** Manche dépliée : bande aux proportions réelles de l'UV (largeur = tour de manche). */
function sleeveStrip(zone: string, aspect: number): Placement {
  const w = 900;
  const h = w / aspect;
  const rect = { x: 50, y: 60, w, h };
  const outline: Pt[] = [
    [rect.x, rect.y],
    [rect.x + w, rect.y],
    [rect.x + w, rect.y + h],
    [rect.x, rect.y + h],
  ];
  return { zone, rect, outline, shade: false };
}

export function viewLayout(view: FlatView, def: GarmentDefinition): ViewLayout {
  if (view === "left" || view === "right") {
    const zone = view === "left" ? "SLEEVE_LEFT" : "SLEEVE_RIGHT";
    const uv = def.zones.find((z) => z.code === zone)?.uvRect;
    const aspect = uv ? uv.w / uv.h : 2.4;
    const p = sleeveStrip(zone, aspect);
    return { view, box: { x: 0, y: 0, w: 1000, h: p.rect.h + 120 }, placements: [p] };
  }
  const front = view === "front";
  // Vu de face, la manche gauche du porteur est à droite de l'écran (et inversement au dos).
  const viewerLeft = front ? "SLEEVE_RIGHT" : "SLEEVE_LEFT";
  const viewerRight = front ? "SLEEVE_LEFT" : "SLEEVE_RIGHT";
  const st = styleOf(def);
  const depth = front ? st.frontDepth : st.backDepth;
  const placements: Placement[] = [
    place(viewerLeft, st.sleeve, true),
    place(viewerRight, mirror(st.sleeve), true),
    place(front ? "BODY_FRONT" : "BODY_BACK", torso(st, depth), true, torsoRect(st)),
    place("COLLAR", st.hood ? hood(front) : collar(depth - 3)),
  ].filter((p) => def.zones.some((z) => z.code === p.zone));
  return { view, box: st.box, placements };
}

/** Pixels d'export par unité de vue (le torse a la largeur imprimable réelle de la zone). */
export function rulerScale(def: GarmentDefinition, exportSize: number): number {
  const body = def.zones.find((z) => z.code === "BODY_FRONT")?.uvRect;
  return body ? (body.w * exportSize) / TORSO_W : 4;
}

export function pointInPolygon(pts: readonly Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Point (unités de vue) → coordonnées UV de l'atlas, extrapolées hors du rectangle. */
export function placementToUv(
  p: Placement,
  def: GarmentDefinition,
  x: number,
  y: number,
): { zone: string; u: number; v: number } | null {
  const uv = def.zones.find((z) => z.code === p.zone)?.uvRect;
  if (!uv) return null;
  const fx = (x - p.rect.x) / p.rect.w;
  const fy = (y - p.rect.y) / p.rect.h;
  return { zone: p.zone, u: uv.x + fx * uv.w, v: uv.y + fy * uv.h };
}
