/**
 * T-shirt procédural de prototype (phase 1), conforme aux conventions du pipeline :
 * un mesh par zone (`Zone_*`), une île UV par zone, UV isotropes (même nombre de
 * mètres par pixel en largeur et en hauteur) pour qu'un logo ne soit pas déformé.
 *
 * Repère : mètres, Y vers le haut, le porteur regarde vers +Z (sa gauche = +X).
 */
import { TSHIRT_UV } from "../catalog/tshirt-classic";
import type { UvRect } from "../catalog/types";

/** Silhouette paramétrable : le T-shirt, le maillot et le hoodie partagent la même construction. */
export interface Shape {
  hemY: number;
  shoulderY: number;
  neckRise: number;
  /** Largeur du corps (multiplicateur) et profondeur. */
  width: number;
  /** Profondeur de l’encolure devant et raideur du creux (1 = rond, 2+ = en V). */
  neckDip: number;
  neckSharp: number;
  sleeveLength: number;
  sleeveAngleDeg: number;
  sleeveRadius: [number, number];
  collarHeight: number;
  collarFlare: number;
  uv: Record<string, UvRect>;
}

export const TSHIRT_SHAPE: Shape = {
  hemY: -0.36,
  shoulderY: 0.2,
  neckRise: 0.075,
  width: 1,
  neckDip: 0.055,
  neckSharp: 4,
  sleeveLength: 0.23,
  sleeveAngleDeg: 32,
  sleeveRadius: [0.098, 0.079],
  collarHeight: 0.026,
  collarFlare: 0.08,
  uv: TSHIRT_UV,
};

let S: Shape = TSHIRT_SHAPE;
import { buildGrid, orientOutward, type MeshData, type Vec3 } from "./mesh";

const TORSO_SPLIT = 0.8; // fraction de v consacrée au torse, le reste à l'épaule

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Demi-largeur et demi-profondeur de la section du corps au paramètre v (0 = ourlet). */
function section(v: number): { a: number; b: number; y: number } {
  if (v <= TORSO_SPLIT) {
    const t = v / TORSO_SPLIT;
    return {
      a: (0.245 + 0.015 * smooth(clamp01((t - 0.3) / 0.5))) * S.width,
      b: (0.098 + 0.014 * smooth(clamp01((t - 0.35) / 0.5))) * S.width,
      y: lerp(S.hemY, S.shoulderY, t),
    };
  }
  const t = (v - TORSO_SPLIT) / (1 - TORSO_SPLIT);
  const e = smooth(t);
  return {
    a: lerp(0.26 * S.width, 0.088, e),
    b: lerp(0.112 * S.width, 0.074, e),
    y: S.shoulderY + S.neckRise * Math.sin((t * Math.PI) / 2),
  };
}

/** Point du corps ; θ = 0 au centre devant, π au centre dos. */
function bodyPoint(v: number, theta: number): Vec3 {
  const { a, b, y } = section(v);
  const x = a * Math.sin(theta);
  const z = b * Math.cos(theta);
  // Encolure plus basse devant : creux en fin d'épaule, centré sur θ = 0.
  const tTop = clamp01((v - TORSO_SPLIT) / (1 - TORSO_SPLIT));
  const front = Math.max(0, Math.cos(theta));
  const dip = S.neckDip * tTop ** 3 * front ** S.neckSharp;
  return [x, y - dip, z];
}

