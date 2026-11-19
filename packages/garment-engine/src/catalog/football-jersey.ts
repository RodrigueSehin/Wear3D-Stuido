import { atlasLayout, standardZones } from "./layout";
import type { GarmentDefinition } from "./types";

export const FOOTBALL_UV = atlasLayout(0.6, 0.22, 0.06);

/** Maillot de football col en V, manches courtes — modèle procédural de prototype. */
export const FOOTBALL_JERSEY: GarmentDefinition = {
  reference: "FB-JERSEY",
  versionId: "football-jersey@1",
  name: "Maillot de football",
  family: "football",
  glbUrl: "/garments/football-jersey/v1/model.glb",
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  materials: ["poly-sport", "polyester", "sport-mesh", "technical", "microfiber", "honeycomb"],
  trims: {
    cuffs: {
      zones: ["SLEEVE_LEFT", "SLEEVE_RIGHT"],
      edge: "bottom",
      defaultWidth: 0.1,
      sleeveLengthCm: 18,
    },
  },
  zones: standardZones(FOOTBALL_UV, {
    collarLabel: "Col",
    front: { w: 300, h: 420 },
    back: { w: 320, h: 480 },
    sleeve: { w: 110, h: 100 },
    defaults: { color: "#FFFFFF", material: "poly-sport" },
  }),
};
