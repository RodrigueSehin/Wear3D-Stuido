import { describe, expect, it } from "vitest";
import {
  applyPlayer,
  createEmptyDocument,
  createTextLayer,
  CURRENT_SCHEMA_VERSION,
  hexColorSchema,
  parseDesignDocument,
  resolveTokens,
  safeParseDesignDocument,
  zoneCodeSchema,
} from "./index";

/** Exemple du CDC §5.4. */
const cdcExample = {
  schemaVersion: 1,
  model: { versionId: "uuid", size: "L", morph: "worn" },
  zones: {
    BODY_FRONT: { color: "#1F3F6D", material: "poly-sport" },
    BODY_BACK: { color: "#1F3F6D", material: "poly-sport" },
    SLEEVE_LEFT: {
      color: "#EED58E",
      material: "poly-sport",
      pattern: { assetId: "uuid", scale: 0.5, rotation: 0, opacity: 0.3 },
    },
  },
  layers: [
    {
      id: "el_01",
      type: "text",
      zone: "BODY_BACK",
      locked: false,
      visible: true,
      transform: { x: 0.5, y: 0.25, w: 0.6, rotation: 0 },
      text: {
        value: "{player.name}",
        font: "anton",
        size: 0.08,
        color: "#FFFFFF",
        stroke: { color: "#14243B", width: 0.004 },
        arc: 0,
      },
    },
    {
      id: "el_02",
      type: "number",
      zone: "BODY_BACK",
      transform: { x: 0.5, y: 0.55, w: 0.45, rotation: 0 },
      number: { value: "{player.number}", style: "block-classic", color: "#EED58E" },
    },
    {
      id: "el_03",
      type: "image",
      zone: "BODY_FRONT",
      assetId: "uuid",
      transform: { x: 0.72, y: 0.2, w: 0.18, rotation: 0 },
    },
  ],
};

describe("primitives", () => {
  it("valide les codes de zone et les couleurs", () => {
    expect(zoneCodeSchema.safeParse("BODY_FRONT").success).toBe(true);
    expect(zoneCodeSchema.safeParse("body-front").success).toBe(false);
    expect(hexColorSchema.safeParse("#1F3F6D").success).toBe(true);
    expect(hexColorSchema.safeParse("1F3F6D").success).toBe(false);
  });
});

describe("parseDesignDocument", () => {
  it("accepte l'exemple du cahier des charges et applique les valeurs par défaut", () => {
    const doc = parseDesignDocument(cdcExample);
    expect(doc.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(doc.layers).toHaveLength(3);
    const number = doc.layers[1]!;
    expect(number.locked).toBe(false);
    expect(number.visible).toBe(true);
    expect(doc.zones.SLEEVE_LEFT?.pattern?.mode).toBe("repeat");
  });

  it("refuse une version future", () => {
    const r = safeParseDesignDocument({ ...cdcExample, schemaVersion: 99 });
    expect(r.success).toBe(false);
  });

  it("refuse une couleur invalide", () => {
    const bad = structuredClone(cdcExample);
    bad.zones.BODY_FRONT.color = "bleu";
    expect(safeParseDesignDocument(bad).success).toBe(false);
  });

  it("refuse un type de calque inconnu", () => {
    const bad = structuredClone(cdcExample) as { layers: unknown[] };
    bad.layers.push({
      id: "x",
      type: "sticker",
      zone: "BODY_FRONT",
      transform: { x: 0, y: 0, w: 1 },
    });
    expect(safeParseDesignDocument(bad).success).toBe(false);
  });

  it("aller-retour JSON sans perte", () => {
    const doc = parseDesignDocument(cdcExample);
    expect(parseDesignDocument(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
  });
});

describe("jetons d'effectif", () => {
  it("remplace les jetons", () => {
    expect(resolveTokens("{player.name} #{player.number}", { name: "KONE", number: "9" })).toBe(
      "KONE #9",
    );
    expect(resolveTokens("{player.name}", {})).toBe("");
  });

  it("applique un joueur au document", () => {
    const doc = applyPlayer(parseDesignDocument(cdcExample), { name: "DIALLO", number: "7" });
    const [text, number] = doc.layers;
    expect(text?.type === "text" && text.text.value).toBe("DIALLO");
    expect(number?.type === "number" && number.number.value).toBe("7");
  });
});

describe("factory", () => {
  it("crée un document vierge valide", () => {
    const doc = createEmptyDocument("tshirt-classic@1", [
      { code: "BODY_FRONT", color: "#FFFFFF", material: "cotton" },
    ]);
    doc.layers.push(createTextLayer("BODY_FRONT"));
    expect(() => parseDesignDocument(doc)).not.toThrow();
  });
});
