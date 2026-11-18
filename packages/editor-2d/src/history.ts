/** Taille maximale de l'historique (CDC F-26). */
export const HISTORY_LIMIT = 100;

export interface Command {
  label: string;
  do(): void;
  undo(): void;
}

/** Historique de commandes réversibles. */
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

/**
 * Historique par instantanés d'un état immuable (le document de design).
 * Les modifications portant la même `coalesceKey` successives (glisser un calque,
 * déplacer un curseur de couleur) sont fusionnées en une seule entrée.
 */
export class SnapshotHistory<T> {
  private past: T[] = [];
  private future: T[] = [];
  private lastKey: string | undefined;

  constructor(private readonly limit = HISTORY_LIMIT) {}

  /** Enregistre `previous` avant de passer à un nouvel état. */
  record(previous: T, coalesceKey?: string): void {
    if (coalesceKey !== undefined && coalesceKey === this.lastKey) {
      this.future = [];
      return;
    }
    this.past.push(previous);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
    this.lastKey = coalesceKey;
  }

  /** Termine un regroupement : la prochaine modification crée une nouvelle entrée. */
  seal(): void {
    this.lastKey = undefined;
  }

  undo(current: T): T | undefined {
    const prev = this.past.pop();
    if (prev === undefined) return undefined;
    this.future.push(current);
    this.lastKey = undefined;
    return prev;
  }

  redo(current: T): T | undefined {
    const next = this.future.pop();
    if (next === undefined) return undefined;
    this.past.push(current);
    this.lastKey = undefined;
    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
    this.lastKey = undefined;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }
}
