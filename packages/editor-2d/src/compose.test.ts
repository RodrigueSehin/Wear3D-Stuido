import {
  createEmptyDocument,
  createNumberLayer,
  createTextLayer,
  type DesignDocument,
} from "@wear3d/design-schema";
import { describe, expect, it } from "vitest";
import { composeAtlas, type Ctx2D } from "./compose";

/** Contexte factice qui enregistre les appels de dessin. */
function recordingContext() {
  const calls: { op: string; args: unknown[]; fillStyle?: unknown; font?: unknown }[] = [];
  const state: Record<string, unknown> = {};
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        calls.push({ op: prop, args, fillStyle: target.fillStyle, font: target.font });
      };
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });
  return { ctx: ctx as unknown as Ctx2D, calls };
}

const zones = [
  { code: "BODY_FRONT", x: 0, y: 0, w: 0.5, h: 0.5 },
  { code: "BODY_BACK", x: 0.5, y: 0, w: 0.5, h: 0.5 },
];

function baseDoc(): DesignDocument {
  return createEmptyDocument("t@1", [
    { code: "BODY_FRONT", color: "#112233", material: "cotton" },
    { code: "BODY_BACK", color: "#445566", material: "cotton" },
  ]);
}

const opts = {
  atlasSize: 1000,
  zones,
  resolveImage: () => undefined,
  resolveFont: () => "Anton",
  resolveNumberFont: () => "Anton",
};

describe("composeAtlas", () => {
  it("remplit chaque zone de sa couleur", () => {
    const { ctx, calls } = recordingContext();
    composeAtlas(ctx, baseDoc(), opts);
    const fills = calls.filter((c) => c.op === "fillRect").map((c) => c.fillStyle);
    expect(fills).toContain("#112233");
    expect(fills).toContain("#445566");
  });

  it("dessine texte et numéro, et ignore les calques masqués", () => {
    const doc = baseDoc();
    const text = createTextLayer("BODY_BACK", "KONE");
    const number = createNumberLayer("BODY_BACK", "9");
    const hidden = { ...createTextLayer("BODY_FRONT", "CACHE"), visible: false };
    doc.layers.push(text, number, hidden);
    const { ctx, calls } = recordingContext();
    composeAtlas(ctx, doc, opts);
    const texts = calls.filter((c) => c.op === "fillText").map((c) => c.args[0]);
    expect(texts).toEqual(["KONE", "9"]);
  });

  it("dessine l'ombre portée et la lueur en passes supplémentaires", () => {
    const doc = baseDoc();
    const text = createTextLayer("BODY_FRONT", "FX");
    text.effects.shadow.enabled = true;
    text.effects.glow.enabled = true;
    doc.layers.push(text);
    const { ctx, calls } = recordingContext();
    composeAtlas(ctx, doc, opts);
    expect(calls.filter((c) => c.op === "fillText")).toHaveLength(3);
  });

  it("applique les symétries et la hauteur libre par mise à l'échelle", () => {
    const doc = baseDoc();
    const text = createTextLayer("BODY_FRONT", "A");
    text.transform.flipX = true;
    text.transform.h = text.text.size * 1.15 * 2; // deux fois la hauteur naturelle
    doc.layers.push(text);
    const { ctx, calls } = recordingContext();
    composeAtlas(ctx, doc, opts);
    const scale = calls.find((c) => c.op === "scale");
    expect(scale?.args[0]).toBe(-1);
    expect(scale?.args[1]).toBeCloseTo(2);
  });

  it("dessine le motif d'une zone avec la couleur demandée", () => {
    const doc = baseDoc();
    doc.zones.BODY_FRONT!.pattern = {
      assetId: "pattern:band-diagonal",
      mode: "placed",
      color: "#FF0000",
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      opacity: 0.5,
    };
    const requested: string[] = [];
    const { ctx, calls } = recordingContext();
    composeAtlas(ctx, doc, {
      ...opts,
      resolvePattern: (id, color) => {
        requested.push(`${id}|${color}`);
        return { image: {} as CanvasImageSource, width: 100, height: 100 };
      },
    });
    expect(requested).toEqual(["pattern:band-diagonal|#FF0000"]);
    expect(calls.some((c) => c.op === "drawImage")).toBe(true);
  });

  it("applique la taille de police relative à la hauteur de zone", () => {
    const doc = baseDoc();
    const text = createTextLayer("BODY_FRONT", "A");
    text.text.size = 0.1; // 10 % de 500 px
    doc.layers.push(text);
    const { ctx, calls } = recordingContext();
    composeAtlas(ctx, doc, opts);
    const draw = calls.find((c) => c.op === "fillText");
    expect(String(draw?.font)).toContain("50px");
  });
});
