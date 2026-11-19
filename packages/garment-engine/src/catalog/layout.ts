import type { GarmentZoneDef, UvRect, ZoneCapability } from "./types";

/** Marge entre îles : 16 px sur un atlas de 2048 px (CDC §4.4). */
const M = 16 / 2048;
const HALF = (1 - 3 * M) / 2;

/** Atlas à 5 zones : devant / dos, manches, col ; seules les hauteurs changent d'un modèle à l'autre. */
export function atlasLayout(body: number, sleeve: number, collar: number): Record<string, UvRect> {
  return {
    BODY_FRONT: { x: M, y: M, w: HALF, h: body },
    BODY_BACK: { x: 2 * M + HALF, y: M, w: HALF, h: body },
    SLEEVE_LEFT: { x: M, y: body + 2 * M, w: HALF, h: sleeve },
    SLEEVE_RIGHT: { x: 2 * M + HALF, y: body + 2 * M, w: HALF, h: sleeve },
    COLLAR: { x: M, y: body + sleeve + 3 * M, w: 1 - 2 * M, h: collar },
  };
}

const ALL: readonly ZoneCapability[] = ["color", "material", "pattern", "text", "image"];

/** Les 5 zones standard d'un vêtement du catalogue. */
export function standardZones(
  uv: Record<string, UvRect>,
  opts: {
    collarLabel: string;
    front: { w: number; h: number };
    back: { w: number; h: number };
    sleeve: { w: number; h: number };
    defaults: GarmentZoneDef["defaults"];
  },
): GarmentZoneDef[] {
  const { defaults } = opts;
  return [
    {
      code: "BODY_FRONT",
      meshName: "Zone_Body_Front",
      label: "Devant",
      uvRect: uv.BODY_FRONT!,
      printAreaMm: opts.front,
      allows: ALL,
      defaults,
    },
    {
      code: "BODY_BACK",
      meshName: "Zone_Body_Back",
      label: "Dos",
      uvRect: uv.BODY_BACK!,
      printAreaMm: opts.back,
      allows: ALL,
      defaults,
    },
    {
      code: "SLEEVE_LEFT",
      meshName: "Zone_Sleeve_Left",
      label: "Manche gauche",
      uvRect: uv.SLEEVE_LEFT!,
      printAreaMm: opts.sleeve,
      allows: ALL,
      defaults,
    },
    {
      code: "SLEEVE_RIGHT",
      meshName: "Zone_Sleeve_Right",
      label: "Manche droite",
      uvRect: uv.SLEEVE_RIGHT!,
      printAreaMm: opts.sleeve,
      allows: ALL,
      defaults,
    },
    {
      code: "COLLAR",
      meshName: "Zone_Collar",
      label: opts.collarLabel,
      uvRect: uv.COLLAR!,
      allows: ["color", "material", "text", "image"],
      defaults,
    },
  ];
}
