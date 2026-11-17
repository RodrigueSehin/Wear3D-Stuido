import { describe, expect, it } from "vitest";
import { CommandHistory } from "./index";

function counterCommand(state: { n: number }) {
  return { label: "inc", do: () => void state.n++, undo: () => void state.n-- };
}

describe("CommandHistory", () => {
  it("annule et rétablit", () => {
    const state = { n: 0 };
    const h = new CommandHistory();
    h.execute(counterCommand(state));
    h.execute(counterCommand(state));
    expect(state.n).toBe(2);
    h.undo();
    expect(state.n).toBe(1);
    h.redo();
    expect(state.n).toBe(2);
  });

  it("vide le futur après une nouvelle action", () => {
    const state = { n: 0 };
    const h = new CommandHistory();
    h.execute(counterCommand(state));
    h.undo();
    h.execute(counterCommand(state));
    expect(h.canRedo).toBe(false);
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
