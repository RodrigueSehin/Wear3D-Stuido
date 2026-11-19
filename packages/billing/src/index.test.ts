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

describe("quotas", () => {
  it("calcule l'utilisation et formate les tailles", async () => {
    const { usagePercent, formatBytes, PLAN_QUOTAS, isPlanId } = await import("./index");
    expect(usagePercent(50, 200)).toBe(25);
    expect(usagePercent(500, 200)).toBe(100);
    expect(usagePercent(5, null)).toBe(0);
    expect(formatBytes(4.2 * 1024 ** 3)).toBe("4,2 Go");
    expect(formatBytes(500 * 1024 ** 2)).toBe("500 Mo");
    expect(PLAN_QUOTAS.free.projects).toBe(3);
    expect(isPlanId("creator")).toBe(true);
    expect(isPlanId("gold")).toBe(false);
  });
});
