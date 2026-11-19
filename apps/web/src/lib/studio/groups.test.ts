import { createEmptyDocument, createTextLayer } from "@wear3d/design-schema";
import { TSHIRT_CLASSIC } from "@wear3d/garment-engine";
import { beforeEach, describe, expect, it } from "vitest";
import {
  assignGroup,
  duplicateGroup,
  groupsOf,
  removeGroup,
  setGroupLocked,
  setGroupVisible,
  ungroup,
} from "./groups";
import { useStudio } from "./store";

const doc = () => useStudio.getState().doc!;

beforeEach(() => {
  const d = createEmptyDocument(
    TSHIRT_CLASSIC.versionId,
    TSHIRT_CLASSIC.zones.map((z) => ({ code: z.code, ...z.defaults })),
  );
  useStudio.getState().init({ designId: "g", name: "G", definition: TSHIRT_CLASSIC, doc: d });
  for (const id of ["a", "b", "c"]) {
    useStudio.getState().addLayer({ ...createTextLayer("BODY_FRONT", id.toUpperCase()), id });
  }
});

describe("groupes de calques", () => {
  it("regroupe des calques et répercute visibilité et verrou", () => {
    const g = assignGroup("a", "new")!;
    assignGroup("b", g);
    expect(groupsOf(doc())[0]!.layers.map((l) => l.id)).toEqual(["b", "a"]);
    setGroupVisible(g, false);
    setGroupLocked(g, true);
    expect(
      doc()
        .layers.filter((l) => l.group === g)
        .every((l) => !l.visible && l.locked),
    ).toBe(true);
    expect(doc().layers.find((l) => l.id === "c")!.visible).toBe(true);
  });

  it("dissout, supprime et retire les groupes vides", () => {
    const g = assignGroup("a", "new")!;
    assignGroup("b", g);
    ungroup(g);
    expect(doc().groups).toBeUndefined();
    expect(doc().layers).toHaveLength(3);
    const h = assignGroup("a", "new")!;
    removeGroup(h);
    expect(doc().layers.map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("sortir le dernier membre supprime le groupe ; duplique le groupe ; annulable", () => {
    const g = assignGroup("a", "new")!;
    duplicateGroup(g);
    expect(groupsOf(doc())).toHaveLength(2);
    expect(doc().layers).toHaveLength(4);
    useStudio.getState().undo();
    expect(doc().layers).toHaveLength(3);
    assignGroup("a", null);
    expect(doc().groups).toBeUndefined();
  });
});
