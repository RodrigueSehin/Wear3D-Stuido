/**
 * @wear3d/billing — plans, quotas, adaptateurs de paiement (CDC §8).
 * Les valeurs de référence sont celles des maquettes (PLAN.md §3) ;
 * en production, la source de vérité est la table `plan_features`.
 */

export type PlanId = "free" | "creator" | "business" | "enterprise";

export const PLAN_ORDER: readonly PlanId[] = ["free", "creator", "business", "enterprise"];

/** Prix mensuels indicatifs en FCFA (null = sur devis). */
export const MONTHLY_PRICE_XOF: Record<PlanId, number | null> = {
  free: 0,
  creator: 9_900,
  business: 29_900,
  enterprise: null,
};

/** Remise annuelle affichée (maquette Tarifs). */
export const ANNUAL_DISCOUNT = 0.2;

export function annualPriceXof(plan: PlanId): number | null {
  const monthly = MONTHLY_PRICE_XOF[plan];
  if (monthly === null) return null;
  return Math.round((monthly * 12 * (1 - ANNUAL_DISCOUNT)) / 100) * 100;
}

/** Vrai si `plan` donne accès à une ressource réservée à `required` (CDC F-04). */
export function planAllows(plan: PlanId, required: PlanId): boolean {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(required);
}

export function formatXof(amount: number, locale = "fr-FR"): string {
  return `${new Intl.NumberFormat(locale).format(amount)} FCFA`;
}
