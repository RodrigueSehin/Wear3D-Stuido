/**
 * Format du document de design, version 2 (version courante).
 *
 * Évolutions par rapport à la v1 (maquette « Studio work space ») :
 * - transform : hauteur libre `h` (ratio déverrouillé), symétries `flipX` / `flipY` ;
 * - calques : mode de fusion `blendMode`, effets `shadow` / `outline` / `glow` ;
 * - motifs : couleur `color`.
 * Toutes les nouveautés ont des valeurs par défaut : la migration 1 → 2 est triviale.
 */
import { z } from "zod";
import { hexColorSchema, unitSchema, zoneCodeSchema } from "./primitives";

export const MATERIAL_CODES = [
  "cotton",
  "polyester",
  "poly-sport",
  "elastane",
  "sport-mesh",
  "technical",
  "microfiber",
  "honeycomb",
  "knit",
  "satin",
  "carbon",
] as const;
export const materialCodeSchema = z.enum(MATERIAL_CODES);
export type MaterialCode = z.infer<typeof materialCodeSchema>;

export const MORPH_STATES = ["posed", "worn", "motion"] as const;

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
] as const;
export const blendModeSchema = z.enum(BLEND_MODES);
export type BlendMode = z.infer<typeof blendModeSchema>;

export const patternSchema = z.object({
  /** Asset importé, ou motif intégré « pattern:<code> ». */
  assetId: z.string().min(1),
  /** repeat = motif répété ; placed = motif unique couvrant la zone. */
  mode: z.enum(["repeat", "placed"]).default("repeat"),
  color: hexColorSchema.default("#FFFFFF"),
  scale: z.number().positive().max(10).default(1),
  rotation: z.number().min(-360).max(360).default(0),
  offsetX: z.number().default(0),
  offsetY: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  /** Mode de fusion du motif sur la couleur de la zone. */
  blendMode: blendModeSchema.default("normal"),
});

export const zoneStyleSchema = z.object({
  color: hexColorSchema,
  material: materialCodeSchema,
  pattern: patternSchema.optional(),
});

/**
 * Centre de l'élément (relatif à la zone), largeur relative à la largeur de zone,
 * hauteur optionnelle relative à la hauteur de zone (absente = ratio naturel).
 */
export const transformSchema = z.object({
  x: unitSchema,
  y: unitSchema,
  w: z.number().positive().max(2),
  h: z.number().positive().max(2).optional(),
  rotation: z.number().min(-360).max(360).default(0),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
});

export const effectsSchema = z.object({
  shadow: z
    .object({
      enabled: z.boolean().default(false),
      color: hexColorSchema.default("#000000"),
      /** Flou et décalage relatifs à la hauteur de zone. */
      blur: z.number().min(0).max(0.1).default(0.012),
      offset: z.number().min(0).max(0.1).default(0.006),
    })
    .default({ enabled: false, color: "#000000", blur: 0.012, offset: 0.006 }),
  outline: z
    .object({
      enabled: z.boolean().default(false),
      color: hexColorSchema.default("#FFFFFF"),
      width: z.number().min(0).max(0.05).default(0.004),
    })
    .default({ enabled: false, color: "#FFFFFF", width: 0.004 }),
  glow: z
    .object({
      enabled: z.boolean().default(false),
      color: hexColorSchema.default("#4C8DFF"),
      blur: z.number().min(0).max(0.1).default(0.02),
    })
    .default({ enabled: false, color: "#4C8DFF", blur: 0.02 }),
});
export type Effects = z.infer<typeof effectsSchema>;

export const DEFAULT_EFFECTS: Effects = {
  shadow: { enabled: false, color: "#000000", blur: 0.012, offset: 0.006 },
  outline: { enabled: false, color: "#FFFFFF", width: 0.004 },
  glow: { enabled: false, color: "#4C8DFF", blur: 0.02 },
};

const layerBase = {
  id: z.string().min(1),
  zone: zoneCodeSchema,
  name: z.string().max(80).optional(),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  blendMode: blendModeSchema.default("normal"),
  effects: effectsSchema.default(DEFAULT_EFFECTS),
  transform: transformSchema,
};

