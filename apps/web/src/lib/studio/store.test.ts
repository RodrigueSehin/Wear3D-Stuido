import { createEmptyDocument, createImageLayer, createTextLayer } from "@wear3d/design-schema";
import { TSHIRT_CLASSIC } from "@wear3d/garment-engine";
import { beforeEach, describe, expect, it } from "vitest";
import { patternZones, selectedLayerId, useStudio } from "./store";

function init() {
  const doc = createEmptyDocument(
    TSHIRT_CLASSIC.versionId,
    TSHIRT_CLASSIC.zones.map((z) => ({ code: z.code, ...z.defaults })),
  );
  useStudio.getState().init({ designId: "d1", name: "Test", definition: TSHIRT_CLASSIC, doc });
}

describe("store du studio", () => {
  beforeEach(init);

  it("change la couleur d'une zone et l'annule", () => {
    const s = useStudio.getState();
    s.setZoneColor("BODY_FRONT", "#1F5EFF");
    expect(useStudio.getState().doc?.zones.BODY_FRONT?.color).toBe("#1F5EFF");
    useStudio.getState().undo();
    expect(useStudio.getState().doc?.zones.BODY_FRONT?.color).toBe("#FFFFFF");
  });

  it("regroupe un glisser de couleur en une seule étape d'annulation", () => {
    const s = useStudio.getState();
    for (const c of ["#111111", "#222222", "#333333"]) s.setZoneColor("BODY_BACK", c);
    s.seal();
    useStudio.getState().undo();
    expect(useStudio.getState().doc?.zones.BODY_BACK?.color).toBe("#FFFFFF");
  });

  it("ajoute, déplace et supprime un calque", () => {
    const s = useStudio.getState();
    const layer = createTextLayer("BODY_FRONT", "WEAR3D");
    s.addLayer(layer);
    expect(selectedLayerId()).toBe(layer.id);

    s.updateLayer(layer.id, (l) => ({ ...l, transform: { ...l.transform, x: 0.2 } }), "drag");
    s.updateLayer(layer.id, (l) => ({ ...l, transform: { ...l.transform, x: 0.25 } }), "drag");
    expect(useStudio.getState().doc?.layers[0]?.transform.x).toBe(0.25);

    s.removeLayer(layer.id);
    expect(useStudio.getState().doc?.layers).toHaveLength(0);
    expect(useStudio.getState().selection).toBeNull();

    useStudio.getState().undo(); // annule la suppression
    useStudio.getState().undo(); // annule le glisser (une seule étape)
    expect(useStudio.getState().doc?.layers[0]?.transform.x).toBe(layer.transform.x);
  });

  it("duplique un calque avec un léger décalage", () => {
    const s = useStudio.getState();
    const layer = createTextLayer("BODY_FRONT");
    s.addLayer(layer);
    s.duplicateLayer(layer.id);
    const layers = useStudio.getState().doc!.layers;
    expect(layers).toHaveLength(2);
    expect(layers[1]!.id).not.toBe(layer.id);
    expect(layers[1]!.transform.x).toBeCloseTo(layer.transform.x + 0.03);
  });

  it("réordonne les calques par glisser-déposer", () => {
    const s = useStudio.getState();
    const a = createTextLayer("BODY_FRONT", "A");
    const b = createTextLayer("BODY_FRONT", "B");
    const c = createImageLayer("BODY_FRONT", "logo");
    s.addLayer(a);
    s.addLayer(b);
    s.addLayer(c);
    s.moveLayerTo(c.id, 0);
    expect(useStudio.getState().doc!.layers.map((l) => l.id)).toEqual([c.id, a.id, b.id]);
  });

  it("pose et retire un motif sur plusieurs zones", () => {
    const s = useStudio.getState();
    const pattern = {
      assetId: "pattern:band-diagonal",
      mode: "placed" as const,
      color: "#FFFFFF",
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      opacity: 0.8,
    };
    s.setZonesPattern(["BODY_FRONT", "BODY_BACK"], pattern);
    expect(patternZones(useStudio.getState().doc)).toEqual(["BODY_FRONT", "BODY_BACK"]);
    s.setZonesPattern(["BODY_FRONT", "BODY_BACK"], undefined);
    expect(patternZones(useStudio.getState().doc)).toEqual([]);
    useStudio.getState().undo();
    expect(patternZones(useStudio.getState().doc)).toHaveLength(2);
  });
});
