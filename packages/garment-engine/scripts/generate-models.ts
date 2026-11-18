/**
 * Génère les modèles procéduraux du prototype dans apps/web/public/garments.
 * Usage : pnpm --filter @wear3d/garment-engine generate
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TSHIRT_CLASSIC } from "../src/catalog";
import { MAX_TRIANGLES } from "../src/conventions";
import { buildTshirtMeshes, triangleCount, writeGlb } from "../src/procedural";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const out = resolve(root, "apps/web/public", TSHIRT_CLASSIC.glbUrl.replace(/^\//, ""));

const meshes = buildTshirtMeshes();
const tris = triangleCount(meshes);
if (tris > MAX_TRIANGLES) throw new Error(`${tris} triangles > ${MAX_TRIANGLES}`);

const glb = writeGlb(meshes);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, glb);

// Configuration JSON du modèle (CDC F-01), lue par l'administration en phase 3.
writeFileSync(
  resolve(dirname(out), "config.json"),
  JSON.stringify(
    {
      reference: TSHIRT_CLASSIC.reference,
      versionId: TSHIRT_CLASSIC.versionId,
      sizes: TSHIRT_CLASSIC.sizes,
      materials: TSHIRT_CLASSIC.materials,
      zones: TSHIRT_CLASSIC.zones,
    },
    null,
    2,
  ) + "\n",
);

console.info(
  `${TSHIRT_CLASSIC.reference} : ${tris} triangles, ${(glb.byteLength / 1024).toFixed(0)} Ko → ${out}`,
);
