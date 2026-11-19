"use client";

import {
  annualPriceXof,
  MONTHLY_PRICE_XOF,
  PLAN_CARDS,
  type PlanCard,
  type PlanId,
} from "@wear3d/billing";
import { Badge, Button, cn } from "@wear3d/ui";
import { Building2, Check, Crown, Send, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ICONS: Record<PlanId, LucideIcon> = {
  free: Send,
  creator: Zap,
  business: Crown,
  enterprise: Building2,
};

const nf = new Intl.NumberFormat("fr-FR");

function Price({ plan, annual }: { plan: PlanId; annual: boolean }) {
  const monthly = MONTHLY_PRICE_XOF[plan];
  if (monthly === null) return <p className="text-3xl font-extrabold">Sur devis</p>;
  // Annuel : prix par mois équivalent, facturé en une fois.
  const shown =
    annual && monthly > 0 ? Math.round((annualPriceXof(plan) ?? 0) / 12 / 100) * 100 : monthly;
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-4xl font-extrabold">{nf.format(shown)}</span>
      <span className="text-sm font-medium opacity-80">FCFA / mois</span>
    </p>
  );
}

function Card({ plan, annual }: { plan: PlanCard; annual: boolean }) {
  const Icon = ICONS[plan.id];
  const dark = plan.highlighted;
  const href = plan.id === "enterprise" ? "/ressources#contact" : `/inscription?offre=${plan.id}`;
  return (
    <li
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        dark
          ? "from-action to-brand-navy-800 border-transparent bg-gradient-to-b text-white shadow-xl"
          : "border-border bg-surface shadow-card",
      )}
    >
      {dark && (
        <Badge variant="amber" className="absolute -top-3 right-4">
          ★ Recommandé
        </Badge>
      )}
      <div className="flex items-center gap-2.5">
        <Icon className={cn("size-7", dark ? "text-amber-300" : "text-action")} aria-hidden />
        <h3 className="text-xl font-extrabold">{plan.name}</h3>
      </div>
      <p className={cn("mt-2 min-h-10 text-sm", dark ? "text-white/80" : "text-muted-foreground")}>
        {plan.tagline}
      </p>
      <div className="mt-4">
        <Price plan={plan.id} annual={annual} />
        {annual && MONTHLY_PRICE_XOF[plan.id] ? (
          <p className="mt-1 text-xs opacity-75">
            Facturé {nf.format(annualPriceXof(plan.id) ?? 0)} FCFA par an
          </p>
        ) : null}
      </div>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check
              className={cn("mt-0.5 size-4 shrink-0", dark ? "text-white" : "text-action")}
              aria-hidden
            />
            {f}
          </li>
        ))}
      </ul>
      <Button asChild variant={dark ? "white" : "outline"} className="mt-6 w-full">
        <Link href={href}>{plan.cta}</Link>
      </Button>
    </li>
  );
}

/** Cartes d'offres avec bascule Mensuelle / Annuelle −20 %. */
export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const tab = (active: boolean) =>
    cn(
      "rounded-full px-4 py-1.5 text-sm font-semibold transition",
      active ? "bg-action text-white" : "text-foreground hover:bg-surface-muted",
    );
  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-semibold">Choisissez votre facturation :</span>
        <div
          role="group"
          aria-label="Facturation"
          className="border-border bg-surface flex gap-1 rounded-full border p-1"
        >
          <button
            type="button"
            className={tab(!annual)}
            aria-pressed={!annual}
            onClick={() => setAnnual(false)}
          >
            Mensuelle
          </button>
          <button
            type="button"
            className={tab(annual)}
            aria-pressed={annual}
            onClick={() => setAnnual(true)}
          >
            Annuelle{" "}
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 text-xs",
                annual ? "bg-white/25" : "bg-action-soft text-action",
              )}
            >
              −20 %
            </span>
          </button>
        </div>
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_CARDS.map((p) => (
          <Card key={p.id} plan={p} annual={annual} />
        ))}
      </ul>
    </div>
  );
}
