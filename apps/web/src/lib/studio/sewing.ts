/**
 * Patron de couture (vue « Patron ») : pièces du vêtement à plat, gradation par taille,
 * marges de couture, plan de coupe et exports de fabrication (PDF 1:1, PLT, SVG).
 *
 * Unités : centimètres. Chaque pièce imprimée correspond à une zone de l'atlas :
 * son rectangle englobant est projeté linéairement sur le rectangle UV de la zone,
 * ce qui garde la vue Patron synchronisée avec la 3D (même texture, mêmes calques).
 */
import type { Grainline, Sewing, SewingPiece } from "@wear3d/design-schema";

export type Pt = readonly [number, number];
export type PatternTab = "pattern" | "cutplan" | "assembly" | "grading";
export type PatternUnit = "mm" | "cm" | "in";
export type PatternSide = "front" | "back";

export const PATTERN_TABS: { id: PatternTab; label: string }[] = [
  { id: "pattern", label: "Patron de couture" },
  { id: "cutplan", label: "Plan de coupe" },
  { id: "assembly", label: "Marges & Assemblage" },
  { id: "grading", label: "Tailles & Gradation" },
];

export const GRAIN_LABELS: Record<Grainline, string> = {
  vertical: "Droit-fil vertical",
  horizontal: "Droit-fil horizontal",
  bias: "Biais (45°)",
};

export interface PieceDef {
  id: string;
  label: string;
  /** Zone de l'atlas imprimée sur la pièce ; null = pièce unie. */
  zone: string | null;
  /** Zone dont la pièce reprend la couleur (pièces unies). */
  colorZone: string;
  /** Nombre de coupes par défaut. */
  cut: number;
  /** Dimensions nominales (cm) en taille L, et pas de gradation par taille. */
  base: [number, number];
  step: [number, number];
  /** Flèche de la pièce (cols cintrés) : hauteur ajoutée au cadre, en cm. */
  sag?: number;
  /** Contour normalisé (0..1 du cadre). */
  shape: (h: number) => Pt[];
  /** Crans de montage (normalisés). */
  notches: readonly Pt[];
}

/* ---------- Formes ---------- */

/** Courbe quadratique échantillonnée (sans le premier point). */
function quad(p0: Pt, c: Pt, p1: Pt, n = 10): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const d = t * t;
    out.push([a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]]);
  }
  return out;
}

/** Corps (devant ou dos) : encolure, épaules, emmanchures, côtés, ourlet. */
function body(neck: number): Pt[] {
  const A: Pt = [0.33, 0];
  const B: Pt = [0.5, neck];
  const C: Pt = [0.67, 0];
  const D: Pt = [0.96, 0.06];
  const E: Pt = [1, 0.3];
  const F: Pt = [0.98, 1];
  const G: Pt = [0.02, 1];
  const H: Pt = [0, 0.3];
  const I: Pt = [0.04, 0.06];
  return [
    A,
    ...quad(A, [0.36, neck * 0.75], B, 8),
    ...quad(B, [0.64, neck * 0.75], C, 8),
    D,
    ...quad(D, [0.9, 0.22], E, 8),
    F,
    G,
    H,
    ...quad(H, [0.1, 0.22], I, 8),
  ];
}

const SLEEVE = (): Pt[] => {
  const L: Pt = [0, 0.55];
  const T: Pt = [0.5, 0];
  const R: Pt = [1, 0.55];
  return [
    [0.04, 1],
    L,
    ...quad(L, [0.16, 0.04], T, 12),
    ...quad(T, [0.84, 0.04], R, 12),
    [0.96, 1],
  ];
};

/** Col cintré : bande dont les deux bords suivent la même courbe. */
const COLLAR = (h: number): Pt[] => {
  const top = quad([0, 0], [0.5, 2 * (1 - h)], [1, 0], 16);
  const bottom = quad([1, h], [0.5, 2 * (1 - h) + h * 0.7], [0, h], 16);
  return [[0, 0], ...top, [1, h], ...bottom];
};

