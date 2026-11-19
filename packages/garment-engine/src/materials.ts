import type { MaterialCode } from "@wear3d/design-schema";

/** Motif de surface utilisé pour générer la normal map procédurale. */
export type WeaveKind =
  "jersey" | "twill" | "mesh" | "smooth" | "honeycomb" | "knit" | "satin" | "carbon";

export interface MaterialPreset {
  code: MaterialCode;
  label: string;
  roughness: number;
  /** Intensité du sheen (aspect duvet du tissu, CDC F-50). */
  sheen: number;
  sheenRoughness: number;
  weave: WeaveKind;
  /** Répétitions du motif sur l'atlas (densité de la maille). */
  weaveRepeat: number;
  normalScale: number;
}

/** Nom commercial affiché dans le sélecteur « Tissu » (maquette Studio). */
export const FABRIC_NAMES: Record<MaterialCode, { name: string; subtitle: string }> = {
  cotton: { name: "Coton Premium", subtitle: "Coton peigné" },
  polyester: { name: "Classic", subtitle: "Polyester" },
  "poly-sport": { name: "Sport Pro", subtitle: "Polyester respirant" },
  elastane: { name: "Stretch Fit", subtitle: "Élasthanne" },
  "sport-mesh": { name: "Air Mesh", subtitle: "Maille sportive" },
  technical: { name: "Tech Pro", subtitle: "Tissu technique" },
  microfiber: { name: "Microfibre", subtitle: "Microfibre douce" },
  honeycomb: { name: "Nid d'abeille", subtitle: "Maille alvéolée" },
  knit: { name: "Tricot", subtitle: "Maille tricotée" },
  satin: { name: "Satin sport", subtitle: "Satin brillant" },
  carbon: { name: "Carbone", subtitle: "Fibre de carbone" },
};

export const MATERIAL_PRESETS: Record<MaterialCode, MaterialPreset> = {
  cotton: {
    code: "cotton",
    label: "Coton",
    roughness: 0.92,
    sheen: 1,
    sheenRoughness: 0.8,
    weave: "jersey",
    weaveRepeat: 90,
    normalScale: 0.35,
  },
  polyester: {
    code: "polyester",
    label: "Polyester",
    roughness: 0.62,
    sheen: 0.5,
    sheenRoughness: 0.5,
    weave: "smooth",
    weaveRepeat: 120,
    normalScale: 0.15,
  },
  "poly-sport": {
    code: "poly-sport",
    label: "Polyester respirant",
    roughness: 0.55,
    sheen: 0.6,
    sheenRoughness: 0.45,
    weave: "twill",
    weaveRepeat: 110,
    normalScale: 0.3,
  },
  elastane: {
    code: "elastane",
    label: "Élasthanne",
    roughness: 0.42,
    sheen: 0.35,
    sheenRoughness: 0.35,
    weave: "smooth",
    weaveRepeat: 140,
    normalScale: 0.1,
  },
  "sport-mesh": {
    code: "sport-mesh",
    label: "Maille sportive",
    roughness: 0.6,
    sheen: 0.7,
    sheenRoughness: 0.6,
    weave: "mesh",
    weaveRepeat: 70,
    normalScale: 0.6,
  },
  technical: {
    code: "technical",
    label: "Tissu technique",
    roughness: 0.48,
    sheen: 0.4,
    sheenRoughness: 0.4,
    weave: "twill",
    weaveRepeat: 160,
    normalScale: 0.25,
  },
  microfiber: {
    code: "microfiber",
    label: "Microfibre",
    roughness: 0.7,
    sheen: 0.8,
    sheenRoughness: 0.7,
    weave: "smooth",
    weaveRepeat: 200,
    normalScale: 0.12,
  },
  honeycomb: {
    code: "honeycomb",
    label: "Nid d'abeille",
    roughness: 0.6,
    sheen: 0.5,
    sheenRoughness: 0.5,
    weave: "honeycomb",
    weaveRepeat: 60,
    normalScale: 0.7,
  },
  knit: {
    code: "knit",
    label: "Tricot",
    roughness: 0.88,
    sheen: 0.9,
    sheenRoughness: 0.8,
    weave: "knit",
    weaveRepeat: 50,
    normalScale: 0.8,
  },
  satin: {
    code: "satin",
    label: "Satin sport",
    roughness: 0.25,
    sheen: 1,
    sheenRoughness: 0.2,
    weave: "satin",
    weaveRepeat: 90,
    normalScale: 0.12,
  },
  carbon: {
    code: "carbon",
    label: "Carbone",
    roughness: 0.32,
    sheen: 0.3,
    sheenRoughness: 0.3,
    weave: "carbon",
    weaveRepeat: 40,
    normalScale: 0.9,
  },
};
