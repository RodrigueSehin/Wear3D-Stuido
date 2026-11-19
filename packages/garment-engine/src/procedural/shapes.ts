import { FOOTBALL_UV } from "../catalog/football-jersey";
import { HOODIE_UV } from "../catalog/hoodie-classic";
import type { Shape } from "./tshirt";

/** Maillot de football : col en V, manches courtes, coupe près du corps. */
export const FOOTBALL_SHAPE: Shape = {
  hemY: -0.34,
  shoulderY: 0.2,
  neckRise: 0.07,
  width: 0.97,
  neckDip: 0.12,
  neckSharp: 1.6,
  sleeveLength: 0.18,
  sleeveAngleDeg: 28,
  sleeveRadius: [0.095, 0.082],
  collarHeight: 0.02,
  collarFlare: 0.05,
  uv: FOOTBALL_UV,
};

/** Hoodie : corps ample et long, manches longues, capuche haute. */
export const HOODIE_SHAPE: Shape = {
  hemY: -0.4,
  shoulderY: 0.2,
  neckRise: 0.075,
  width: 1.06,
  neckDip: 0.03,
  neckSharp: 3,
  sleeveLength: 0.56,
  sleeveAngleDeg: 26,
  sleeveRadius: [0.108, 0.072],
  collarHeight: 0.11,
  collarFlare: 0.3,
  uv: HOODIE_UV,
};