const RECT = (): Pt[] => [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

export const PIECES: readonly PieceDef[] = [
  {
    id: "front",
    label: "Devant (corps)",
    zone: "BODY_FRONT",
    colorZone: "BODY_FRONT",
    cut: 1,
    base: [53, 73],
    step: [3, 2],
    shape: () => body(0.17),
    notches: [
      [0.82, 0.03],
      [0.18, 0.03],
      [0.985, 0.24],
      [0.015, 0.24],
    ],
  },
  {
    id: "back",
    label: "Dos (corps)",
    zone: "BODY_BACK",
    colorZone: "BODY_BACK",
    cut: 1,
    base: [53, 73],
    step: [3, 2],
    shape: () => body(0.05),
    notches: [
      [0.82, 0.03],
      [0.18, 0.03],
      [0.985, 0.24],
      [0.015, 0.24],
    ],
  },
  {
    id: "sleeve-left",
    label: "Manche gauche",
    zone: "SLEEVE_LEFT",
    colorZone: "SLEEVE_LEFT",
    cut: 1,
    base: [37.2, 22],
    step: [1.6, 0.6],
    shape: SLEEVE,
    notches: [
      [0.5, 0],
      [0.2, 0.2],
      [0.8, 0.2],
    ],
  },
  {
    id: "sleeve-right",
    label: "Manche droite",
    zone: "SLEEVE_RIGHT",
    colorZone: "SLEEVE_RIGHT",
    cut: 1,
    base: [37.2, 22],
    step: [1.6, 0.6],
    shape: SLEEVE,
    notches: [
      [0.5, 0],
      [0.2, 0.2],
      [0.8, 0.2],
    ],
  },
  {
    id: "collar-outer",
    label: "Col (extérieur)",
    zone: "COLLAR",
    colorZone: "COLLAR",
    cut: 1,
    base: [42, 5],
    step: [2, 0],
    sag: 4,
    shape: COLLAR,
    notches: [[0.5, 0.5]],
  },
  {
    id: "collar-inner",
    label: "Col (intérieur)",
    zone: null,
    colorZone: "COLLAR",
    cut: 1,
    base: [42, 5],
    step: [2, 0],
    sag: 3,
    shape: COLLAR,
    notches: [[0.5, 0.5]],
  },
  {
    id: "cuff",
    label: "Bord de manche",
    zone: null,
    // Couleur : celle des bords de manche (finitions) s'ils sont activés, sinon le col.
    colorZone: "COLLAR",
    cut: 2,
    base: [26, 5],
    step: [1, 0],
    shape: RECT,
    notches: [[0.5, 0]],
  },
];

/** Manche longue : emmanchure arrondie puis tube qui se resserre vers le poignet. */
const SLEEVE_LONG = (): Pt[] => {
  const L: Pt = [0, 0.2];
  const T: Pt = [0.5, 0];
  const R: Pt = [1, 0.2];
  return [[0.3, 1], L, ...quad(L, [0.12, 0.01], T, 12), ...quad(T, [0.88, 0.01], R, 12), [0.7, 1]];
};

/** Capuche : un côté, en forme de « L » arrondi (deux pièces assemblées au milieu). */
const HOOD = (): Pt[] => [
  [0.1, 1],
  [0, 0.45],
  ...quad([0, 0.45], [0, 0], [0.55, 0], 10),
  ...quad([0.55, 0], [0.95, 0.02], [0.92, 0.45], 8),
  [1, 1],
];

type Tweak = Partial<Pick<PieceDef, "label" | "base" | "step" | "shape" | "cut" | "sag">>;
interface PatternProfile {
  tweaks: Record<string, Tweak>;
  /** Pièces absentes de ce vêtement. */
  drop?: readonly string[];
}

const PROFILES: Record<string, PatternProfile> = {
  tshirts: { tweaks: {} },
  // Maillot : col en V devant, manches courtes, simple bord-côte à l'encolure.
  football: {
    tweaks: {
      front: { base: [51, 70], shape: () => body(0.27) },
      back: { base: [51, 70], shape: () => body(0.04) },
      "sleeve-left": { base: [35, 19] },
      "sleeve-right": { base: [35, 19] },
      "collar-outer": { label: "Bord-côte d'encolure", base: [38, 3], sag: 8 },
      cuff: { base: [24, 4] },
    },
    drop: ["collar-inner"],
  },
  // Hoodie : corps ample et long, manches longues, capuche en deux pièces.
  hoodies: {
    tweaks: {
      front: { base: [58, 72], shape: () => body(0.1) },
      back: { base: [58, 74], shape: () => body(0.04) },
      "sleeve-left": { base: [38, 62], step: [1.6, 1], shape: SLEEVE_LONG },
      "sleeve-right": { base: [38, 62], step: [1.6, 1], shape: SLEEVE_LONG },
      "collar-outer": {
        label: "Capuche (côté)",
        base: [32, 36],
        step: [1, 0.5],
        sag: 0,
        cut: 2,
        shape: HOOD,
      },
      cuff: { base: [20, 9] },
    },
    drop: ["collar-inner"],
  },
};

/** Pièces du modèle : forme, dimensions et pièces propres à chaque vêtement ; bord de manche seulement s'il en a. */
export function availablePieces(
  def: { family?: string; trims?: { cuffs?: unknown } } | null,
): readonly PieceDef[] {
  const profile = PROFILES[def?.family ?? "tshirts"] ?? PROFILES.tshirts!;
  return PIECES.filter(
    (p) => (p.id !== "cuff" || Boolean(def?.trims?.cuffs)) && !profile.drop?.includes(p.id),
  ).map((p) => ({ ...p, ...profile.tweaks[p.id] }));
}

/* ---------- Tailles, réglages ---------- */

const SIZE_STEP: Record<string, number> = { XS: -3, S: -2, M: -1, L: 0, XL: 1, XXL: 2, "3XL": 3 };

/** Dimensions nominales (cm) d'une pièce dans une taille. */
export function pieceSize(p: PieceDef, size: string): { w: number; h: number } {
  const k = SIZE_STEP[size] ?? 0;
  return { w: p.base[0] + k * p.step[0], h: p.base[1] + k * p.step[1] };
}

/** Cadre réel de la pièce (les cols cintrés sont plus hauts que leur largeur de bande). */
export function pieceFrame(p: PieceDef, size: string): { w: number; h: number } {
  const s = pieceSize(p, size);
  return { w: s.w, h: s.h + (p.sag ?? 0) };
}

export const DEFAULT_PIECE: SewingPiece = {
  seam: 1,
  grain: "vertical",
  comment: "",
  hidden: false,
};

export function pieceSettings(
  sewing: Sewing | undefined,
  p: PieceDef,
): SewingPiece & { cut: number } {
  const s = { ...DEFAULT_PIECE, ...(sewing?.pieces[p.id] ?? {}) };
  return { ...s, cut: s.cut ?? p.cut };
}

/** Contour d'une pièce en cm (origine en haut à gauche du cadre). */
export function pieceOutline(p: PieceDef, size: string): Pt[] {
  const f = pieceFrame(p, size);
  const band = p.sag ? pieceSize(p, size).h / f.h : 1;
  return p.shape(band).map(([x, y]) => [x * f.w, y * f.h] as const);
}

export function polygonArea(pts: readonly Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x2, y2] = pts[(i + 1) % pts.length]!;
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** Contour décalé vers l'extérieur (marge de couture), jointures en onglet bornées. */
export function offsetOutline(pts: readonly Pt[], d: number): Pt[] {
  if (d <= 0) return [...pts];
  const sign = polygonArea(pts) > 0 ? 1 : -1;
  const n = pts.length;
  const normal = (a: Pt, b: Pt): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    // Écran (y vers le bas) : pour un contour horaire, l'extérieur est à gauche du sens de marche.
    return [(-dy / len) * -sign, (dx / len) * -sign];
  };
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n]!;
    const next = pts[(i + 1) % n]!;
    const n1 = normal(prev, p);
    const n2 = normal(p, next);
    let nx = n1[0] + n2[0];
    let ny = n1[1] + n2[1];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const cos = Math.max(0.35, nx * n1[0] + ny * n1[1]);
    return [p[0] + (nx * d) / cos, p[1] + (ny * d) / cos] as const;
  });
}

