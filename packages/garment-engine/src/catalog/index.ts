import { FOOTBALL_JERSEY } from "./football-jersey";
import { HOODIE_CLASSIC } from "./hoodie-classic";
import { TSHIRT_CLASSIC } from "./tshirt-classic";
import type { GarmentDefinition } from "./types";

export * from "./types";
export { TSHIRT_CLASSIC, TSHIRT_UV } from "./tshirt-classic";
export { FOOTBALL_JERSEY, FOOTBALL_UV } from "./football-jersey";
export { HOODIE_CLASSIC, HOODIE_UV } from "./hoodie-classic";

/** Catalogue du prototype. En phase 3, il est lu depuis garment_model_versions. */
export const GARMENTS: readonly GarmentDefinition[] = [
  TSHIRT_CLASSIC,
  FOOTBALL_JERSEY,
  HOODIE_CLASSIC,
];

export function getGarmentByVersion(versionId: string): GarmentDefinition | undefined {
  return GARMENTS.find((g) => g.versionId === versionId);
}

export function getGarmentByReference(reference: string): GarmentDefinition | undefined {
  return GARMENTS.find((g) => g.reference === reference);
}
