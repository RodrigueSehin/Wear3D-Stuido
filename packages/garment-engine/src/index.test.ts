import { describe, expect, it } from "vitest";
import { meshNameToZoneCode } from "./index";

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
