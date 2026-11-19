/**
 * Maquettes prêtes à l'emploi (menu « Maquettes ») : un modèle de maillot complet —
 * couleur 1 (corps), couleur 2 (motif), couleur 3 (finitions) et un motif graphique.
 * Appliquer une maquette écrit les couleurs et le motif dans les zones du vêtement ;
 * les calques (logos, textes, numéros…) ne sont jamais modifiés.
 */
import type { DesignDocument, Mockup, Pattern } from "@wear3d/design-schema";
import type { GarmentDefinition } from "@wear3d/garment-engine";

export type MockupCategory = "sport" | "business" | "event";

export const MOCKUP_CATEGORIES: { id: MockupCategory | "all"; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "sport", label: "Sport" },
  { id: "business", label: "Entreprise" },
  { id: "event", label: "Événement" },
];

/** Préfixe des maquettes importées (images stockées dans la bibliothèque locale). */
export const MOCKUP_ASSET_PREFIX = "mockup_";

export interface MockupTemplate {
  id: string;
  label: string;
  categories: readonly MockupCategory[];
  colors: [string, string, string];
  /** Couleur des manches : 1 (comme le corps) ou 3 (finitions). */
  sleeves: 1 | 3;
  pattern?: {
    assetId: string;
    mode: Pattern["mode"];
    opacity: number;
    rotation?: number;
    scale?: number;
  };
}

const placed = (code: string, opacity = 1, rotation = 0) => ({
  assetId: `pattern:${code}`,
  mode: "placed" as const,
  opacity,
  rotation,
});
const repeat = (code: string, opacity = 1, scale = 1, rotation = 0) => ({
  assetId: `pattern:${code}`,
  mode: "repeat" as const,
  opacity,
  scale,
  rotation,
});

