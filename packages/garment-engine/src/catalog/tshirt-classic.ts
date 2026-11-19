import type { GarmentDefinition, UvRect } from "./types";

/** Marge entre îles : 16 px sur un atlas de 2048 px (CDC §4.4). */
const M = 16 / 2048;
const HALF = (1 - 3 * M) / 2;

export const TSHIRT_UV: Record<string, UvRect> = {
  BODY_FRONT: { x: M, y: M, w: HALF, h: 0.62 },
  BODY_BACK: { x: 2 * M + HALF, y: M, w: HALF, h: 0.62 },
  SLEEVE_LEFT: { x: M, y: 0.62 + 2 * M, w: HALF, h: 0.2 },
  SLEEVE_RIGHT: { x: 2 * M + HALF, y: 0.62 + 2 * M, w: HALF, h: 0.2 },
  COLLAR: { x: M, y: 0.82 + 3 * M, w: 1 - 2 * M, h: 0.06 },
};

const ALL = ["color", "material", "pattern", "text", "image"] as const;

/** T-shirt col rond — modèle procédural de prototype (phase 1). */
export const TSHIRT_CLASSIC: GarmentDefinition = {
  reference: "TS-CLASSIC",
  versionId: "tshirt-classic@1",
  name: "T-shirt col rond",
  family: "tshirts",
  glbUrl: "/garments/tshirt-classic/v1/model.glb",
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  materials: [
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
  ],
  // Bas de manche : v croît de l'épaule vers le poignet dans l'île de la manche.
  trims: {
    cuffs: {
      zones: ["SLEEVE_LEFT", "SLEEVE_RIGHT"],
      edge: "bottom",
      defaultWidth: 0.12,
      sleeveLengthCm: 22,
    },
  },
  zones: [
    {
      code: "BODY_FRONT",
      meshName: "Zone_Body_Front",
      label: "Devant",
      uvRect: TSHIRT_UV.BODY_FRONT!,
      printAreaMm: { w: 300, h: 400 },
      allows: ALL,
      defaults: { color: "#FFFFFF", material: "cotton" },
    },
    {
      code: "BODY_BACK",
      meshName: "Zone_Body_Back",
      label: "Dos",
      uvRect: TSHIRT_UV.BODY_BACK!,
      printAreaMm: { w: 300, h: 450 },
      allows: ALL,
      defaults: { color: "#FFFFFF", material: "cotton" },
    },
    {
      code: "SLEEVE_LEFT",
      meshName: "Zone_Sleeve_Left",
      label: "Manche gauche",
      uvRect: TSHIRT_UV.SLEEVE_LEFT!,
      printAreaMm: { w: 100, h: 100 },
      allows: ALL,
      defaults: { color: "#FFFFFF", material: "cotton" },
    },
    {
      code: "SLEEVE_RIGHT",
      meshName: "Zone_Sleeve_Right",
      label: "Manche droite",
      uvRect: TSHIRT_UV.SLEEVE_RIGHT!,
      printAreaMm: { w: 100, h: 100 },
      allows: ALL,
      defaults: { color: "#FFFFFF", material: "cotton" },
    },
    {
      code: "COLLAR",
      meshName: "Zone_Collar",
      label: "Col",
      uvRect: TSHIRT_UV.COLLAR!,
      // Col : couleur, tissu, et petits marquages (texte ou logo de nuque).
      allows: ["color", "material", "text", "image"],
      defaults: { color: "#FFFFFF", material: "cotton" },
    },
  ],
};
