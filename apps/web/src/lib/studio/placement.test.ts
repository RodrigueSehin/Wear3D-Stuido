import { createEmptyDocument, createNumberLayer } from "@wear3d/design-schema";
import { TSHIRT_CLASSIC } from "@wear3d/garment-engine";
import { beforeEach, describe, expect, it } from "vitest";
import { applyDrop, placementZone, startPanelDrag, type DragPayload } from "./placement";
import { useStudio } from "./store";

function init() {
  const doc = createEmptyDocument(
    TSHIRT_CLASSIC.versionId,
    TSHIRT_CLASSIC.zones.map((z) => ({ code: z.code, ...z.defaults })),
  );
  useStudio.getState().init({ designId: "d1", name: "Test", definition: TSHIRT_CLASSIC, doc });
  useStudio.setState({ viewMode: "3d", activeView: "front", flatMode: "both" });
}

/** Simule le début d'un glisser depuis une vignette de panneau. */
function drag(p: DragPayload) {
  const e = { dataTransfer: { effectAllowed: "", setData: () => undefined } };
  startPanelDrag(e as unknown as React.DragEvent, p);
}

const uvOf = (zone: string, fx: number, fy: number) => {
  const r = TSHIRT_CLASSIC.zones.find((z) => z.code === zone)!.uvRect;
  return { zone, u: r.x + fx * r.w, v: r.y + fy * r.h };
};

describe("placement des nouveaux éléments", () => {
  beforeEach(init);

  it("dépose sur la face quand on regarde la face, même après un calque au dos", () => {
    // Bug signalé : un calque ajouté au dos rendait le dos « zone sélectionnée ».
    useStudio.getState().addLayer(createNumberLayer("BODY_BACK", "10"));
    expect(useStudio.getState().selectedZone).toBe("BODY_BACK");
    expect(placementZone("image")).toBe("BODY_FRONT");
    expect(placementZone("text")).toBe("BODY_FRONT");
  });

  it("dépose au dos quand la vue 3D est tournée vers le dos", () => {
    useStudio.setState({ activeView: "back" });
    expect(placementZone("image")).toBe("BODY_BACK");
  });

  it("respecte une manche choisie explicitement", () => {
    useStudio.getState().selectZone("SLEEVE_LEFT");
    useStudio.getState().select({ kind: "base" });
    expect(placementZone("image")).toBe("SLEEVE_LEFT");
  });

  it("suit la vue 2D affichée", () => {
    useStudio.setState({ viewMode: "2d", flatMode: "back" });
    expect(placementZone("image")).toBe("BODY_BACK");
    useStudio.setState({ flatMode: "right" });
    expect(placementZone("image")).toBe("SLEEVE_RIGHT");
    useStudio.setState({ flatMode: "both" });
    expect(placementZone("image")).toBe("BODY_FRONT");
  });
});

describe("glisser-déposer depuis les panneaux", () => {
  beforeEach(init);

  it("place un logo au point déposé, dans la zone visée", () => {
    drag({ kind: "image", assetId: "logo:star", name: "Étoile" });
    expect(applyDrop(uvOf("BODY_BACK", 0.3, 0.6))).toBe(true);
    const layer = useStudio.getState().doc!.layers.at(-1)!;
    expect(layer.zone).toBe("BODY_BACK");
    expect(layer.transform.x).toBeCloseTo(0.3);
    expect(layer.transform.y).toBeCloseTo(0.6);
    expect(layer.name).toBe("Étoile");
  });

  it("teinte un élément monochrome pour qu'il reste lisible sur le tissu", () => {
    drag({ kind: "image", assetId: "element:star", name: "Étoile", tint: "auto" });
    applyDrop(uvOf("BODY_FRONT", 0.5, 0.5));
    const layer = useStudio.getState().doc!.layers.at(-1)!;
    expect(layer.type === "image" && layer.tint).toBe("#0B1530");
  });

  it("hors du vêtement : zone d'accueil par défaut (côté visible)", () => {
    drag({ kind: "image", assetId: "logo:star", name: "Étoile" });
    applyDrop(null);
    expect(useStudio.getState().doc!.layers.at(-1)!.zone).toBe("BODY_FRONT");
  });

  it("une couleur ne recolore que la zone visée", () => {
    drag({ kind: "color", color: "#E11D2E" });
    applyDrop(uvOf("SLEEVE_LEFT", 0.5, 0.5));
    const zones = useStudio.getState().doc!.zones;
    expect(zones.SLEEVE_LEFT?.color).toBe("#E11D2E");
    expect(zones.BODY_FRONT?.color).not.toBe("#E11D2E");
  });

  it("une texture déposée ne s'applique qu'à la zone visée", () => {
    drag({ kind: "texture", textureId: "fabric:carbon" });
    applyDrop(uvOf("BODY_FRONT", 0.5, 0.5));
    const zones = useStudio.getState().doc!.zones;
    expect(zones.BODY_FRONT?.material).toBe("carbon");
    expect(zones.BODY_BACK?.material).not.toBe("carbon");
  });

  it("un dépôt s'annule en une étape", () => {
    drag({ kind: "image", assetId: "logo:star", name: "Étoile" });
    applyDrop(uvOf("BODY_FRONT", 0.5, 0.5));
    expect(useStudio.getState().doc!.layers).toHaveLength(1);
    useStudio.getState().undo();
    expect(useStudio.getState().doc!.layers).toHaveLength(0);
  });
});
