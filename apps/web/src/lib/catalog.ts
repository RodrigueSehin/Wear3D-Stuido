/**
 * Catalogue public : familles de vêtements et modèles disponibles. Les modèles viennent du
 * catalogue du moteur 3D ; les familles sans modèle sont annoncées « bientôt ».
 */
import { GARMENTS, type GarmentDefinition } from "@wear3d/garment-engine";

export const FAMILIES = [
  { id: "tshirts", label: "T-shirts" },
  { id: "football", label: "Maillots de football" },
  { id: "polos", label: "Polos" },
  { id: "hoodies", label: "Hoodies" },
  { id: "sport", label: "Tenues de sport" },
  { id: "basketball", label: "Maillots de basketball" },
  { id: "uniforms", label: "Uniformes pro" },
  { id: "shorts", label: "Shorts & pantalons" },
  { id: "jackets", label: "Vestes" },
] as const;

export type FamilyId = (typeof FAMILIES)[number]["id"];

/** Image de présentation d'un modèle (rendu du hero en attendant les vignettes 3D). */
const PREVIEW: Record<string, string> = {
  tshirts: "/hero/jersey-polo.png",
  football: "/hero/jersey-football.png",
  hoodies: "/hero/jersey-hoodie.png",
};
export const previewOf = (family: string) => PREVIEW[family] ?? "/hero/jersey-polo.png";

export const familyLabel = (id: string) => FAMILIES.find((f) => f.id === id)?.label ?? id;

export function modelsOf(family?: string): readonly GarmentDefinition[] {
  return family ? GARMENTS.filter((g) => g.family === family) : GARMENTS;
}

/** Référence en URL : `ts-classic` ↔ `TS-CLASSIC`. */
export const slugOf = (g: GarmentDefinition) => g.reference.toLowerCase();

export function modelBySlug(family: string, slug: string): GarmentDefinition | undefined {
  return GARMENTS.find((g) => g.family === family && slugOf(g) === slug.toLowerCase());
}

/** Le studio ouvre un nouveau design sur ce modèle. */
export const studioHref = (g: GarmentDefinition) =>
  `/studio/nouveau?modele=${encodeURIComponent(g.reference)}`;
