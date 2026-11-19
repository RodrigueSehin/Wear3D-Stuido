/**
 * Éléments graphiques intégrés (formes, motifs dynamiques, décorations, icônes, sports).
 * Vectoriels : un élément « teintable » est dessiné d'une seule couleur, que le calque
 * applique ensuite (propriété `tint`) ; les balles sportives gardent leurs couleurs.
 * Identifiant d'asset : `element:<code>`.
 */

export type ElementTab = "shapes" | "icons" | "decorations";

export interface ElementDef {
  code: string;
  label: string;
  section: string;
  tab: ElementTab;
  /** Monochrome : peut être recoloré par le calque. */
  tintable: boolean;
  /** SVG (viewBox 0 0 100 100) ; `{c}` est remplacé par la couleur. */
  body: string;
}

export const ELEMENT_PREFIX = "element:";

export const ELEMENT_SECTIONS: { id: string; label: string; tab: ElementTab }[] = [
  { id: "geometric", label: "Formes géométriques", tab: "shapes" },
  { id: "dynamic", label: "Motifs dynamiques", tab: "shapes" },
  { id: "decor", label: "Éléments décoratifs", tab: "decorations" },
  { id: "sports", label: "Motifs sportifs", tab: "icons" },
  { id: "symbols", label: "Symboles", tab: "icons" },
];

const C = "{c}";

function poly(cx: number, cy: number, r: number, n: number, rot = -90, inner = 1): string {
  const pts: string[] = [];
  const steps = n * (inner === 1 ? 1 : 2);
  for (let k = 0; k < steps; k++) {
    const rad = k % 2 && inner !== 1 ? r * inner : r;
    const a = ((rot + (360 / steps) * k) * Math.PI) / 180;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const fillPoly = (points: string) => `<polygon points="${points}" fill="${C}"/>`;

/** Branche de laurier (côté gauche) : tige en arc et feuilles pointues alternées. */
function laurel(mirror: boolean): string {
  const R = 38;
  const pt = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return [50 + R * Math.cos(r), 52 - R * Math.sin(r)] as const;
  };
  const [sx, sy] = pt(250);
  const [ex, ey] = pt(125);
  const stem = `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)} A ${R} ${R} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${C}" stroke-width="3"/>`;
  const n = 8;
  const leaves = Array.from({ length: n }, (_, i) => {
    const deg = 245 - (i / (n - 1)) * 115;
    const [x, y] = pt(deg);
    const [nx, ny] = pt(deg - 4);
    const dir = (Math.atan2(nx - x, -(ny - y)) * 180) / Math.PI; // 0° = vers le haut
    const tilt = i % 2 ? 38 : -38;
    return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(dir + tilt).toFixed(0)})" d="M0 0 C6 -5 6 -15 0 -22 C-6 -15 -6 -5 0 0Z" fill="${C}"/>`;
  }).join("");
  return `<g${mirror ? ' transform="translate(100 0) scale(-1 1)"' : ""}>${stem}${leaves}</g>`;
}

const wingHalf = (mirror: boolean) =>
  `<g${mirror ? ' transform="translate(100 0) scale(-1 1)"' : ""}>` +
  `<path d="M48 70 L6 44 L12 36 L48 52Z" fill="${C}"/>` +
  `<path d="M48 58 L4 28 L12 20 L48 40Z" fill="${C}"/>` +
  `<path d="M48 46 L10 12 L22 10 L48 28Z" fill="${C}"/>` +
  `<path d="M48 34 L24 4 L38 6 L48 18Z" fill="${C}"/>` +
  `</g>`;

const dots = (cols: number, rows: number, r: number) => {
  const out: string[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++)
      out.push(
        `<circle cx="${(((i + 0.5) / cols) * 100).toFixed(1)}" cy="${(((j + 0.5) / rows) * 100).toFixed(1)}" r="${r}" fill="${C}"/>`,
      );
  return out.join("");
};

const el = (
  section: string,
  tab: ElementTab,
  code: string,
  label: string,
  body: string,
  tintable = true,
): ElementDef => ({ section, tab, code, label, body, tintable });

const G = (code: string, label: string, body: string) =>
  el("geometric", "shapes", code, label, body);
const D = (code: string, label: string, body: string) => el("dynamic", "shapes", code, label, body);
const DEC = (code: string, label: string, body: string) =>
  el("decor", "decorations", code, label, body);
const SYM = (code: string, label: string, body: string) =>
  el("symbols", "icons", code, label, body);

const BALL_NAVY = "#0B2A8F";