const dist = (p: Vec3, q: Vec3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/**
 * Projette des coordonnées métriques (u autour, v depuis le haut) dans un rectangle
 * d'atlas en conservant l'isotropie, île centrée.
 */
function fitIsotropic(rect: UvRect, spanU: number, spanV: number) {
  // L'atlas est carré : une même fraction vaut le même nombre de pixels en u et en v.
  const scale = Math.min(rect.w / spanU, rect.h / spanV);
  const offU = rect.x + (rect.w - spanU * scale) / 2;
  const offV = rect.y + (rect.h - spanV * scale) / 2;
  return (u: number, v: number): [number, number] => [offU + u * scale, offV + v * scale];
}

function bodyPanel(name: string, front: boolean, rows = 64, cols = 48): MeshData {
  const thetaAt = (j: number) => (front ? -Math.PI / 2 : Math.PI / 2) + (j / cols) * Math.PI;
  const vAt = (i: number) => 1 - i / rows; // i = 0 en haut (encolure)
  const grid: Vec3[][] = [];
  for (let i = 0; i <= rows; i++) {
    const row: Vec3[] = [];
    for (let j = 0; j <= cols; j++) row.push(bodyPoint(vAt(i), thetaAt(j)));
    grid.push(row);
  }

  // Longueur d'arc signée depuis la colonne centrale, pour chaque rangée.
  const mid = cols / 2;
  const arc: number[][] = grid.map((row) => {
    const s = new Array<number>(cols + 1).fill(0);
    for (let j = mid + 1; j <= cols; j++) s[j] = s[j - 1]! + dist(row[j]!, row[j - 1]!);
    for (let j = mid - 1; j >= 0; j--) s[j] = s[j + 1]! - dist(row[j]!, row[j + 1]!);
    return s;
  });
  // Distance depuis le haut le long de la colonne centrale.
  const down = [0];
  for (let i = 1; i <= rows; i++)
    down.push(down[i - 1]! + dist(grid[i]![mid]!, grid[i - 1]![mid]!));

  const maxArc = Math.max(...arc.map((s) => s[cols]! - s[0]!));
  const fit = fitIsotropic(S.uv[front ? "BODY_FRONT" : "BODY_BACK"]!, maxArc, down[rows]!);

  const mesh = buildGrid(
    name,
    rows,
    cols,
    (i, j) => grid[i]![j]!,
    (i, j) => fit(maxArc / 2 + arc[i]![j]!, down[i]!),
  );
  orientOutward(mesh, ([x, , z]) => [x, 0, z]);
  return mesh;
}

function sleeve(name: string, side: 1 | -1, rows = 20, cols = 40): MeshData {
  const length = S.sleeveLength;
  const angle = (-S.sleeveAngleDeg * Math.PI) / 180;
  const dir: Vec3 = [side * Math.cos(angle), Math.sin(angle), 0];
  const origin: Vec3 = [side * 0.215 * S.width, S.shoulderY - 0.065, 0];
  const up: Vec3 = [-dir[1] * side, dir[0] * side, 0]; // perpendiculaire dans le plan XY
  const fwd: Vec3 = [0, 0, 1];
  const radius = (t: number) => lerp(S.sleeveRadius[0], S.sleeveRadius[1], t);

  const point = (i: number, j: number): Vec3 => {
    const t = i / rows;
    const phi = (j / cols) * Math.PI * 2; // 0 = dessus de la manche
    const r = radius(t);
    const cu = Math.cos(phi) * r;
    const cf = Math.sin(phi) * r * 0.92;
    return [
      origin[0] + dir[0] * length * t + up[0] * cu + fwd[0] * cf,
      origin[1] + dir[1] * length * t + up[1] * cu + fwd[1] * cf,
      origin[2] + dir[2] * length * t + up[2] * cu + fwd[2] * cf,
    ];
  };

  const circ = Math.PI * 2 * radius(0);
  const fit = fitIsotropic(S.uv[side === 1 ? "SLEEVE_LEFT" : "SLEEVE_RIGHT"]!, circ, length);
  // Couture sous la manche : décalage d'un demi-tour pour centrer le dessus dans l'île.
  const mesh = buildGrid(
    name,
    rows,
    cols,
    (i, j) => point(i, j + cols / 2),
    (i, j) => fit((j / cols) * circ, (i / rows) * length),
  );
  orientOutward(mesh, (p) => {
    const t = Math.max(
      0,
      (p[0] - origin[0]) * dir[0] + (p[1] - origin[1]) * dir[1] + (p[2] - origin[2]) * dir[2],
    );
    const c: Vec3 = [origin[0] + dir[0] * t, origin[1] + dir[1] * t, origin[2] + dir[2] * t];
    return [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  });
  return mesh;
}

function collar(name: string, rows = 4, cols = 96): MeshData {
  const height = S.collarHeight;
  const point = (i: number, j: number): Vec3 => {
    const theta = Math.PI + (j / cols) * Math.PI * 2; // couture au centre dos
    const base = bodyPoint(1, theta);
    const t = i / rows; // 0 = haut du col
    const flare = 1 + S.collarFlare * (1 - t);
    return [base[0] * flare, base[1] + height * (1 - t), base[2] * flare];
  };
  const ring = Array.from({ length: cols + 1 }, (_, j) => point(rows, j));
  let circ = 0;
  const along = [0];
  for (let j = 1; j <= cols; j++) {
    circ += dist(ring[j]!, ring[j - 1]!);
    along.push(circ);
  }
  const fit = fitIsotropic(S.uv.COLLAR!, circ, height);
  const mesh = buildGrid(name, rows, cols, point, (i, j) => fit(along[j]!, (i / rows) * height));
  orientOutward(mesh, ([x, , z]) => [x, 0, z]);
  return mesh;
}

/** Génère les 5 zones d’un vêtement à partir de sa silhouette (T-shirt par défaut). */
export function buildTshirtMeshes(shape: Shape = TSHIRT_SHAPE): MeshData[] {
  S = shape;
  return [
    bodyPanel("Zone_Body_Front", true),
    bodyPanel("Zone_Body_Back", false),
    sleeve("Zone_Sleeve_Left", 1),
    sleeve("Zone_Sleeve_Right", -1),
    collar("Zone_Collar"),
  ];
}