export const MOCKUPS: readonly MockupTemplate[] = [
  {
    id: "royal",
    label: "Royal",
    categories: ["sport"],
    colors: ["#1D4ED8", "#FFFFFF", "#FFFFFF"],
    sleeves: 1,
    pattern: placed("band-diagonal", 0.9),
  },
  {
    id: "eclats",
    label: "Éclats",
    categories: ["sport", "business"],
    colors: ["#FFFFFF", "#1D4ED8", "#1D4ED8"],
    sleeves: 3,
    pattern: placed("shards", 0.9),
  },
  {
    id: "abeille",
    label: "Abeille",
    categories: ["sport"],
    colors: ["#FACC15", "#111827", "#111827"],
    sleeves: 1,
    pattern: placed("band-diagonal", 1, 180),
  },
  {
    id: "volcan",
    label: "Volcan",
    categories: ["sport"],
    colors: ["#DC2626", "#111827", "#111827"],
    sleeves: 3,
    pattern: placed("band-diagonal", 1, 90),
  },
  {
    id: "foret",
    label: "Forêt",
    categories: ["sport"],
    colors: ["#15803D", "#FFFFFF", "#FFFFFF"],
    sleeves: 1,
    pattern: placed("chevron", 0.95),
  },
  {
    id: "aurore",
    label: "Aurore",
    categories: ["event"],
    colors: ["#FFFFFF", "#7C3AED", "#7C3AED"],
    sleeves: 3,
    pattern: placed("gradient", 0.9),
  },
  {
    id: "brasier",
    label: "Brasier",
    categories: ["sport", "event"],
    colors: ["#0F172A", "#F97316", "#F97316"],
    sleeves: 1,
    pattern: placed("splatter", 1),
  },
  {
    id: "prisme",
    label: "Prisme",
    categories: ["business"],
    colors: ["#FFFFFF", "#2563EB", "#2563EB"],
    sleeves: 1,
    pattern: repeat("hexagons", 0.55, 0.8),
  },
  {
    id: "tigre",
    label: "Tigre",
    categories: ["sport"],
    colors: ["#EAB308", "#111827", "#111827"],
    sleeves: 1,
    pattern: repeat("stripes", 1, 0.9, 30),
  },
  {
    id: "bordeaux",
    label: "Bordeaux",
    categories: ["business"],
    colors: ["#9F1239", "#BE123C", "#F5B70A"],
    sleeves: 1,
    pattern: repeat("dots", 0.7, 0.6),
  },
  {
    id: "lagon",
    label: "Lagon",
    categories: ["event", "sport"],
    colors: ["#0EA5E9", "#1D4ED8", "#FFFFFF"],
    sleeves: 1,
    pattern: placed("gradient", 0.85),
  },
  {
    id: "eclipse",
    label: "Éclipse",
    categories: ["business", "event"],
    colors: ["#FFFFFF", "#DC2626", "#111827"],
    sleeves: 3,
    pattern: placed("band-diagonal", 1, -90),
  },
  {
    id: "nuit-etoilee",
    label: "Nuit étoilée",
    categories: ["event", "business"],
    colors: ["#0F172A", "#FFFFFF", "#F5B70A"],
    sleeves: 1,
    pattern: repeat("dots", 0.55, 0.45),
  },
  {
    id: "camouflage",
    label: "Camouflage",
    categories: ["sport", "event"],
    colors: ["#3F4E2B", "#6B7F3A", "#1F2A12"],
    sleeves: 1,
    pattern: repeat("camouflage", 0.95, 1.2),
  },
  {
    id: "neon",
    label: "Néon",
    categories: ["sport", "event"],
    colors: ["#111827", "#22C55E", "#22C55E"],
    sleeves: 1,
    pattern: placed("band-diagonal", 1),
  },
  {
    id: "arctique",
    label: "Arctique",
    categories: ["sport"],
    colors: ["#FFFFFF", "#0EA5E9", "#0369A1"],
    sleeves: 1,
    pattern: placed("chevron", 0.9),
  },
  {
    id: "corsaire",
    label: "Corsaire",
    categories: ["sport"],
    colors: ["#111827", "#FFFFFF", "#FFFFFF"],
    sleeves: 1,
    pattern: repeat("stripes", 1, 0.7, 90),
  },
  {
    id: "sakura",
    label: "Sakura",
    categories: ["event"],
    colors: ["#F9A8D4", "#FFFFFF", "#BE185D"],
    sleeves: 1,
    pattern: placed("splatter", 0.9),
  },
  {
    id: "tricolore",
    label: "Tricolore",
    categories: ["sport", "event"],
    colors: ["#FFFFFF", "#DC2626", "#1D4ED8"],
    sleeves: 3,
    pattern: placed("band-diagonal", 1),
  },
  {
    id: "corporate",
    label: "Corporate",
    categories: ["business"],
    colors: ["#14243B", "#2B4A75", "#F5B70A"],
    sleeves: 1,
    pattern: repeat("diagonal", 0.6, 0.5),
  },
  {
    id: "ardoise",
    label: "Ardoise",
    categories: ["business"],
    colors: ["#334155", "#94A3B8", "#FFFFFF"],
    sleeves: 1,
    pattern: repeat("grain", 0.5, 1),
  },
  {
    id: "solaire",
    label: "Solaire",
    categories: ["event"],
    colors: ["#F97316", "#FDE68A", "#7C2D12"],
    sleeves: 1,
    pattern: placed("spotlight", 0.9),
  },
  {
    id: "glacier",
    label: "Glacier",
    categories: ["business", "sport"],
    colors: ["#E0F2FE", "#38BDF8", "#0369A1"],
    sleeves: 3,
    pattern: placed("shards", 0.85),
  },
];

export function filterMockups(category: MockupCategory | "all", query: string): MockupTemplate[] {
  const q = query.trim().toLowerCase();
  return MOCKUPS.filter(
    (m) =>
      (category === "all" || m.categories.includes(category)) &&
      (!q || m.label.toLowerCase().includes(q)),
  );
}

