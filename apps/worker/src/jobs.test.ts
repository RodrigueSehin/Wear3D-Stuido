import { describe, expect, it } from "vitest";
import { nextStatusAfterFailure } from "./jobs";

describe("nextStatusAfterFailure", () => {
  it("réessaie avant la 3e tentative", () => {
    expect(nextStatusAfterFailure(1, 3)).toBe("pending");
    expect(nextStatusAfterFailure(2, 3)).toBe("pending");
  });

  it("échoue définitivement à la 3e tentative", () => {
    expect(nextStatusAfterFailure(3, 3)).toBe("failed");
  });
});
