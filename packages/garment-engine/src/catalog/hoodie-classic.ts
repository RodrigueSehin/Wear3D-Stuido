import { atlasLayout, standardZones } from "./layout";
import type { GarmentDefinition } from "./types";

export const HOODIE_UV = atlasLayout(0.6, 0.24, 0.1);

/** Hoodie à capuche, manches longues — modèle procédural de prototype (la capuche est la zone « Capuche »). */
export const HOODIE_CLASSIC: GarmentDefinition = {
  reference: "HD-CLASSIC",
  versionId: "hoodie-classic@1",
  name: "Hoodie à capuche",
  family: "hoodies",
  glbUrl: "/garments/hoodie-classic/v1/model.glb",
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  materials: ["cotton", "polyester", "elastane", "knit", "microfiber", "technical"],
  trims: {
    cuffs: {
      zones: ["SLEEVE_LEFT", "SLEEVE_RIGHT"],
      edge: "bottom",
      defaultWidth: 0.1,
      sleeveLengthCm: 60,
    },
  },
  zones: standardZones(HOODIE_UV, {
    collarLabel: "Capuche",
    front: { w: 320, h: 380 },
    back: { w: 340, h: 500 },
    sleeve: { w: 110, h: 400 },
    defaults: { color: "#FFFFFF", material: "cotton" },
  }),
};
