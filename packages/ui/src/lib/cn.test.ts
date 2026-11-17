import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("résout les conflits Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    const hidden = false;
    expect(cn("text-sm", hidden && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});
