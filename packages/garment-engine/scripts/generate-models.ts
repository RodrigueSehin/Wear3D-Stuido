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

// Données du catalogue (CDC §5.1) : supabase/seed.sql, rejoué par `supabase db push --include-seed`
// ou collé dans l'éditeur SQL. Idempotent (on conflict).
const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const arr = (a: readonly string[]) => `array[${a.map(q).join(",")}]::text[]`;
const FAMILY: Record<string, string> = {
  tshirts: "T-shirts",
  football: "Maillots de football",
  hoodies: "Hoodies",
};
const lines: string[] = [
  "-- Généré par `pnpm --filter @wear3d/garment-engine generate`. Ne pas modifier à la main.",
  "",
];
Object.entries(FAMILY).forEach(([code, name], i) => {
  lines.push(
    `insert into public.garment_categories (code, name, sort_order) values (${q(code)}, ${q(name)}, ${i}) on conflict (code) do nothing;`,
  );
});
lines.push("");
for (const [def] of MODELS) {
  const [, versionTag] = def.versionId.split("@");
  lines.push(
    `insert into public.garment_models (category_id, reference, name, is_active)`,
    `  select id, ${q(def.reference)}, ${q(def.name)}, true from public.garment_categories where code = ${q(def.family)}`,
    `  on conflict (reference) do nothing;`,
    `insert into public.garment_model_versions (garment_model_id, version, version_key, glb_path, sizes, config)`,
    `  select id, ${Number(versionTag)}, ${q(def.versionId)}, ${q(def.glbUrl)}, ${arr(def.sizes)}, ${q(JSON.stringify({ materials: def.materials, trims: def.trims ?? {} }))}::jsonb`,
    `  from public.garment_models where reference = ${q(def.reference)}`,
    `  on conflict (version_key) do nothing;`,
    `update public.garment_models m set current_version_id = v.id`,
    `  from public.garment_model_versions v where v.garment_model_id = m.id and v.version_key = ${q(def.versionId)};`,
  );
  def.zones.forEach((z, k) => {
    lines.push(
      `insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)`,
      `  select id, ${q(z.code)}, ${q(z.meshName)}, ${q(z.label)}, ${q(JSON.stringify(z.uvRect))}::jsonb, ${z.printAreaMm ? q(JSON.stringify(z.printAreaMm)) + "::jsonb" : "null"}, ${arr(z.allows)}, ${k}`,
      `  from public.garment_model_versions where version_key = ${q(def.versionId)}`,
      `  on conflict (model_version_id, code) do nothing;`,
    );
  });
  lines.push("");
}
writeFileSync(resolve(root, "supabase/seed.sql"), lines.join("\n") + "\n");
console.info("supabase/seed.sql régénéré");
