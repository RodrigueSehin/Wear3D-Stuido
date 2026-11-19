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

/** Présentation des offres (maquette « Tarifs ») ; la source de vérité reste `plan_features`. */
export interface PlanCard {
  id: PlanId;
  name: string;
  tagline: string;
  highlighted?: boolean;
  cta: string;
  features: readonly string[];
}

export const PLAN_CARDS: readonly PlanCard[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Pour découvrir la plateforme",
    cta: "Commencer gratuitement",
    features: [
      "Jusqu'à 3 projets",
      "Modèles de base (T-shirt, maillot, polo)",
      "Éditeur 3D standard",
      "Export image (PNG, JPG)",
      "Stockage : 500 Mo",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "Idéal pour les créateurs et indépendants",
    cta: "Choisir Creator",
    features: [
      "Projets illimités",
      "Catalogue complet de vêtements",
      "Personnalisation avancée (logos, textes, motifs)",
      "Export HD (PNG, JPG, PDF)",
      "Génération IA : 50 crédits / mois",
      "Stockage : 10 Go",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "Pour les clubs, entreprises et équipes",
    highlighted: true,
    cta: "Choisir Business",
    features: [
      "Tout le plan Creator",
      "Gestion d'équipe (jusqu'à 10 membres)",
      "Bibliothèque et ressources partagées",
      "Validation et workflows de design",
      "Génération IA : 300 crédits / mois",
      "Export 3D (GLB) et fiches techniques",
      "Stockage : 100 Go",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Solution sur mesure pour grandes organisations",
    cta: "Nous contacter",
    features: [
      "Tout le plan Business",
      "Équipes et permissions illimitées",
      "Catalogue et modèles personnalisés",
      "Intégrations (API)",
      "Accompagnement dédié",
      "SLA et support prioritaire",
    ],
  },
];

/** `true` = inclus, `false` = non inclus, texte = valeur affichée. */
export type FeatureValue = boolean | string;

export const COMPARISON: readonly { label: string; values: Record<PlanId, FeatureValue> }[] = [
  {
    label: "Nombre de projets",
    values: { free: "3", creator: "Illimités", business: "Illimités", enterprise: "Illimités" },
  },
  {
    label: "Accès au catalogue complet",
    values: { free: false, creator: true, business: true, enterprise: true },
  },
  {
    label: "Génération IA (crédits / mois)",
    values: { free: false, creator: "50", business: "300", enterprise: "Sur mesure" },
  },
  {
    label: "Export haute qualité (PNG, JPG, PDF)",
    values: { free: true, creator: true, business: true, enterprise: true },
  },
  {
    label: "Export 3D (GLB)",
    values: { free: false, creator: false, business: true, enterprise: true },
  },
  {
    label: "Gestion d'équipe",
    values: { free: false, creator: false, business: "Jusqu'à 10", enterprise: "Illimitée" },
  },
  {
    label: "Stockage",
    values: { free: "500 Mo", creator: "10 Go", business: "100 Go", enterprise: "Sur mesure" },
  },
  {
    label: "Support prioritaire",
    values: { free: false, creator: false, business: true, enterprise: true },
  },
];

/** Limites par offre (valeurs des maquettes ; PLAN.md §3). `null` = sur mesure / illimité. */
export interface PlanQuota {
  projects: number | null;
  creditsPerMonth: number | null;
  storageBytes: number | null;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const PLAN_QUOTAS: Record<PlanId, PlanQuota> = {
  free: { projects: 3, creditsPerMonth: 0, storageBytes: 500 * MB },
  creator: { projects: null, creditsPerMonth: 50, storageBytes: 10 * GB },
  business: { projects: null, creditsPerMonth: 300, storageBytes: 100 * GB },
  enterprise: { projects: null, creditsPerMonth: null, storageBytes: null },
};

export const isPlanId = (v: unknown): v is PlanId =>
  typeof v === "string" && (PLAN_ORDER as readonly string[]).includes(v);

/** Pourcentage d'utilisation borné à 0-100 ; 0 si la limite est illimitée. */
export function usagePercent(used: number, limit: number | null): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function formatBytes(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(1).replace(".", ",")} Go`;
  if (bytes >= MB) return `${Math.round(bytes / MB)} Mo`;
  return `${Math.round(bytes / 1024)} Ko`;
}
