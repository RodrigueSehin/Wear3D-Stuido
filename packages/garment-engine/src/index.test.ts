import { describe, expect, it } from "vitest";
import { getGarmentByVersion, MATERIAL_PRESETS, meshNameToZoneCode, TSHIRT_CLASSIC } from "./index";

describe("meshNameToZoneCode", () => {
  it("convertit un nom conforme", () => {
    expect(meshNameToZoneCode("Zone_Body_Front")).toBe("BODY_FRONT");
    expect(meshNameToZoneCode("Zone_Sleeve_Left")).toBe("SLEEVE_LEFT");
  });

  it("rejette un nom non conforme", () => {
    expect(meshNameToZoneCode("Body_Front")).toBeNull();
    expect(meshNameToZoneCode("Zone_")).toBeNull();
    expect(meshNameToZoneCode("Zone_Body-Front")).toBeNull();
  });
});

describe("catalogue", () => {
  it("retrouve le T-shirt par version", () => {
    expect(getGarmentByVersion("tshirt-classic@1")).toBe(TSHIRT_CLASSIC);
  });

  it("déclare des zones cohérentes avec les noms de mesh", () => {
    for (const z of TSHIRT_CLASSIC.zones) expect(meshNameToZoneCode(z.meshName)).toBe(z.code);
  });

  it("n'a pas de rectangles UV qui se chevauchent", () => {
    const rects = TSHIRT_CLASSIC.zones.map((z) => z.uvRect);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]!;
        const b = rects[j]!;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap).toBe(false);
      }
    }
  });

  it("n'autorise que des matières connues", () => {
    for (const m of TSHIRT_CLASSIC.materials) expect(MATERIAL_PRESETS[m]).toBeDefined();
  });
});
