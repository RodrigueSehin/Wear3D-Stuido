import { TSHIRT_CLASSIC } from "./tshirt-classic";
import type { GarmentDefinition } from "./types";

export * from "./types";
export { TSHIRT_CLASSIC, TSHIRT_UV } from "./tshirt-classic";

/** Catalogue du prototype. En phase 3, il est lu depuis garment_model_versions. */
export const GARMENTS: readonly GarmentDefinition[] = [TSHIRT_CLASSIC];

export function getGarmentByVersion(versionId: string): GarmentDefinition | undefined {
  return GARMENTS.find((g) => g.versionId === versionId);
}

export function getGarmentByReference(reference: string): GarmentDefinition | undefined {
  return GARMENTS.find((g) => g.reference === reference);
}