/* ---------- Mises en page ---------- */

export interface PlacedPiece {
  piece: PieceDef;
  /** Coin haut gauche du cadre, en cm. */
  x: number;
  y: number;
  /** Seconde coupe : pièce retournée (miroir). */
  mirrored: boolean;
  copy: number;
}

export interface Sheet {
  placed: PlacedPiece[];
  width: number;
  height: number;
  /** Plan de coupe : métrage utilisé et rendement. */
  fabricLength?: number;
  efficiency?: number;
}

const GAP = 7;

/** Patron de couture : pièces rangées par rangées (manches, corps, cols et bords). */
export function sheetLayout(
  sewing: Sewing | undefined,
  size: string,
  pieces: readonly PieceDef[] = PIECES,
): Sheet {
  const visible = pieces.filter((p) => !pieceSettings(sewing, p).hidden);
  const rows = [
    visible.filter((p) => p.id.startsWith("sleeve")),
    visible.filter((p) => p.id === "front" || p.id === "back"),
    visible.filter((p) => p.id.startsWith("collar") || p.id === "cuff"),
  ];
  const placed: PlacedPiece[] = [];
  let y = 4;
  let width = 0;
  for (const row of rows) {
    if (!row.length) continue;
    let x = 4;
    let rowH = 0;
    for (const p of row) {
      const f = pieceFrame(p, size);
      placed.push({ piece: p, x, y, mirrored: false, copy: 0 });
      x += f.w + GAP;
      rowH = Math.max(rowH, f.h);
    }
    width = Math.max(width, x);
    y += rowH + GAP + 6;
  }
  return { placed, width: width + 4 - GAP, height: y };
}