export const strokeSchema = z.object({
  color: hexColorSchema,
  /** Épaisseur relative à la hauteur de la zone. */
  width: z.number().min(0).max(0.05),
});

export const gradientSchema = z.object({
  from: hexColorSchema,
  to: hexColorSchema,
  /** Angle en degrés (0 = de gauche à droite, 90 = de haut en bas). */
  angle: z.number().min(-360).max(360).default(90),
});

export const textLayerSchema = z.object({
  ...layerBase,
  type: z.literal("text"),
  text: z.object({
    /** Peut contenir des jetons {player.name}, {player.number}. */
    value: z.string().max(200),
    font: z.string().min(1),
    /** Hauteur de la police relative à la hauteur de la zone. */
    size: z.number().positive().max(1),
    color: hexColorSchema,
    weight: z.number().int().min(100).max(900).default(700),
    letterSpacing: z.number().min(-0.5).max(2).default(0),
    stroke: strokeSchema.optional(),
    /** Courbure en degrés (0 = droit). */
    arc: z.number().min(-360).max(360).default(0),
    italic: z.boolean().default(false),
    underline: z.boolean().default(false),
    align: z.enum(["left", "center", "right"]).default("center"),
    /** Interligne (multiplicateur) des textes sur plusieurs lignes. */
    lineHeight: z.number().min(0.6).max(3).default(1),
    /** Remplissage dégradé (remplace la couleur unie). */
    gradient: gradientSchema.optional(),
    /** Relief : reflet clair et ombre propre, façon texte embossé. */
    relief: z.boolean().default(false),
    /** Angles adoucis (jointures arrondies). */
    rounded: z.boolean().default(false),
  }),
});

export const numberLayerSchema = z.object({
  ...layerBase,
  type: z.literal("number"),
  number: z.object({
    /** 0 à 3 chiffres, ou un jeton d'effectif ({player.number}). */
    value: z
      .string()
      .regex(/^(\d{0,3}|\{player\.[a-zA-Z0-9_]+\})$/, "Numéro : 3 chiffres maximum ou jeton"),
    style: z.string().min(1),
    color: hexColorSchema,
    stroke: strokeSchema.optional(),
  }),
});

export const imageLayerSchema = z.object({
  ...layerBase,
  type: z.literal("image"),
  assetId: z.string().min(1),
  /** Recolore l'image d'une seule couleur (éléments graphiques monochromes). */
  tint: hexColorSchema.optional(),
});

export const layerSchema = z.discriminatedUnion("type", [
  textLayerSchema,
  numberLayerSchema,
  imageLayerSchema,
]);

/**
 * Maquette appliquée (menu « Maquettes ») : modèle de départ et ses réglages. Les couleurs
 * et le motif effectifs sont écrits dans les zones ; ceci permet de les réajuster ensuite.
 */
export const mockupSchema = z.object({
  /** Maquette intégrée (ex. "royal") ou importée (assetId "mockup_…"). */
  id: z.string().min(1).max(120),
  /** Couleur 1 (corps), 2 (motif), 3 (finitions : col, bords). */
  colors: z.tuple([hexColorSchema, hexColorSchema, hexColorSchema]),
  /** Recoloration active : sinon, couleurs d'origine de la maquette. */
  recolor: z.boolean().default(true),
  intensity: z.number().min(0).max(1).default(1),
  blendMode: blendModeSchema.default("normal"),
  scale: z.number().min(0.25).max(4).default(1),
  rotation: z.number().min(-180).max(180).default(0),
  brightness: z.number().min(-1).max(1).default(0),
  contrast: z.number().min(-1).max(1).default(0),
  saturation: z.number().min(-1).max(1).default(0),
});

