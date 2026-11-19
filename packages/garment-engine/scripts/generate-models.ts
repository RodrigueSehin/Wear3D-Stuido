/**
 * Génère les modèles procéduraux du prototype dans apps/web/public/garments.
 * Usage : pnpm --filter @wear3d/garment-engine generate
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FOOTBALL_JERSEY,
  HOODIE_CLASSIC,
  TSHIRT_CLASSIC,
  type GarmentDefinition,
} from "../src/catalog";
import { MAX_TRIANGLES } from "../src/conventions";
import {
  buildTshirtMeshes,
  FOOTBALL_SHAPE,
  HOODIE_SHAPE,
  triangleCount,
  TSHIRT_SHAPE,
  writeGlb,
  type Shape,
} from "../src/procedural";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const MODELS: [GarmentDefinition, Shape][] = [
  [TSHIRT_CLASSIC, TSHIRT_SHAPE],
  [FOOTBALL_JERSEY, FOOTBALL_SHAPE],
  [HOODIE_CLASSIC, HOODIE_SHAPE],
];

for (const [def, shape] of MODELS) {
  const out = resolve(root, "apps/web/public", def.glbUrl.replace(/^\//, ""));
  const meshes = buildTshirtMeshes(shape);
  const tris = triangleCount(meshes);
  if (tris > MAX_TRIANGLES) {
    throw new Error(`${def.reference} : ${tris} triangles > ${MAX_TRIANGLES}`);
  }

  const glb = writeGlb(meshes);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, glb);

  // Configuration JSON du modèle (CDC F-01), lue par l'administration en phase 3.
  writeFileSync(
    resolve(dirname(out), "config.json"),
    JSON.stringify(
      {
        reference: def.reference,
        versionId: def.versionId,
        sizes: def.sizes,
        materials: def.materials,
        zones: def.zones,
      },
      null,
      2,
    ) + "\n",
  );
  console.info(
    `${def.reference} : ${tris} triangles, ${(glb.byteLength / 1024).toFixed(0)} Ko → ${out}`,
  );
}
