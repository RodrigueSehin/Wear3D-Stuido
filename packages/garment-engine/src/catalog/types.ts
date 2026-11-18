import type { MaterialCode } from "@wear3d/design-schema";

/** Rectangle dans l'atlas, en fraction (0..1), origine en haut à gauche (convention glTF). */
export interface UvRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ZoneCapability = "color" | "material" | "pattern" | "text" | "image";

export interface GarmentZoneDef {
  code: string;
  meshName: string;
  label: string;
  uvRect: UvRect;
  /** Zone imprimable réelle en taille M (mm). */
  printAreaMm?: { w: number; h: number };
  allows: readonly ZoneCapability[];
  defaults: { color: string; material: MaterialCode };
}

export interface GarmentDefinition {
  reference: string;
  /** Identifiant de version du modèle 3D référencé par les designs. */
  versionId: string;
  name: string;
  family: "tshirts" | "football" | "hoodies";
  glbUrl: string;
  sizes: readonly string[];
  materials: readonly MaterialCode[];
  zones: readonly GarmentZoneDef[];
}
