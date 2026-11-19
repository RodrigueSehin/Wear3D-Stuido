/**
 * Catalogue du panneau « Textures » : tissus (matériaux du moteur), motifs et effets
 * (calques de surface de la zone). Chaque entrée sait s'appliquer au document et se
 * reconnaître dans le document courant, pour l'état « sélectionné ».
 */
import type { DesignDocument, MaterialCode } from "@wear3d/design-schema";
import type { GarmentDefinition } from "@wear3d/garment-engine";
import { PATTERN_PREFIX, PATTERNS } from "./patterns";

export type TextureTab = "fabrics" | "patterns" | "effects";
export type TextureCategory = "sport" | "casual" | "premium" | "technical";

export const TEXTURE_TABS: { id: TextureTab; label: string }[] = [
  { id: "fabrics", label: "Tissus" },
  { id: "patterns", label: "Motifs" },
  { id: "effects", label: "Effets" },
];

export const TEXTURE_CATEGORIES: { id: TextureCategory | "all"; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "sport", label: "Sport" },
  { id: "casual", label: "Casual" },
  { id: "premium", label: "Premium" },
  { id: "technical", label: "Technique" },
];

export interface TextureDef {
  id: string;
  label: string;
  tab: TextureTab;
  categories: readonly TextureCategory[];
  material?: MaterialCode;
  patternCode?: string;
}

const fabric = (
  material: MaterialCode,
  label: string,
  categories: readonly TextureCategory[],
): TextureDef => ({ id: `fabric:${material}`, label, tab: "fabrics", categories, material });

const FABRICS: TextureDef[] = [
  fabric("poly-sport", "Sport Pro", ["sport", "technical"]),
  fabric("sport-mesh", "Mesh (Aéré)", ["sport", "technical"]),
  fabric("technical", "Respirant", ["sport", "technical"]),
  fabric("polyester", "Polyester", ["sport", "casual"]),
  fabric("microfiber", "Microfibre", ["sport", "casual"]),
  fabric("elastane", "Élasthanne", ["sport", "technical"]),
  fabric("honeycomb", "Nid d'abeille", ["sport", "technical"]),
  fabric("knit", "Tricot", ["casual", "premium"]),
  fabric("satin", "Satin sport", ["premium", "sport"]),
  fabric("carbon", "Carbone", ["premium", "technical"]),
  fabric("cotton", "Coton", ["casual"]),
];

const PATTERN_CATEGORIES: Record<string, readonly TextureCategory[]> = {
  "band-diagonal": ["sport"],
  shards: ["sport", "premium"],
  chevron: ["sport", "casual"],
  stripes: ["casual", "sport"],
  diagonal: ["casual"],
  dots: ["casual"],
  hexagons: ["technical", "sport"],
  camouflage: ["casual", "technical"],
  gradient: ["premium", "sport"],
  spotlight: ["premium"],
  grain: ["casual", "premium"],
  splatter: ["casual", "sport"],
};

const SURFACE: TextureDef[] = PATTERNS.map((p) => ({
  id: `pattern:${p.code}`,
  label: p.label,
  tab: p.kind === "effect" ? "effects" : "patterns",
  categories: PATTERN_CATEGORIES[p.code] ?? ["casual"],
  patternCode: p.code,
}));

export const TEXTURES: readonly TextureDef[] = [...FABRICS, ...SURFACE];

/** Blanc sur fond sombre, bleu nuit sur fond clair : le motif reste toujours lisible. */
export function contrastColor(background: string): string {
  const n = Number.parseInt(background.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#0B1530" : "#FFFFFF";
}

export function filterTextures(
  tab: TextureTab,
  category: TextureCategory | "all",
  query: string,
): TextureDef[] {
  const q = query.trim().toLowerCase();
  return TEXTURES.filter(
    (t) =>
      t.tab === tab &&
      (category === "all" || t.categories.includes(category)) &&
      (!q || t.label.toLowerCase().includes(q)),
  );
}

/** Zones touchées : tout le vêtement pour un tissu, le corps pour un motif ou un effet. */
export function targetZones(def: GarmentDefinition | null, tex: TextureDef): string[] {
  if (!def) return [];
  return def.zones
    .filter((z) =>
      tex.material
        ? z.allows.includes("material") && def.materials.includes(tex.material)
        : z.code.startsWith("BODY") && z.allows.includes("pattern"),
    )
    .map((z) => z.code);
}

/** Vrai si la texture est déjà celle du document (tissu uniforme, ou motif du corps). */
export function isTextureActive(
  doc: DesignDocument | null,
  def: GarmentDefinition | null,
  tex: TextureDef,
): boolean {
  if (!doc) return false;
  const zones = targetZones(def, tex);
  if (zones.length === 0) return false;
  return zones.every((z) => {
    const style = doc.zones[z];
    return tex.material
      ? style?.material === tex.material
      : style?.pattern?.assetId === `${PATTERN_PREFIX}${tex.patternCode}`;
  });
}

/**
 * Applique la texture au document sans toucher aux calques, ni aux couleurs.
 * Un motif reprend la couleur/échelle/opacité du motif en place pour rester cohérent.
 */
export function withTexture(
  doc: DesignDocument,
  def: GarmentDefinition | null,
  tex: TextureDef,
  /** Limite l'application à ces zones (glisser-déposer sur une zone). */
  only?: readonly string[],
): DesignDocument {
  const codes = targetZones(def, tex).filter((c) => !only || only.includes(c));
  const zones = { ...doc.zones };
  for (const code of codes) {
    const style = zones[code];
    if (!style) continue;
    if (tex.material) {
      zones[code] = { ...style, material: tex.material };
      continue;
    }
    const pattern = PATTERNS.find((p) => p.code === tex.patternCode);
    if (!pattern) continue;
    const prev = style.pattern;
    zones[code] = {
      ...style,
      pattern: {
        assetId: `${PATTERN_PREFIX}${pattern.code}`,
        mode: pattern.mode,
        color: prev?.color ?? contrastColor(style.color),
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        opacity: prev?.opacity ?? (pattern.kind === "effect" ? 0.6 : 0.85),
        blendMode: prev?.blendMode ?? "normal",
      },
    };
  }
  return { ...doc, zones };
}

/** Retire le motif / l'effet du corps (vignette « Aucun »). */
export function withoutSurface(doc: DesignDocument, def: GarmentDefinition | null): DesignDocument {
  const zones = { ...doc.zones };
  for (const z of def?.zones ?? []) {
    if (!z.code.startsWith("BODY") || !zones[z.code]?.pattern) continue;
    const { pattern: _removed, ...rest } = zones[z.code]!;
    zones[z.code] = rest;
  }
  return { ...doc, zones };
}
