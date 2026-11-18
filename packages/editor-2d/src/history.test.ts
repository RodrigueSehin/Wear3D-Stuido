import { describe, expect, it } from "vitest";
import { CommandHistory, SnapshotHistory } from "./history";

function counterCommand(state: { n: number }) {
  return { label: "inc", do: () => void state.n++, undo: () => void state.n-- };
}

describe("CommandHistory", () => {
  it("annule et rétablit", () => {
    const state = { n: 0 };
    const h = new CommandHistory();
    h.execute(counterCommand(state));
    h.execute(counterCommand(state));
    h.undo();
    expect(state.n).toBe(1);
    h.redo();
    expect(state.n).toBe(2);
  });

  it("respecte la limite", () => {
    const state = { n: 0 };
    const h = new CommandHistory(3);
    for (let i = 0; i < 5; i++) h.execute(counterCommand(state));
    let undone = 0;
    while (h.undo()) undone++;
    expect(undone).toBe(3);
  });
});

describe("SnapshotHistory", () => {
  it("annule et rétablit des états", () => {
    const h = new SnapshotHistory<number>();
    let state = 0;
    const set = (v: number, key?: string) => {
      h.record(state, key);
      state = v;
    };
    set(1);
    set(2);
    state = h.undo(state)!;
    expect(state).toBe(1);
    state = h.redo(state)!;
    expect(state).toBe(2);
  });

  it("fusionne les modifications d'un même geste", () => {
    const h = new SnapshotHistory<number>();
    let state = 0;
    for (const v of [1, 2, 3, 4]) {
      h.record(state, "drag:el_1");
      state = v;
    }
    h.seal();
    state = h.undo(state)!;
    expect(state).toBe(0);
    expect(h.canUndo).toBe(false);
  });

  it("une nouvelle action vide le futur", () => {
    const h = new SnapshotHistory<number>();
    h.record(0);
    expect(h.undo(1)).toBe(0);
    h.record(0);
    expect(h.canRedo).toBe(false);
  });

  it("limite à 100 entrées par défaut", () => {
    const h = new SnapshotHistory<number>();
    for (let i = 0; i < 150; i++) h.record(i);
    let state = 150;
    let count = 0;
    for (let s = h.undo(state); s !== undefined; s = h.undo(state)) {
      state = s;
      count++;
    }
    expect(count).toBe(100);
  });
});
