/** Conventions des modèles 3D (CDC §4.3, §4.4). */

/** Préfixes normalisés des objets GLB. */
export const MESH_PREFIX = {
  zone: "Zone_",
  material: "Mat_",
  morph: "Morph_",
} as const;

/** Budget de triangles par modèle. */
export const MAX_TRIANGLES = 60_000;

/** Taille de l'atlas UV : studio et export. */
export const ATLAS_SIZE = { studio: 2048, export: 4096 } as const;

/**
 * Convertit un nom de mesh en code de zone.
 * `Zone_Body_Front` → `BODY_FRONT` ; renvoie null si le nom ne suit pas la convention.
 */
export function meshNameToZoneCode(meshName: string): string | null {
  if (!meshName.startsWith(MESH_PREFIX.zone)) return null;
  const rest = meshName.slice(MESH_PREFIX.zone.length);
  if (!/^[A-Za-z0-9]+(_[A-Za-z0-9]+)*$/.test(rest)) return null;
  return rest.toUpperCase();
}
