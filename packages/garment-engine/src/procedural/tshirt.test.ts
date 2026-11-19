import { describe, expect, it } from "vitest";
import { FOOTBALL_JERSEY, HOODIE_CLASSIC, TSHIRT_CLASSIC } from "../catalog";
import { MAX_TRIANGLES, meshNameToZoneCode } from "../conventions";
import { readGlbJson, writeGlb } from "./glb";
import { triangleCount } from "./mesh";
import { FOOTBALL_SHAPE, HOODIE_SHAPE } from "./shapes";
import { buildTshirtMeshes } from "./tshirt";

const meshes = buildTshirtMeshes();

describe("T-shirt procédural", () => {
  it("respecte le budget de triangles", () => {
    expect(triangleCount(meshes)).toBeLessThan(MAX_TRIANGLES);
  });

  it("nomme chaque mesh selon une zone de la définition", () => {
    const codes = TSHIRT_CLASSIC.zones.map((z) => z.code).sort();
    expect(meshes.map((m) => meshNameToZoneCode(m.name)).sort()).toEqual(codes);
  });

  it("garde chaque île UV dans le rectangle de sa zone", () => {
    for (const mesh of meshes) {
      const zone = TSHIRT_CLASSIC.zones.find((z) => z.meshName === mesh.name)!;
      const r = zone.uvRect;
      for (let i = 0; i < mesh.uvs.length; i += 2) {
        expect(mesh.uvs[i]!).toBeGreaterThanOrEqual(r.x - 1e-6);
        expect(mesh.uvs[i]!).toBeLessThanOrEqual(r.x + r.w + 1e-6);
        expect(mesh.uvs[i + 1]!).toBeGreaterThanOrEqual(r.y - 1e-6);
        expect(mesh.uvs[i + 1]!).toBeLessThanOrEqual(r.y + r.h + 1e-6);
      }
    }
  });

  it("produit des UV isotropes sur la poitrine (pas de déformation des logos)", () => {
    const front = meshes.find((m) => m.name === "Zone_Body_Front")!;
    // Comparer, au milieu du torse, le ratio distance 3D / distance UV en u et en v.
    const cols = 48;
    const k = (i: number, j: number) => i * (cols + 1) + j;
    const ratio = (a: number, b: number) => {
      const p = front.positions;
      const d3 = Math.hypot(
        p[a * 3]! - p[b * 3]!,
        p[a * 3 + 1]! - p[b * 3 + 1]!,
        p[a * 3 + 2]! - p[b * 3 + 2]!,
      );
      const du = Math.hypot(
        front.uvs[a * 2]! - front.uvs[b * 2]!,
        front.uvs[a * 2 + 1]! - front.uvs[b * 2 + 1]!,
      );
      return d3 / du;
    };
    const horizontal = ratio(k(30, 24), k(30, 25));
    const vertical = ratio(k(30, 24), k(31, 24));
    expect(Math.abs(horizontal / vertical - 1)).toBeLessThan(0.05);
  });

  it("oriente les normales du devant vers +Z", () => {
    const front = meshes.find((m) => m.name === "Zone_Body_Front")!;
    const center = 30 * 49 + 24;
    expect(front.normals[center * 3 + 2]!).toBeGreaterThan(0.5);
  });
});

describe("writeGlb", () => {
  it("écrit un GLB valide avec un nœud et un matériau par zone", () => {
    const glb = writeGlb(meshes);
    expect(glb.byteLength % 4).toBe(0);
    const { version, json } = readGlbJson(glb);
    expect(version).toBe(2);
    const nodes = json.nodes as { name: string }[];
    expect(nodes.map((n) => n.name)).toContain("Zone_Body_Front");
    const materials = json.materials as { name: string }[];
    expect(materials.map((m) => m.name)).toContain("Mat_Body_Front");
  });
});

describe.each([
  ["maillot de football", FOOTBALL_JERSEY, FOOTBALL_SHAPE],
  ["hoodie", HOODIE_CLASSIC, HOODIE_SHAPE],
])("%s procédural", (_name, def, shape) => {
  const m = buildTshirtMeshes(shape);

  it("respecte le budget et les zones de sa définition", () => {
    expect(triangleCount(m)).toBeLessThan(MAX_TRIANGLES);
    expect(m.map((x) => x.name).sort()).toEqual(def.zones.map((z) => z.meshName).sort());
  });

  it("garde chaque île UV dans le rectangle de sa zone", () => {
    for (const mesh of m) {
      const r = def.zones.find((z) => z.meshName === mesh.name)!.uvRect;
      for (let i = 0; i < mesh.uvs.length; i += 2) {
        expect(mesh.uvs[i]!).toBeGreaterThanOrEqual(r.x - 1e-6);
        expect(mesh.uvs[i]!).toBeLessThanOrEqual(r.x + r.w + 1e-6);
        expect(mesh.uvs[i + 1]!).toBeGreaterThanOrEqual(r.y - 1e-6);
        expect(mesh.uvs[i + 1]!).toBeLessThanOrEqual(r.y + r.h + 1e-6);
      }
    }
  });
});