/**
 * Plan de coupe : chaque coupe (avec sa marge) est placée en rangées sur la laize.
 * Les secondes coupes sont retournées. Donne le métrage et le rendement matière.
 */
export function cutPlanLayout(
  sewing: Sewing | undefined,
  size: string,
  pieces: readonly PieceDef[] = PIECES,
): Sheet {
  const W = sewing?.fabricWidth ?? 150;
  const items: { piece: PieceDef; copy: number; w: number; h: number; seam: number }[] = [];
  for (const p of pieces) {
    const s = pieceSettings(sewing, p);
    if (s.hidden) continue;
    const f = pieceFrame(p, size);
    for (let c = 0; c < s.cut; c++)
      items.push({ piece: p, copy: c, w: f.w + 2 * s.seam, h: f.h + 2 * s.seam, seam: s.seam });
  }
  items.sort((a, b) => b.h - a.h);
  const placed: PlacedPiece[] = [];
  const margin = 2;
  let x = margin;
  let y = margin;
  let rowH = 0;
  let used = 0;
  for (const it of items) {
    if (x + it.w > W - margin && x > margin) {
      x = margin;
      y += rowH + 1.5;
      rowH = 0;
    }
    placed.push({
      piece: it.piece,
      x: x + it.seam,
      y: y + it.seam,
      mirrored: it.copy % 2 === 1,
      copy: it.copy,
    });
    used += Math.abs(polygonArea(pieceOutline(it.piece, size)));
    x += it.w + 1.5;
    rowH = Math.max(rowH, it.h);
  }
  const length = y + rowH + margin;
  return {
    placed,
    width: W,
    height: length,
    fabricLength: length,
    efficiency: used / (W * length),
  };
}

/* ---------- Unités ---------- */

export const UNIT_FACTOR: Record<PatternUnit, number> = { mm: 10, cm: 1, in: 1 / 2.54 };

