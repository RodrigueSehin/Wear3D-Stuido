import { describe, expect, it } from "vitest";
import { creditCost } from "./index";

describe("creditCost", () => {
  it("4 concepts = 4 crédits", () => expect(creditCost("concept", 4)).toBe(4));
  it("3 palettes = 2 crédits (arrondi supérieur)", () => expect(creditCost("palette", 3)).toBe(2));
  it("1 motif = 2 crédits", () => expect(creditCost("pattern", 1)).toBe(2));
});
