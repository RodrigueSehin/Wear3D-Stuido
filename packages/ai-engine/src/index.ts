/**
 * @wear3d/ai-engine — couche d'abstraction multi-fournisseurs (CDC §2.5, §4.1).
 * Phase 0 : coûts en crédits et interface fournisseur. Adaptateurs réels en phase 7.
 */

export type AiTask = "concept" | "pattern" | "palette" | "structured";

/** Coût en crédits par unité (CDC §8). */
export const CREDIT_COST: Record<AiTask, number> = {
  concept: 1,
  pattern: 2,
  palette: 0.5,
  structured: 5,
};

/** Coût d'un lot, arrondi au supérieur. */
export function creditCost(task: AiTask, quantity: number): number {
  return Math.ceil(CREDIT_COST[task] * quantity);
}

export interface ImageProvider {
  readonly id: string;
  generate(input: { prompt: string; count: number; referenceUrl?: string }): Promise<string[]>;
}
