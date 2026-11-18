import { createImageLayer, createTextLayer } from "@wear3d/design-schema";
import { describe, expect, it } from "vitest";
import {
  atlasUvToZone,
  effectiveDpi,
  hitTestLayer,
  isInsideZone,
  pickLayer,
  zoneRectPx,
} from "./geometry";

const zone = { code: "BODY_FRONT", x: 0.25, y: 0.1, w: 0.5, h: 0.6 };
const px = zoneRectPx(zone, 2048);

describe("atlasUvToZone", () => {
  it("convertit le centre de la zone en (0.5, 0.5)", () => {
    const p = atlasUvToZone(zone, 0.5, 0.4);
    expect(p.x).toBeCloseTo(0.5);
    expect(p.y).toBeCloseTo(0.5);
  });

  it("détecte un point hors zone", () => {
    expect(isInsideZone(atlasUvToZone(zone, 0.1, 0.4))).toBe(false);
  });
});

describe("hitTestLayer", () => {
  it("touche le centre d'une image et pas un point éloigné", () => {
    const img = createImageLayer("BODY_FRONT", "a1");
    img.transform = { x: 0.5, y: 0.5, w: 0.2, rotation: 0, flipX: false, flipY: false };
    expect(hitTestLayer(img, px, { x: 0.5, y: 0.5 })).toBe(true);
    expect(hitTestLayer(img, px, { x: 0.9, y: 0.5 })).toBe(false);
  });

  it("tient compte de la rotation", () => {
    const text = createTextLayer("BODY_FRONT");
    text.transform = { x: 0.5, y: 0.5, w: 0.8, rotation: 90, flipX: false, flipY: false };
    // Texte large tourné de 90° : un point au-dessus (axe y) est dedans, à droite non.
    expect(hitTestLayer(text, px, { x: 0.5, y: 0.75 })).toBe(true);
    expect(hitTestLayer(text, px, { x: 0.85, y: 0.5 })).toBe(false);
  });
});

describe("pickLayer", () => {
  it("renvoie le calque le plus haut, ignore verrouillés et masqués", () => {
    const a = createImageLayer("BODY_FRONT", "a");
    const b = createImageLayer("BODY_FRONT", "b");
    const locked = { ...createImageLayer("BODY_FRONT", "c"), locked: true };
    for (const l of [a, b, locked])
      l.transform = { x: 0.5, y: 0.5, w: 0.3, rotation: 0, flipX: false, flipY: false };
    expect(pickLayer([a, b, locked], "BODY_FRONT", px, { x: 0.5, y: 0.5 })?.id).toBe(b.id);
    expect(pickLayer([a, b], "BODY_BACK", px, { x: 0.5, y: 0.5 })).toBeUndefined();
  });
});

describe("effectiveDpi", () => {
  it("calcule la résolution à la taille imprimée", () => {
    // 600 px sur 20 % de 300 mm = 60 mm ≈ 2,36 po → ~254 dpi
    expect(Math.round(effectiveDpi(600, 0.2, 300))).toBe(254);
  });
});
