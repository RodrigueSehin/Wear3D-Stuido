/**
 * @wear3d/editor-2d — canvas par zone, calques, commandes undo/redo (CDC §4.1).
 * Phase 0 : pile d'historique générique. La composition Konva arrive en phase 1.
 */

/** Taille maximale de l'historique (CDC F-26). */
export const HISTORY_LIMIT = 100;

export interface Command {
  label: string;
  do(): void;
  undo(): void;
}

export class CommandHistory {
  private past: Command[] = [];
  private future: Command[] = [];

  constructor(private readonly limit = HISTORY_LIMIT) {}

  execute(cmd: Command): void {
    cmd.do();
    this.past.push(cmd);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(): boolean {
    const cmd = this.past.pop();
    if (!cmd) return false;
    cmd.undo();
    this.future.push(cmd);
    return true;
  }

  redo(): boolean {
    const cmd = this.future.pop();
    if (!cmd) return false;
    cmd.do();
    this.past.push(cmd);
    return true;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }
}