export function isImportedMockup(id: string): boolean {
  return id.startsWith(MOCKUP_ASSET_PREFIX);
}

/** Modèle d'une maquette (intégrée, ou importée : l'image couvre le corps). */
export function templateOf(id: string, fallbackColors: Mockup["colors"]): MockupTemplate {
  const builtin = MOCKUPS.find((m) => m.id === id);
  if (builtin) return builtin;
  return {
    id,
    label: "Maquette importée",
    categories: [],
    colors: fallbackColors,
    sleeves: 1,
    pattern: { assetId: id, mode: "placed", opacity: 1 },
  };
}

/** État de départ d'une maquette : couleurs d'origine, aucun ajustement. */
export function newMockup(t: MockupTemplate): Mockup {
  return {
    id: t.id,
    colors: [...t.colors],
    recolor: true,
    intensity: 1,
    blendMode: "normal",
    scale: t.pattern?.scale ?? 1,
    rotation: t.pattern?.rotation ?? 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
  };
}

/* ---------- Couleurs ---------- */

function hexToHsl(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Luminosité, contraste et saturation appliqués à une couleur de maquette. */
export function adjustColor(
  hex: string,
  m: Pick<Mockup, "brightness" | "contrast" | "saturation">,
) {
  if (!m.brightness && !m.contrast && !m.saturation) return hex.toUpperCase();
  const [h, s, l] = hexToHsl(hex);
  const l2 = clamp(0.5 + (clamp(l + m.brightness * 0.5) - 0.5) * (1 + m.contrast));
  return hslToHex(h, clamp(s * (1 + m.saturation)), l2);
}

/** Couleurs effectives (recoloration ou origine, puis ajustements). */
export function effectiveColors(m: Mockup): [string, string, string] {
  const t = templateOf(m.id, m.colors);
  const base = m.recolor ? m.colors : t.colors;
  return [adjustColor(base[0], m), adjustColor(base[1], m), adjustColor(base[2], m)];
}

/**
 * Écrit la maquette dans le document : couleurs des zones et motif du corps.
 * Matière, calques et scène restent inchangés.
 */
export function withMockup(
  doc: DesignDocument,
  def: GarmentDefinition | null,
  m: Mockup,
): DesignDocument {
  const t = templateOf(m.id, m.colors);
  const [c1, c2, c3] = effectiveColors(m);
  const zones = { ...doc.zones };
  for (const z of def?.zones ?? []) {
    const style = zones[z.code];
    if (!style) continue;
    const color =
      z.code === "COLLAR" ? c3 : z.code.startsWith("SLEEVE") ? (t.sleeves === 3 ? c3 : c1) : c1;
    const next = { ...style, color };
    if (z.code.startsWith("BODY") && z.allows.includes("pattern") && t.pattern) {
      zones[z.code] = {
        ...next,
        pattern: {
          assetId: t.pattern.assetId,
          mode: t.pattern.mode,
          color: c2,
          opacity: t.pattern.opacity * m.intensity,
          blendMode: m.blendMode,
          scale: m.scale,
          rotation: m.rotation,
          offsetX: 0,
          offsetY: 0,
        },
      };
    } else if (z.code.startsWith("BODY")) {
      const { pattern: _removed, ...rest } = next;
      zones[z.code] = rest;
    } else {
      zones[z.code] = next;
    }
  }
  // Bords de manche (si le modèle en a) : couleur de finition, contrastée avec la manche.
  const cuffs = def?.trims?.cuffs
    ? {
        enabled: true,
        color: t.sleeves === 3 ? c1 : c3,
        width: doc.trims?.cuffs?.width ?? def.trims.cuffs.defaultWidth,
        stripes: doc.trims?.cuffs?.stripes ?? 0,
        stripeColor: doc.trims?.cuffs?.stripeColor ?? c2,
      }
    : undefined;
  return { ...doc, zones, mockup: m, ...(cuffs ? { trims: { ...doc.trims, cuffs } } : {}) };
}
