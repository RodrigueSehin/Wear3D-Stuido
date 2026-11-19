/**
 * Finitions du vêtement : bords de manche (bande au poignet), proposés seulement si le
 * modèle sélectionné en a (`definition.trims.cuffs`).
 */
import type { CuffTrim, DesignDocument } from "@wear3d/design-schema";
import type { GarmentDefinition } from "@wear3d/garment-engine";
import { useStudio } from "./store";

/** Réglages effectifs des bords de manche (valeurs par défaut si jamais modifiés). */
export function cuffState(
  doc: DesignDocument | null,
  def: GarmentDefinition | null,
): CuffTrim | null {
  const spec = def?.trims?.cuffs;
  if (!spec) return null;
  return (
    doc?.trims?.cuffs ?? {
      enabled: false,
      color: doc?.zones.COLLAR?.color ?? "#FFFFFF",
      width: spec.defaultWidth,
      stripes: 0,
      stripeColor: "#FFFFFF",
    }
  );
}

/** Hauteur visible du bord, en cm (taille M). */
export function cuffHeightCm(width: number, def: GarmentDefinition | null): number {
  return width * (def?.trims?.cuffs?.sleeveLengthCm ?? 22);
}

/** Modifie les bords de manche ; `coalesceKey` regroupe un geste continu (curseur, nuancier). */
export function patchCuffs(patch: Partial<CuffTrim>, coalesceKey?: string): void {
  const s = useStudio.getState();
  const current = cuffState(s.doc, s.definition);
  if (!current) return;
  if (!coalesceKey) s.seal();
  s.update(
    (d) => ({ ...d, trims: { ...d.trims, cuffs: { ...current, ...d.trims?.cuffs, ...patch } } }),
    coalesceKey,
  );
  if (!coalesceKey) s.seal();
}
