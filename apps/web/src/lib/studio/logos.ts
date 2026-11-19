/**
 * Bibliothèque de logos intégrés (écussons, emblèmes, mascottes, symboles).
 * Vectoriels et bicolores (bleu / blanc) pour rester lisibles sur un vêtement clair
 * comme foncé. Identifiant d'asset : `logo:<code>` — résolu depuis le code, donc rien
 * à stocker dans le navigateur et les designs enregistrés se rouvrent à l'identique.
 */

export type LogoCategory = "sport" | "crests" | "emblems" | "mascots" | "symbols";

export const LOGO_CATEGORIES: { id: LogoCategory | "all"; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "sport", label: "Sport (Football)" },
  { id: "crests", label: "Écussons" },
  { id: "emblems", label: "Emblèmes" },
  { id: "mascots", label: "Mascottes" },
  { id: "symbols", label: "Symboles" },
];

export interface LogoDef {
  code: string;
  label: string;
  categories: readonly LogoCategory[];
  /** Contenu du SVG (viewBox 0 0 100 100). */
  body: string;
}

export const LOGO_PREFIX = "logo:";

const BLUE = "#1F5EFF";
const NAVY = "#0B2A8F";
const SKY = "#4C8DFF";
const WHITE = "#FFFFFF";

function polygon(cx: number, cy: number, r: number, n: number, rot = -90, inner = 1): string {
  const pts: string[] = [];
  const steps = n * (inner === 1 ? 1 : 2);
  for (let k = 0; k < steps; k++) {
    const rad = k % 2 && inner !== 1 ? r * inner : r;
    const a = ((rot + (360 / steps) * k) * Math.PI) / 180;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const star = (cx: number, cy: number, r: number, fill: string) =>
  `<polygon points="${polygon(cx, cy, r, 5, -90, 0.42)}" fill="${fill}"/>`;

function ball(cx: number, cy: number, r: number, stroke = NAVY): string {
  const hub = polygon(cx, cy, r * 0.36, 5);
  const spokes = Array.from({ length: 5 }, (_, k) => {
    const a = ((-90 + 72 * k) * Math.PI) / 180;
    const x1 = cx + r * 0.36 * Math.cos(a);
    const y1 = cy + r * 0.36 * Math.sin(a);
    const x2 = cx + r * 0.95 * Math.cos(a);
    const y2 = cy + r * 0.95 * Math.sin(a);
    return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
  }).join("");
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${WHITE}" stroke="${stroke}" stroke-width="${r * 0.07}"/>` +
    `<g stroke="${stroke}" stroke-width="${r * 0.06}" stroke-linecap="round">${spokes}</g>` +
    `<polygon points="${hub}" fill="${stroke}"/>`
  );
}

const SHIELD = "M50 5 L89 17 V50 C89 73 71 89 50 96 C29 89 11 73 11 50 V17 Z";

const wing = (mirror: boolean) =>
  `<g${mirror ? ' transform="translate(100 0) scale(-1 1)"' : ""}>` +
  `<path d="M46 62 L6 40 L12 34 L44 48Z" fill="${NAVY}"/>` +
  `<path d="M46 56 L4 28 L12 22 L45 40Z" fill="${BLUE}"/>` +
  `<path d="M46 50 L10 14 L20 12 L46 32Z" fill="${SKY}"/>` +
  `<path d="M46 44 L20 4 L32 6 L46 26Z" fill="${WHITE}" stroke="${BLUE}" stroke-width="1.5" stroke-linejoin="round"/>` +
  `</g>`;

export const LOGOS: readonly LogoDef[] = [
  {
    code: "crest-club",
    label: "Écusson club",
    categories: ["sport", "crests"],
    body:
      `<path d="${SHIELD}" fill="${WHITE}" stroke="${NAVY}" stroke-width="3"/>` +
      `<path d="${SHIELD}" fill="${BLUE}" transform="translate(50 50) scale(.84) translate(-50 -50)"/>` +
      ball(50, 55, 22) +
      star(50, 25, 9, WHITE),
  },
  {
    code: "wear3d-mark",
    label: "Marque W",
    categories: ["emblems", "symbols"],
    body:
      `<polygon points="6,24 24,24 34,62 45,24 55,24 66,62 76,24 94,24 74,80 59,80 50,46 41,80 26,80" fill="${BLUE}"/>` +
      `<polygon points="45,24 55,24 50,46" fill="${SKY}"/>`,
  },
  {
    code: "ball-flame",
    label: "Ballon de feu",
    categories: ["sport"],
    body:
      `<path d="M4 74 C24 66 36 54 48 36 C42 52 46 60 30 78 C22 86 12 84 4 74Z" fill="${BLUE}"/>` +
      `<path d="M10 54 C28 48 40 38 52 20 C48 36 50 42 38 56Z" fill="${SKY}"/>` +
      ball(64, 52, 27),
  },
  {
    code: "crown",
    label: "Couronne",
    categories: ["emblems", "symbols"],
    body:
      `<path d="M10 72 L14 28 L35 50 L50 20 L65 50 L86 28 L90 72Z" fill="${BLUE}" stroke="${NAVY}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<rect x="10" y="76" width="80" height="12" rx="2" fill="${NAVY}"/>` +
      [14, 50, 86]
        .map(
          (x, i) =>
            `<circle cx="${x}" cy="${i === 1 ? 20 : 28}" r="5" fill="${WHITE}" stroke="${NAVY}" stroke-width="2"/>`,
        )
        .join("") +
      [30, 50, 70].map((x) => `<circle cx="${x}" cy="82" r="2.6" fill="${WHITE}"/>`).join(""),
  },
  {
    code: "paw",
    label: "Patte",
    categories: ["mascots"],
    body:
      `<ellipse cx="50" cy="67" rx="23" ry="19" fill="${BLUE}" stroke="${NAVY}" stroke-width="2.5"/>` +
      [
        [20, 46, -25],
        [38, 28, -8],
        [62, 28, 8],
        [80, 46, 25],
      ]
        .map(
          ([x, y, r]) =>
            `<ellipse cx="${x}" cy="${y}" rx="9" ry="12.5" transform="rotate(${r} ${x} ${y})" fill="${BLUE}" stroke="${NAVY}" stroke-width="2.5"/>`,
        )
        .join(""),
  },
  {
    code: "wings",
    label: "Ailes",
    categories: ["mascots", "emblems"],
    body:
      wing(false) +
      wing(true) +
      `<circle cx="50" cy="60" r="17" fill="${WHITE}" stroke="${NAVY}" stroke-width="3"/>` +
      star(50, 60, 11, BLUE),
  },
  {
    code: "trophy",
    label: "Trophée",
    categories: ["sport", "symbols"],
    body:
      `<path d="M30 20 H15 C15 38 22 46 33 48" fill="none" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M70 20 H85 C85 38 78 46 67 48" fill="none" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M28 10 H72 V40 C72 58 62 66 50 66 C38 66 28 58 28 40Z" fill="${BLUE}" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>` +
      `<rect x="45" y="66" width="10" height="13" fill="${NAVY}"/>` +
      `<rect x="30" y="79" width="40" height="11" rx="2" fill="${NAVY}"/>` +
      star(50, 36, 10, WHITE),
  },
  {
    code: "star",
    label: "Étoile",
    categories: ["symbols", "emblems"],
    body: `<polygon points="${polygon(50, 54, 46, 5, -90, 0.42)}" fill="${BLUE}" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>`,
  },
  {
    code: "bolt",
    label: "Éclair",
    categories: ["symbols", "sport"],
    body: `<polygon points="60,4 22,56 46,56 38,96 78,40 54,40" fill="${BLUE}" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>`,
  },
  {
    code: "shield-stripe",
    label: "Écusson diagonal",
    categories: ["crests"],
    body:
      `<defs><clipPath id="s"><path d="${SHIELD}"/></clipPath></defs>` +
      `<path d="${SHIELD}" fill="${BLUE}"/>` +
      `<g clip-path="url(#s)">` +
      `<polygon points="14,100 100,28 100,52 40,100" fill="${WHITE}"/>` +
      `<polygon points="0,60 70,0 92,0 0,82" fill="${SKY}"/></g>` +
      `<path d="${SHIELD}" fill="none" stroke="${NAVY}" stroke-width="3.5"/>`,
  },
  {
    code: "badge-round",
    label: "Badge rond",
    categories: ["crests", "emblems"],
    body:
      `<circle cx="50" cy="50" r="45" fill="${WHITE}" stroke="${NAVY}" stroke-width="3"/>` +
      `<circle cx="50" cy="50" r="36" fill="${BLUE}"/>` +
      `<circle cx="50" cy="50" r="36" fill="none" stroke="${WHITE}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
      star(50, 52, 22, WHITE),
  },
  {
    code: "banner",
    label: "Bandeau",
    categories: ["emblems"],
    body:
      `<path d="M4 30 H96 L84 50 L96 70 H4 L16 50Z" fill="${BLUE}" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>` +
      star(50, 50, 14, WHITE) +
      star(28, 50, 6, SKY) +
      star(72, 50, 6, SKY),
  },
  {
    code: "flame",
    label: "Flamme",
    categories: ["symbols", "sport"],
    body:
      `<path d="M50 4 C58 26 80 36 78 60 C76 82 62 96 50 96 C36 96 22 84 22 64 C22 48 34 42 38 28 C44 34 46 40 46 48 C56 38 56 20 50 4Z" fill="${BLUE}" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M50 52 C56 62 64 66 62 76 C60 86 54 90 50 90 C44 90 38 84 38 76 C38 68 46 64 50 52Z" fill="${SKY}"/>`,
  },
  {
    code: "shield-stars",
    label: "Écusson étoilé",
    categories: ["crests", "sport"],
    body:
      `<path d="${SHIELD}" fill="${WHITE}" stroke="${NAVY}" stroke-width="3"/>` +
      `<path d="${SHIELD}" fill="${NAVY}" transform="translate(50 50) scale(.84) translate(-50 -50)"/>` +
      `<rect x="20" y="44" width="60" height="14" fill="${BLUE}"/>` +
      star(32, 30, 7, WHITE) +
      star(50, 26, 9, WHITE) +
      star(68, 30, 7, WHITE) +
      `<path d="M30 66 L50 82 L70 66" fill="none" stroke="${WHITE}" stroke-width="5" stroke-linejoin="round"/>`,
  },
  {
    code: "medal-one",
    label: "Médaille N°1",
    categories: ["sport", "emblems"],
    body:
      `<path d="M30 4 L44 40 L36 44 L22 8Z M70 4 L56 40 L64 44 L78 8Z" fill="${SKY}"/>` +
      `<circle cx="50" cy="64" r="30" fill="${BLUE}" stroke="${NAVY}" stroke-width="3"/>` +
      `<circle cx="50" cy="64" r="22" fill="none" stroke="${WHITE}" stroke-width="2"/>` +
      `<text x="50" y="75" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="30" fill="${WHITE}">1</text>`,
  },
  {
    code: "monogram-w",
    label: "Monogramme",
    categories: ["emblems", "symbols"],
    body:
      `<circle cx="50" cy="50" r="45" fill="${NAVY}"/>` +
      `<circle cx="50" cy="50" r="39" fill="none" stroke="${SKY}" stroke-width="2"/>` +
      `<polygon points="20,32 31,32 37,58 44,32 56,32 63,58 69,32 80,32 68,70 58,70 50,44 42,70 32,70" fill="${WHITE}"/>`,
  },
  {
    code: "mountain",
    label: "Sommet",
    categories: ["emblems", "symbols"],
    body:
      `<circle cx="50" cy="50" r="45" fill="${WHITE}" stroke="${NAVY}" stroke-width="3"/>` +
      `<clipPath id="m"><circle cx="50" cy="50" r="42"/></clipPath>` +
      `<g clip-path="url(#m)"><polygon points="2,82 36,34 54,58 66,44 98,82" fill="${BLUE}"/>` +
      `<polygon points="36,34 29,44 36,41 42,46" fill="${WHITE}"/><polygon points="66,44 61,51 67,49 71,52" fill="${WHITE}"/>` +
      `<rect x="0" y="80" width="100" height="20" fill="${NAVY}"/></g>` +
      `<circle cx="72" cy="26" r="7" fill="${SKY}"/>`,
  },
  {
    code: "wave",
    label: "Vague",
    categories: ["symbols", "emblems"],
    body:
      `<circle cx="50" cy="50" r="45" fill="${BLUE}"/>` +
      `<path d="M10 58 C24 44 34 44 44 54 C54 64 64 64 76 50 C82 44 88 42 92 44 L92 70 C70 92 30 92 10 70Z" fill="${WHITE}"/>` +
      `<path d="M14 66 C26 56 36 56 46 64 C56 72 68 70 88 58" fill="none" stroke="${SKY}" stroke-width="4"/>`,
  },
  {
    code: "gem",
    label: "Diamant",
    categories: ["symbols", "emblems"],
    body:
      `<polygon points="22,18 78,18 96,40 50,94 4,40" fill="${BLUE}" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>` +
      `<polygon points="4,40 96,40 78,18 22,18" fill="${SKY}"/>` +
      `<polygon points="36,40 50,18 64,40 50,94" fill="${WHITE}" opacity=".55"/>` +
      `<path d="M4 40 H96 M36 40 L50 94 L64 40" fill="none" stroke="${NAVY}" stroke-width="2"/>`,
  },
  {
    code: "basket-club",
    label: "Basket club",
    categories: ["sport", "crests"],
    body:
      `<circle cx="50" cy="50" r="44" fill="#F28C28" stroke="${NAVY}" stroke-width="4"/>` +
      `<g fill="none" stroke="${NAVY}" stroke-width="3.5"><path d="M6 50 H94 M50 6 V94"/><path d="M19 19 C35 35 35 65 19 81 M81 19 C65 35 65 65 81 81"/></g>`,
  },
  {
    code: "hexa-star",
    label: "Hexagone étoilé",
    categories: ["crests", "emblems"],
    body:
      `<polygon points="${polygon(50, 50, 46, 6, 0)}" fill="${WHITE}" stroke="${NAVY}" stroke-width="3"/>` +
      `<polygon points="${polygon(50, 50, 38, 6, 0)}" fill="${BLUE}"/>` +
      star(50, 52, 22, WHITE),
  },
];

export function logoByAssetId(assetId: string): LogoDef | undefined {
  return assetId.startsWith(LOGO_PREFIX)
    ? LOGOS.find((l) => l.code === assetId.slice(LOGO_PREFIX.length))
    : undefined;
}

export function logoSvg(logo: LogoDef, size = 512): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${logo.body}</svg>`;
}

/** URL utilisable directement dans un <img> (vignettes). */
export function logoDataUrl(logo: LogoDef): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg(logo, 256))}`;
}

export function filterLogos(category: LogoCategory | "all", query: string): LogoDef[] {
  const q = query.trim().toLowerCase();
  return LOGOS.filter(
    (l) =>
      (category === "all" || l.categories.includes(category)) &&
      (!q || l.label.toLowerCase().includes(q)),
  );
}
