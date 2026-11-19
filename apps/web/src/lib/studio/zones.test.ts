import { createEmptyDocument, createImageLayer, createTextLayer } from "@wear3d/design-schema";
import { HOODIE_CLASSIC, TSHIRT_CLASSIC } from "@wear3d/garment-engine";
import { beforeEach, describe, expect, it } from "vitest";
import { endDrag, moveLayerToZone, surfaceDown, surfaceMove } from "./interaction";
import { MOCKUPS, newMockup, withMockup } from "./mockups";
import { useStudio } from "./store";
import { cuffState, patchCuffs } from "./trims";

function init() {
  const doc = createEmptyDocument(
    TSHIRT_CLASSIC.versionId,
    TSHIRT_CLASSIC.zones.map((z) => ({ code: z.code, ...z.defaults })),
  );
  useStudio.getState().init({ designId: "d1", name: "Test", definition: TSHIRT_CLASSIC, doc });
}

const uvOf = (zone: string, fx: number, fy: number) => {
  const r = TSHIRT_CLASSIC.zones.find((z) => z.code === zone)!.uvRect;
  return { zone, u: r.x + fx * r.w, v: r.y + fy * r.h };
};
const layer0 = () => useStudio.getState().doc!.layers[0]!;

describe("déplacer un élément d'une zone à l'autre", () => {
  beforeEach(init);

  it("glisser sur une autre pièce (2D / patron) transfère le calque, en une étape", () => {
    const logo = createImageLayer("BODY_FRONT", "logo:star");
    logo.transform = { ...logo.transform, x: 0.5, y: 0.5 };
    useStudio.getState().addLayer(logo);
    useStudio.getState().seal();

    expect(surfaceDown(uvOf("BODY_FRONT", 0.5, 0.5))).toBe(true);
    const over = uvOf("BODY_BACK", 0.3, 0.4);
    surfaceMove([uvOf("BODY_FRONT", 0.6, 0.5), over], over);
    endDrag();

    expect(layer0().zone).toBe("BODY_BACK");
    expect(layer0().transform.x).toBeCloseTo(0.3);
    expect(layer0().transform.y).toBeCloseTo(0.4);
    useStudio.getState().undo();
    expect(layer0().zone).toBe("BODY_FRONT");
  });

  it("le col accepte désormais textes et logos", () => {
    const text = createTextLayer("BODY_FRONT", "NUQUE");
    useStudio.getState().addLayer(text);
    moveLayerToZone(text.id, "COLLAR");
    expect(layer0().zone).toBe("COLLAR");
  });

  it("conserve la taille réelle sur le vêtement (devant → manche)", () => {
    const logo = createImageLayer("BODY_FRONT", "logo:star");
    useStudio.getState().addLayer(logo);
    const before = logo.transform.w * TSHIRT_CLASSIC.zones[0]!.uvRect.w;
    moveLayerToZone(logo.id, "SLEEVE_LEFT");
    const sleeve = TSHIRT_CLASSIC.zones.find((z) => z.code === "SLEEVE_LEFT")!.uvRect;
    expect(layer0().transform.w * sleeve.w).toBeCloseTo(before);
  });
});

describe("bords de manche", () => {
  beforeEach(init);

  it("ne sont proposés que si le modèle en a", () => {
    expect(cuffState(useStudio.getState().doc, TSHIRT_CLASSIC)).not.toBeNull();
    const { trims: _t, ...withoutCuffs } = TSHIRT_CLASSIC;
    expect(cuffState(useStudio.getState().doc, withoutCuffs)).toBeNull();
  });

  it("se règlent et s'annulent", () => {
    patchCuffs({ enabled: true, color: "#E11D2E", stripes: 2 });
    expect(useStudio.getState().doc!.trims?.cuffs).toMatchObject({
      enabled: true,
      color: "#E11D2E",
      stripes: 2,
    });
    useStudio.getState().undo();
    expect(useStudio.getState().doc!.trims?.cuffs).toBeUndefined();
  });

  it("une maquette colore les bords avec sa couleur de finition", () => {
    const royal = MOCKUPS.find((m) => m.id === "royal")!;
    const doc = withMockup(useStudio.getState().doc!, TSHIRT_CLASSIC, newMockup(royal));
    expect(doc.trims?.cuffs).toMatchObject({ enabled: true, color: royal.colors[2] });
  });
});

describe("changer de vêtement", () => {
  beforeEach(init);

  it("garde les calques, met à jour la version du modèle, annulable", () => {
    useStudio.getState().addLayer(createTextLayer("BODY_BACK", "DOS"));
    useStudio.getState().changeModel(HOODIE_CLASSIC);
    const s = useStudio.getState();
    expect(s.definition?.reference).toBe("HD-CLASSIC");
    expect(s.doc!.model.versionId).toBe(HOODIE_CLASSIC.versionId);
    expect(s.doc!.layers).toHaveLength(1);
    s.undo();
    expect(useStudio.getState().doc!.model.versionId).toBe(TSHIRT_CLASSIC.versionId);
    expect(useStudio.getState().definition?.reference).toBe("TS-CLASSIC");
  });
});
