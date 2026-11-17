import { describe, expect, it } from "vitest";
import { annualPriceXof, planAllows } from "./index";

describe("billing", () => {
  it("applique la remise annuelle de 20 %", () => {
    expect(annualPriceXof("creator")).toBe(95_000);
    expect(annualPriceXof("enterprise")).toBeNull();
  });

  it("compare les offres", () => {
    expect(planAllows("business", "creator")).toBe(true);
    expect(planAllows("free", "business")).toBe(false);
  });
});
