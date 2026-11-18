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
] as const;
export const materialCodeSchema = z.enum(MATERIAL_CODES);
export type MaterialCode = z.infer<typeof materialCodeSchema>;

export const MORPH_STATES = ["posed", "worn", "motion"] as const;

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
});

export const layerSchema = z.discriminatedUnion("type", [
  textLayerSchema,
  numberLayerSchema,
  imageLayerSchema,
]);

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
});

export type Pattern = z.infer<typeof patternSchema>;
export type ZoneStyle = z.infer<typeof zoneStyleSchema>;
export type Transform = z.infer<typeof transformSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;
export type NumberLayer = z.infer<typeof numberLayerSchema>;
export type ImageLayer = z.infer<typeof imageLayerSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type LayerType = Layer["type"];
export type DesignDocumentV2 = z.infer<typeof designDocumentV2Schema>;
