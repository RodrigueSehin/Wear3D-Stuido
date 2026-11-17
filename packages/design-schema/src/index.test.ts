import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION, hexColorSchema, zoneCodeSchema } from "./index";

describe("design-schema", () => {
  it("expose la version 1 du format", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it("valide les codes de zone", () => {
    expect(zoneCodeSchema.safeParse("BODY_FRONT").success).toBe(true);
    expect(zoneCodeSchema.safeParse("body-front").success).toBe(false);
  });

  it("valide les couleurs HEX", () => {
    expect(hexColorSchema.safeParse("#1F3F6D").success).toBe(true);
    expect(hexColorSchema.safeParse("1F3F6D").success).toBe(false);
  });
});