export const ELEMENTS: readonly ElementDef[] = [
  G("circle", "Cercle", `<circle cx="50" cy="50" r="44" fill="${C}"/>`),
  G("square", "Carré", `<rect x="8" y="8" width="84" height="84" fill="${C}"/>`),
  G("triangle", "Triangle", fillPoly("50,8 94,90 6,90")),
  G("star", "Étoile", fillPoly(poly(50, 54, 46, 5, -90, 0.42))),
  G(
    "heart",
    "Cœur",
    `<path d="M50 90 C14 62 6 42 6 30 C6 16 17 8 29 8 C39 8 46 14 50 22 C54 14 61 8 71 8 C83 8 94 16 94 30 C94 42 86 62 50 90Z" fill="${C}"/>`,
  ),
  G("diamond", "Losange", fillPoly("50,4 94,50 50,96 6,50")),
  G("hexagon", "Hexagone", fillPoly(poly(50, 50, 46, 6, 0))),
  G(
    "ring",
    "Anneau",
    `<circle cx="50" cy="50" r="38" fill="none" stroke="${C}" stroke-width="12"/>`,
  ),
  G(
    "cross",
    "Croix",
    fillPoly("38,6 62,6 62,38 94,38 94,62 62,62 62,94 38,94 38,62 6,62 6,38 38,38"),
  ),

  D(
    "double-chevron",
    "Chevrons",
    `<path d="M6 14 L38 50 L6 86 L26 86 L58 50 L26 14Z M44 14 L76 50 L44 86 L64 86 L96 50 L64 14Z" fill="${C}"/>`,
  ),
  D("arrow", "Flèche", fillPoly("6,38 56,38 56,18 94,50 56,82 56,62 6,62")),
  D("dots-grid", "Points", dots(3, 3, 8)),
  D(
    "diagonal-stripes",
    "Rayures",
    `<g fill="${C}"><polygon points="0,30 30,0 50,0 0,50"/><polygon points="0,70 70,0 90,0 0,90"/><polygon points="30,100 100,30 100,50 50,100"/><polygon points="70,100 100,70 100,90 90,100"/></g>`,
  ),
  D("dots-fine", "Pointillés", dots(7, 7, 4)),
  D(
    "lines",
    "Lignes",
    `<g fill="${C}">${[10, 28, 46, 64, 82].map((y) => `<rect x="4" y="${y}" width="92" height="8" rx="2"/>`).join("")}</g>`,
  ),
  D(
    "zigzag",
    "Zigzag",
    `<polyline points="4,70 20,30 36,70 52,30 68,70 84,30 96,60" fill="none" stroke="${C}" stroke-width="10" stroke-linejoin="miter"/>`,
  ),
  D(
    "waves",
    "Vagues",
    `<g fill="none" stroke="${C}" stroke-width="9" stroke-linecap="round">${[26, 50, 74]
      .map((y) => `<path d="M4 ${y} Q 20 ${y - 16} 36 ${y} T 68 ${y} T 98 ${y}"/>`)
      .join("")}</g>`,
  ),

  DEC(
    "crown",
    "Couronne",
    `<path d="M8 74 L12 28 L34 50 L50 18 L66 50 L88 28 L92 74Z" fill="${C}"/><rect x="8" y="78" width="84" height="12" rx="2" fill="${C}"/>`,
  ),
  DEC("laurel", "Laurier", laurel(false) + laurel(true)),
  DEC("wings", "Ailes", wingHalf(false) + wingHalf(true)),
  DEC(
    "shield",
    "Bouclier",
    `<path d="M50 5 L89 17 V50 C89 73 71 89 50 96 C29 89 11 73 11 50 V17 Z" fill="${C}"/>`,
  ),
  DEC("bolt", "Éclair", fillPoly("60,4 22,56 46,56 38,96 78,40 54,40")),
  DEC(
    "trophy",
    "Trophée",
    `<path d="M28 10 H72 V40 C72 58 62 66 50 66 C38 66 28 58 28 40Z" fill="${C}"/>` +
      `<path d="M28 18 H12 C12 38 20 46 32 48 M72 18 H88 C88 38 80 46 68 48" fill="none" stroke="${C}" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="45" y="66" width="10" height="14" fill="${C}"/><rect x="30" y="80" width="40" height="11" rx="2" fill="${C}"/>`,
  ),
  DEC("banner", "Bandeau", `<path d="M4 28 H96 L84 50 L96 72 H4 L16 50Z" fill="${C}"/>`),
  DEC(
    "ribbon",
    "Ruban",
    `<circle cx="50" cy="36" r="28" fill="${C}"/><path d="M30 58 L22 96 L50 84 L78 96 L70 58Z" fill="${C}"/>`,
  ),

  el(
    "sports",
    "icons",
    "football",
    "Football",
    `<circle cx="50" cy="50" r="44" fill="#fff" stroke="${BALL_NAVY}" stroke-width="4"/>` +
      `<polygon points="${poly(50, 50, 16, 5)}" fill="${BALL_NAVY}"/>` +
      Array.from({ length: 5 }, (_, k) => {
        const a = ((-90 + 72 * k) * Math.PI) / 180;
        return `<line x1="${(50 + 16 * Math.cos(a)).toFixed(1)}" y1="${(50 + 16 * Math.sin(a)).toFixed(1)}" x2="${(50 + 42 * Math.cos(a)).toFixed(1)}" y2="${(50 + 42 * Math.sin(a)).toFixed(1)}" stroke="${BALL_NAVY}" stroke-width="3.5"/>`;
      }).join(""),
    false,
  ),
  el(
    "sports",
    "icons",
    "basketball",
    "Basketball",
    `<circle cx="50" cy="50" r="44" fill="#F28C28" stroke="#1B1B1B" stroke-width="3"/>` +
      `<g fill="none" stroke="#1B1B1B" stroke-width="3"><path d="M6 50 H94 M50 6 V94"/><path d="M18 18 C34 34 34 66 18 82 M82 18 C66 34 66 66 82 82"/></g>`,
    false,
  ),
  el(
    "sports",
    "icons",
    "volleyball",
    "Volleyball",
    `<circle cx="50" cy="50" r="44" fill="#fff" stroke="${BALL_NAVY}" stroke-width="3.5"/>` +
      `<g fill="none" stroke="${BALL_NAVY}" stroke-width="3.5" stroke-linecap="round"><path d="M50 6 C34 24 34 46 50 50 C66 54 80 70 88 76"/><path d="M12 30 C32 30 44 40 50 50 C54 70 44 84 30 92"/><path d="M88 30 C74 34 60 36 50 50 C42 62 22 70 10 66"/></g>`,
    false,
  ),
  el(
    "sports",
    "icons",
    "baseball",
    "Baseball",
    `<circle cx="50" cy="50" r="44" fill="#fff" stroke="#9aa3b5" stroke-width="3"/>` +
      `<g fill="none" stroke="#D3202E" stroke-width="3"><path d="M26 12 C40 30 40 70 26 88"/><path d="M74 12 C60 30 60 70 74 88"/></g>` +
      `<g stroke="#D3202E" stroke-width="2.5">${[24, 36, 48, 60, 72]
        .map((y, i) => `<path d="M${i % 2 ? 24 : 26} ${y} l-8 2 M${i % 2 ? 76 : 74} ${y} l8 2"/>`)
        .join("")}</g>`,
    false,
  ),

  SYM(
    "flame",
    "Flamme",
    `<path d="M50 4 C58 26 80 36 78 60 C76 82 62 96 50 96 C36 96 22 84 22 64 C22 48 34 42 38 28 C44 34 46 40 46 48 C56 38 56 20 50 4Z" fill="${C}"/>`,
  ),
  SYM(
    "target",
    "Cible",
    `<g fill="none" stroke="${C}" stroke-width="9"><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="21"/></g><circle cx="50" cy="50" r="7" fill="${C}"/>`,
  ),
  SYM(
    "check",
    "Coche",
    `<polyline points="12,54 38,80 90,22" fill="none" stroke="${C}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
  SYM(
    "sun",
    "Soleil",
    `<circle cx="50" cy="50" r="20" fill="${C}"/><g stroke="${C}" stroke-width="8" stroke-linecap="round">${Array.from(
      { length: 8 },
      (_, k) => {
        const a = (k * Math.PI) / 4;
        return `<line x1="${(50 + 32 * Math.cos(a)).toFixed(1)}" y1="${(50 + 32 * Math.sin(a)).toFixed(1)}" x2="${(50 + 44 * Math.cos(a)).toFixed(1)}" y2="${(50 + 44 * Math.sin(a)).toFixed(1)}"/>`;
      },
    ).join("")}</g>`,
  ),
  G("pentagon", "Pentagone", fillPoly(poly(50, 54, 46, 5))),
  G("octagon", "Octogone", fillPoly(poly(50, 50, 46, 8, 22.5))),
  G("half-circle", "Demi-cercle", `<path d="M4 72 A46 46 0 0 1 96 72 Z" fill="${C}"/>`),
  G("parallelogram", "Parallélogramme", fillPoly("28,20 96,20 72,80 4,80")),
  D(
    "speed-lines",
    "Vitesse",
    `<g fill="${C}">${(
      [
        [10, 80],
        [26, 60],
        [42, 88],
        [58, 50],
        [74, 70],
      ] as const
    )
      .map(([y, w]) => `<rect x="${96 - w}" y="${y}" width="${w}" height="8" rx="4"/>`)
      .join("")}</g>`,
  ),
  D(
    "halftone",
    "Trame",
    Array.from({ length: 6 }, (_, i) =>
      Array.from(
        { length: 6 },
        (_, j) =>
          `<circle cx="${8 + i * 17}" cy="${8 + j * 17}" r="${(1.2 + i * 1.3).toFixed(1)}" fill="${C}"/>`,
      ).join(""),
    ).join(""),
  ),
  D(
    "checker",
    "Damier",
    Array.from({ length: 5 }, (_, i) =>
      Array.from({ length: 5 }, (_, j) =>
        (i + j) % 2 ? "" : `<rect x="${i * 20}" y="${j * 20}" width="20" height="20" fill="${C}"/>`,
      ).join(""),
    ).join(""),
  ),
  D(
    "rays",
    "Rayons",
    Array.from({ length: 12 }, (_, k) => {
      const a = (k * Math.PI) / 6;
      const b = a + Math.PI / 14;
      return `<polygon points="50,50 ${(50 + 70 * Math.cos(a)).toFixed(1)},${(50 + 70 * Math.sin(a)).toFixed(1)} ${(50 + 70 * Math.cos(b)).toFixed(1)},${(50 + 70 * Math.sin(b)).toFixed(1)}" fill="${C}"/>`;
    }).join(""),
  ),
  DEC(
    "medal",
    "Médaille",
    `<path d="M30 4 L46 40 L38 44 L22 8Z M70 4 L54 40 L62 44 L78 8Z" fill="${C}"/><circle cx="50" cy="64" r="28" fill="${C}"/>`,
  ),
  DEC("starburst", "Éclat", fillPoly(poly(50, 50, 48, 12, -90, 0.72))),
  DEC(
    "shield-outline",
    "Bouclier vide",
    `<path d="M50 6 L88 18 V50 C88 72 71 88 50 95 C29 88 12 72 12 50 V18 Z" fill="none" stroke="${C}" stroke-width="8" stroke-linejoin="round"/>`,
  ),
  el(
    "sports",
    "icons",
    "tennis",
    "Tennis",
    `<circle cx="50" cy="50" r="44" fill="#D4E157" stroke="#9E9D24" stroke-width="2"/>` +
      `<g fill="none" stroke="#FFFFFF" stroke-width="5"><path d="M14 22 C34 38 34 62 14 78"/><path d="M86 22 C66 38 66 62 86 78"/></g>`,
    false,
  ),
  el(
    "sports",
    "icons",
    "rugby",
    "Rugby",
    `<ellipse cx="50" cy="50" rx="46" ry="28" transform="rotate(-30 50 50)" fill="#8B4513" stroke="#5D2E0C" stroke-width="3"/>` +
      `<g stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"><path d="M34 60 L66 40"/>${[
        0, 1, 2, 3,
      ]
        .map((k) => {
          const x = 40 + k * 7;
          const y = 56 - k * 4.4;
          return `<path d="M${(x - 3).toFixed(1)} ${(y - 5).toFixed(1)} L${(x + 3).toFixed(1)} ${(y + 5).toFixed(1)}"/>`;
        })
        .join("")}</g>`,
    false,
  ),
  SYM(
    "stopwatch",
    "Chrono",
    `<rect x="42" y="4" width="16" height="9" rx="2" fill="${C}"/><circle cx="50" cy="56" r="38" fill="none" stroke="${C}" stroke-width="9"/><path d="M50 56 L50 32" stroke="${C}" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="56" r="6" fill="${C}"/>`,
  ),
  SYM(
    "pulse",
    "Pulsation",
    `<polyline points="4,54 26,54 34,30 46,80 58,18 68,54 96,54" fill="none" stroke="${C}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
  SYM(
    "infinity",
    "Infini",
    `<path d="M50 50 C38 30 12 30 12 50 C12 70 38 70 50 50 C62 30 88 30 88 50 C88 70 62 70 50 50Z" fill="none" stroke="${C}" stroke-width="9"/>`,
  ),
];

export function elementByAssetId(assetId: string): ElementDef | undefined {
  return assetId.startsWith(ELEMENT_PREFIX)
    ? ELEMENTS.find((e) => e.code === assetId.slice(ELEMENT_PREFIX.length))
    : undefined;
}

export function elementSvg(def: ElementDef, color = "#000000", size = 512): string {
  const body = def.body.replaceAll(C, color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${body}</svg>`;
}

/** URL directe pour un <img> (vignettes du panneau). */
export function elementDataUrl(def: ElementDef, color: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(elementSvg(def, color, 128))}`;
}

export function filterElements(tab: ElementTab, query: string): ElementDef[] {
  const q = query.trim().toLowerCase();
  return ELEMENTS.filter((e) => e.tab === tab && (!q || e.label.toLowerCase().includes(q)));
}
