/** Maillage indexé minimal, indépendant de three.js (utilisable en Node). */
export interface MeshData {
  name: string;
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export type Vec3 = [number, number, number];

/**
 * Construit une grille (rows+1)×(cols+1) à partir d'une fonction de position et d'UV.
 * `closeU` relie la dernière colonne à la première (cylindre) en dupliquant le sommet
 * de couture pour conserver une île UV continue.
 */
export function buildGrid(
  name: string,
  rows: number,
  cols: number,
  point: (i: number, j: number) => Vec3,
  uv: (i: number, j: number) => [number, number],
): MeshData {
  const vertCount = (rows + 1) * (cols + 1);
  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const k = i * (cols + 1) + j;
      const p = point(i, j);
      positions.set(p, k * 3);
      uvs.set(uv(i, j), k * 2);
    }
  }
  const indices = new Uint32Array(rows * cols * 6);
  let t = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;
      indices.set([a, c, b, b, c, d], t);
      t += 6;
    }
  }
  const mesh: MeshData = {
    name,
    positions,
    uvs,
    indices,
    normals: new Float32Array(vertCount * 3),
  };
  computeNormals(mesh);
  return mesh;
}

/** Normales lissées par accumulation des normales de faces. */
export function computeNormals(mesh: MeshData): void {
  const { positions: p, indices, normals: n } = mesh;
  n.fill(0);
  for (let t = 0; t < indices.length; t += 3) {
    const ia = indices[t]! * 3;
    const ib = indices[t + 1]! * 3;
    const ic = indices[t + 2]! * 3;
    const abx = p[ib]! - p[ia]!;
    const aby = p[ib + 1]! - p[ia + 1]!;
    const abz = p[ib + 2]! - p[ia + 2]!;
    const acx = p[ic]! - p[ia]!;
    const acy = p[ic + 1]! - p[ia + 1]!;
    const acz = p[ic + 2]! - p[ia + 2]!;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    for (const i of [ia, ib, ic]) {
      n[i]! += nx;
      n[i + 1]! += ny;
      n[i + 2]! += nz;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const len = Math.hypot(n[i]!, n[i + 1]!, n[i + 2]!) || 1;
    n[i]! /= len;
    n[i + 1]! /= len;
    n[i + 2]! /= len;
  }
}

/**
 * Oriente les faces vers l'extérieur : `outward(x,y,z)` donne une direction extérieure
 * approximative ; si la majorité des normales pointent vers l'intérieur, on inverse.
 */
export function orientOutward(mesh: MeshData, outward: (p: Vec3) => Vec3): void {
  let score = 0;
  const { positions: p, normals: n } = mesh;
  for (let i = 0; i < p.length; i += 3) {
    const o = outward([p[i]!, p[i + 1]!, p[i + 2]!]);
    score += n[i]! * o[0] + n[i + 1]! * o[1] + n[i + 2]! * o[2];
  }
  if (score >= 0) return;
  const idx = mesh.indices;
  for (let t = 0; t < idx.length; t += 3) {
    const tmp = idx[t + 1]!;
    idx[t + 1] = idx[t + 2]!;
    idx[t + 2] = tmp;
  }
  computeNormals(mesh);
}

export function triangleCount(meshes: readonly MeshData[]): number {
  return meshes.reduce((sum, m) => sum + m.indices.length / 3, 0);
}