export function formatLength(cm: number, unit: PatternUnit): string {
  const v = cm * UNIT_FACTOR[unit];
  const digits = unit === "mm" ? 0 : unit === "cm" ? 1 : 2;
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${unit === "in" ? "po" : unit}`;
}

/* ---------- Exports de fabrication ---------- */

interface ExportPiece {
  label: string;
  outline: Pt[];
  seamLine: Pt[];
  notches: { at: Pt; dir: Pt }[];
  grain: { from: Pt; to: Pt };
  text: string;
}

function centroid(pts: readonly Pt[]): Pt {
  const n = pts.length;
  return [pts.reduce((a, p) => a + p[0], 0) / n, pts.reduce((a, p) => a + p[1], 0) / n];
}

/** Géométrie absolue (cm) de chaque coupe d'une mise en page, prête à exporter. */
export function exportGeometry(
  sheet: Sheet,
  sewing: Sewing | undefined,
  size: string,
): ExportPiece[] {
  return sheet.placed.map(({ piece, x, y, mirrored, copy }) => {
    const s = pieceSettings(sewing, piece);
    const f = pieceFrame(piece, size);
    const place = (p: Pt): Pt => [x + (mirrored ? f.w - p[0] : p[0]), y + p[1]];
    const local = pieceOutline(piece, size);
    const outline = local.map(place);
    const seamLine = offsetOutline(local, s.seam).map(place);
    const c = centroid(local);
    const notches = piece.notches.map(([nx, ny]) => {
      const at: Pt = [nx * f.w, ny * f.h];
      const len = Math.hypot(c[0] - at[0], c[1] - at[1]) || 1;
      const dir: Pt = [((c[0] - at[0]) / len) * 0.8, ((c[1] - at[1]) / len) * 0.8];
      return { at: place(at), dir: (mirrored ? [-dir[0], dir[1]] : dir) as Pt };
    });
    const g = Math.min(f.w, f.h) * 0.3;
    const cx = x + f.w / 2;
    const cy = y + f.h * 0.55;
    const grain =
      s.grain === "horizontal"
        ? { from: [cx - g, cy] as Pt, to: [cx + g, cy] as Pt }
        : s.grain === "bias"
          ? { from: [cx - g * 0.7, cy + g * 0.7] as Pt, to: [cx + g * 0.7, cy - g * 0.7] as Pt }
          : { from: [cx, cy - g] as Pt, to: [cx, cy + g] as Pt };
    const dims = pieceSize(piece, size);
    return {
      label: piece.label,
      outline,
      seamLine,
      notches,
      grain,
      text: `${piece.label}${s.cut > 1 ? ` (${copy + 1}/${s.cut})` : ""} - T.${size} - ${dims.w.toFixed(1)} x ${dims.h.toFixed(1)} cm - marge ${s.seam} cm`,
    };
  });
}

const ascii = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "");

/** SVG à l'échelle 1:1 (unités en mm). */
export function patternSvg(pieces: ExportPiece[], width: number, height: number): string {
  const mm = (v: number) => (v * 10).toFixed(2);
  const path = (pts: Pt[]) => `M${pts.map((p) => `${mm(p[0])} ${mm(p[1])}`).join(" L")} Z`;
  const body = pieces
    .map(
      (p) => `<g>
  <path d="${path(p.seamLine)}" fill="none" stroke="#000" stroke-width="0.4"/>
  <path d="${path(p.outline)}" fill="none" stroke="#1f5eff" stroke-width="0.3" stroke-dasharray="3 2"/>
  ${p.notches.map((n) => `<line x1="${mm(n.at[0])}" y1="${mm(n.at[1])}" x2="${mm(n.at[0] + n.dir[0])}" y2="${mm(n.at[1] + n.dir[1])}" stroke="#000" stroke-width="0.4"/>`).join("")}
  <line x1="${mm(p.grain.from[0])}" y1="${mm(p.grain.from[1])}" x2="${mm(p.grain.to[0])}" y2="${mm(p.grain.to[1])}" stroke="#000" stroke-width="0.3" marker-start="url(#a)" marker-end="url(#a)"/>
  <text x="${mm(centroid(p.outline)[0])}" y="${mm(centroid(p.outline)[1] - 2)}" font-family="Helvetica, Arial" font-size="5" text-anchor="middle">${p.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
</g>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${mm(width)}mm" height="${mm(height)}mm" viewBox="0 0 ${mm(width)} ${mm(height)}">
<defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>
${body}
</svg>`;
}

/** HPGL / PLT pour traceur-découpeur : stylo 1 = coupe (marge), 2 = couture, 3 = repères. */
export function patternPlt(pieces: ExportPiece[], height: number): string {
  // 40 unités HPGL par mm ; l'axe Y du traceur monte, on retourne la feuille.
  const u = (p: Pt) => `${Math.round(p[0] * 400)},${Math.round((height - p[1]) * 400)}`;
  const poly = (pts: Pt[]) => `PU${u(pts[0]!)};PD${[...pts.slice(1), pts[0]!].map(u).join(",")};`;
  const out = ["IN;", "SP1;"];
  for (const p of pieces) out.push(poly(p.seamLine));
  out.push("SP2;");
  for (const p of pieces) out.push(poly(p.outline));
  out.push("SP3;");
  for (const p of pieces) {
    for (const n of p.notches)
      out.push(`PU${u(n.at)};PD${u([n.at[0] + n.dir[0], n.at[1] + n.dir[1]])};`);
    out.push(`PU${u(p.grain.from)};PD${u(p.grain.to)};`);
    const c = centroid(p.outline);
    out.push(`PU${u([c[0] - 10, c[1]])};DT\x03;SI0.25,0.35;LB${ascii(p.text)}\x03;`);
  }
  out.push("PU;SP0;");
  return out.join("\n");
}

/** PDF vectoriel d'une page à l'échelle 1:1 (police Helvetica, encodage Latin-1). */
export function patternPdf(pieces: ExportPiece[], width: number, height: number): Blob {
  const k = 72 / 2.54; // points par cm
  const W = width * k;
  const H = height * k;
  const pt = (p: Pt) => `${(p[0] * k).toFixed(2)} ${(H - p[1] * k).toFixed(2)}`;
  const poly = (pts: Pt[]) =>
    `${pt(pts[0]!)} m ${pts
      .slice(1)
      .map((p) => `${pt(p)} l`)
      .join(" ")} h S`;
  const esc = (s: string) =>
    s
      .replace(/[^\x20-\xff]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  const ops: string[] = ["0 0 0 RG 0.8 w"];
  for (const p of pieces) ops.push(poly(p.seamLine));
  ops.push("0.12 0.37 1 RG 0.6 w [4 3] 0 d");
  for (const p of pieces) ops.push(poly(p.outline));
  ops.push("[] 0 d 0 0 0 RG 0.8 w");
  for (const p of pieces) {
    for (const n of p.notches)
      ops.push(`${pt(n.at)} m ${pt([n.at[0] + n.dir[0], n.at[1] + n.dir[1]])} l S`);
    ops.push(`${pt(p.grain.from)} m ${pt(p.grain.to)} l S`);
    const c = centroid(p.outline);
    ops.push(
      `BT /F1 9 Tf ${pt([c[0] - p.text.length * 0.09, c[1] - 1])} Td (${esc(p.text)}) Tj ET`,
    );
  }
  // Carré de contrôle de l'échelle : 10 × 10 cm.
  ops.push(
    `${pt([1, height - 11])} m ${pt([11, height - 11])} l ${pt([11, height - 1])} l ${pt([1, height - 1])} l h S`,
  );
  ops.push(`BT /F1 9 Tf ${pt([1.5, height - 6])} Td (Controle d'echelle : 10 x 10 cm) Tj ET`);
  const content = ops.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Latin-1 : un caractère = un octet (les offsets de la table xref restent exacts).
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}