/** Bords de manche : bande de finition, éventuellement rayée. */
export const cuffTrimSchema = z.object({
  enabled: z.boolean().default(true),
  color: hexColorSchema,
  /** Hauteur, en fraction de la hauteur de la zone de manche. */
  width: z.number().min(0.03).max(0.5).default(0.12),
  /** Rayures dans le bord (0 à 3). */
  stripes: z.number().int().min(0).max(3).default(0),
  stripeColor: hexColorSchema.default("#FFFFFF"),
});

export const GRAINLINES = ["vertical", "horizontal", "bias"] as const;

/** Réglages de fabrication d'une pièce du patron (menu « Patron »). */
export const sewingPieceSchema = z.object({
  /** Marge de couture, en cm. */
  seam: z.number().min(0).max(5).default(1),
  /** Nombre de coupes (2 = pièce coupée deux fois, la seconde en miroir). */
  cut: z.number().int().min(1).max(4).optional(),
  grain: z.enum(GRAINLINES).default("vertical"),
  comment: z.string().max(200).default(""),
  hidden: z.boolean().default(false),
});

/** Patron de couture : laize du tissu et réglages par pièce. */
export const sewingSchema = z.object({
  /** Largeur utile du tissu (laize), en cm, pour le plan de coupe. */
  fabricWidth: z.number().min(60).max(320).default(150),
  pieces: z.record(z.string(), sewingPieceSchema).default({}),
});

export const AMBIANCES = ["day", "evening", "night"] as const;

/**
 * Mise en scène de présentation (menu « Scènes ») : décor, éclairage et ajustements.
 * N'affecte pas l'impression : seulement la vue 3D et les rendus / exports d'image.
 */
export const sceneSchema = z.object({
  /** Scène intégrée (ex. "stadium") ou importée ("custom:<assetId>"). */
  id: z.string().min(1).max(120),
  /** Intensité de l'éclairage (1 = 100 %). */
  intensity: z.number().min(0).max(2).default(1),
  /** Angle de la lumière principale autour du vêtement, en degrés (0 = face). */
  angle: z.number().min(0).max(360).default(330),
  ambiance: z.enum(AMBIANCES).default("day"),
  brightness: z.number().min(-1).max(1).default(0),
  contrast: z.number().min(-1).max(1).default(0),
  saturation: z.number().min(-1).max(1).default(0),
  groundShadow: z.boolean().default(true),
  reflection: z.boolean().default(false),
  backgroundBlur: z.boolean().default(false),
  /** Le décor est intégré aux rendus et exports (sinon fond transparent). */
  includeInExport: z.boolean().default(true),
});

export const designDocumentV2Schema = z.object({
  schemaVersion: z.literal(2),
  model: z.object({
    /** Version précise du modèle 3D : une mise à jour du catalogue ne casse pas le design. */
    versionId: z.string().min(1),
    size: z.string().min(1).default("M"),
    morph: z.enum(MORPH_STATES).default("posed"),
  }),
  zones: z.record(zoneCodeSchema, zoneStyleSchema),
  layers: z.array(layerSchema).max(200),
  scene: sceneSchema.optional(),
  mockup: mockupSchema.optional(),
  sewing: sewingSchema.optional(),
  /** Finitions (bords de manche…) des modèles qui en ont. */
  trims: z.object({ cuffs: cuffTrimSchema.optional() }).optional(),
});

export type Pattern = z.infer<typeof patternSchema>;
export type ZoneStyle = z.infer<typeof zoneStyleSchema>;
export type Transform = z.infer<typeof transformSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;
export type NumberLayer = z.infer<typeof numberLayerSchema>;
export type ImageLayer = z.infer<typeof imageLayerSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Mockup = z.infer<typeof mockupSchema>;
export type Sewing = z.infer<typeof sewingSchema>;
export type CuffTrim = z.infer<typeof cuffTrimSchema>;
export type SewingPiece = z.infer<typeof sewingPieceSchema>;
export type Grainline = (typeof GRAINLINES)[number];
export type Ambiance = (typeof AMBIANCES)[number];
export type LayerType = Layer["type"];
export type DesignDocumentV2 = z.infer<typeof designDocumentV2Schema>;
