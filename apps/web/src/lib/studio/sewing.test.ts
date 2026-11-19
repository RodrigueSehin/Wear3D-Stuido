import { describe, expect, it } from "vitest";
import {
  cutPlanLayout,
  exportGeometry,
  offsetOutline,
  patternPdf,
  patternPlt,
  patternSvg,
  pieceFrame,
  pieceOutline,
  pieceSize,
  PIECES,
  polygonArea,
  sheetLayout,
} from "./sewing";

const front = PIECES.find((p) => p.id === "front")!;

describe("patron de couture", () => {
  it("gradue les pièces : chaque taille est plus grande que la précédente", () => {
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const widths = sizes.map((s) => pieceSize(front, s).w);
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    expect(pieceSize(front, "L")).toEqual({ w: 53, h: 73 });
  });

  it("la marge de couture agrandit la pièce, quel que soit le sens du contour", () => {
    for (const p of PIECES) {
      const pts = pieceOutline(p, "L");
      const inner = Math.abs(polygonArea(pts));
      const outer = Math.abs(polygonArea(offsetOutline(pts, 1)));
      expect(outer).toBeGreaterThan(inner);
      const reversed = [...pts].reverse();
      expect(Math.abs(polygonArea(offsetOutline(reversed, 1)))).toBeGreaterThan(inner);
    }
  });

  it("la mise en page du patron ne superpose aucune pièce", () => {
    const { placed } = sheetLayout(undefined, "XL");
    const boxes = placed.map((pl) => ({ ...pieceFrame(pl.piece, "XL"), x: pl.x, y: pl.y }));
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap).toBe(false);
      }
  });

  it("le plan de coupe tient dans la laize et compte chaque coupe", () => {
    const sewing = {
      fabricWidth: 140,
      pieces: { cuff: { seam: 1, grain: "vertical" as const, comment: "", hidden: false, cut: 2 } },
    };
    const plan = cutPlanLayout(sewing, "M");
    for (const pl of plan.placed)
      expect(pl.x + pieceFrame(pl.piece, "M").w).toBeLessThanOrEqual(140);
    expect(plan.placed.filter((pl) => pl.piece.id === "cuff")).toHaveLength(2);
    expect(plan.efficiency).toBeGreaterThan(0.2);
    expect(plan.efficiency).toBeLessThan(1);
  });

  it("une pièce masquée n'est ni affichée ni coupée", () => {
    const sewing = {
      fabricWidth: 150,
      pieces: {
        "collar-inner": { seam: 1, grain: "vertical" as const, comment: "", hidden: true },
      },
    };
    expect(sheetLayout(sewing, "L").placed.some((p) => p.piece.id === "collar-inner")).toBe(false);
    expect(cutPlanLayout(sewing, "L").placed.some((p) => p.piece.id === "collar-inner")).toBe(
      false,
    );
  });

  it("exporte un PDF valide à l'échelle 1:1 (table xref exacte)", async () => {
    const plan = cutPlanLayout(undefined, "L");
    const blob = patternPdf(exportGeometry(plan, undefined, "L"), plan.width, plan.height);
    const text = new TextDecoder("latin1").decode(await blob.arrayBuffer());
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    const xref = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(xref, xref + 4)).toBe("xref");
    // MediaBox en points : 150 cm de laize = 4251,97 pt.
    expect(text).toContain("/MediaBox [0 0 4251.97");
  });

  it("exporte PLT (HPGL) et SVG en millimètres", () => {
    const plan = cutPlanLayout(undefined, "L");
    const geo = exportGeometry(plan, undefined, "L");
    const plt = patternPlt(geo, plan.height);
    expect(plt.startsWith("IN;")).toBe(true);
    expect(plt).toContain("SP1;");
    // Fichier HPGL : ASCII uniquement (les accents sont retirés des étiquettes).
    expect([...plt].every((c) => c.charCodeAt(0) < 128)).toBe(true);
    const svg = patternSvg(geo, plan.width, plan.height);
    expect(svg).toContain('width="1500.00mm"');
  });
});
