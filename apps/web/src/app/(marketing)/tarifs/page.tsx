import { COMPARISON, PLAN_CARDS, PLAN_ORDER } from "@wear3d/billing";
import { Button, cn } from "@wear3d/ui";
import { ArrowRight, Check, ChevronDown, ShieldCheck, X, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { Pricing } from "@/components/marketing/pricing";

export const metadata: Metadata = {
  title: "Tarifs & abonnements",
  description:
    "Free, Creator, Business, Enterprise : choisissez la formule qui correspond à vos besoins. Essai gratuit 14 jours, sans carte bancaire.",
};

const FAQ = [
  {
    q: "Puis-je essayer la plateforme gratuitement ?",
    a: "Oui. Le plan Free est sans limite de durée (3 projets), et l'essai Creator dure 14 jours sans carte bancaire.",
  },
  {
    q: "Puis-je changer de formule plus tard ?",
    a: "À tout moment. Passer à une formule supérieure est immédiat ; en cas de rétrogradation, vos créations sont conservées, seules les nouvelles créations au-delà des limites sont bloquées.",
  },
  {
    q: "Comment fonctionnent les crédits IA ?",
    a: "Chaque génération consomme des crédits (1 crédit par image de concept). Les crédits mensuels ne se reportent pas ; des packs ponctuels valables 12 mois sont disponibles.",
  },
  {
    q: "Quels formats d'export sont disponibles ?",
    a: "PNG et JPG sur toutes les formules, PDF (fiche produit) dès Creator, GLB et fiches techniques de fabrication dès Business.",
  },
  {
    q: "Proposez-vous un accompagnement pour les entreprises ?",
    a: "Oui, la formule Enterprise inclut un accompagnement dédié, des intégrations API et un support prioritaire avec SLA.",
  },
];

const Cell = ({ v }: { v: boolean | string }) =>
  v === true ? (
    <Check className="text-success mx-auto size-5" aria-label="Inclus" />
  ) : v === false ? (
    <X className="text-danger mx-auto size-5" aria-label="Non inclus" />
  ) : (
    <span>{v}</span>
  );

export default function Page() {
  return (
    <>
      <PageHero
        badge="Tarifs & Abonnements"
        title="Des formules flexibles pour donner vie à"
        highlight="vos idées"
        subtitle="Choisissez le plan qui correspond à vos besoins et concevez, personnalisez et exportez vos vêtements en 3D sans limite."
      >
        <ul className="flex flex-wrap gap-6 text-sm">
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-8" strokeWidth={1.25} aria-hidden />
            <span>
              <strong className="block">Essai gratuit 14 jours</strong>
              <span className="text-white/70">Sans carte bancaire</span>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <XCircle className="size-8" strokeWidth={1.25} aria-hidden />
            <span>
              <strong className="block">Résiliez à tout moment</strong>
              <span className="text-white/70">Sans engagement</span>
            </span>
          </li>
        </ul>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Pricing />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6" aria-labelledby="compare">
        <h2 id="compare" className="mb-6 text-center text-3xl font-extrabold">
          Comparer les <span className="text-action">fonctionnalités</span>
        </h2>
        <div className="border-border bg-surface shadow-card overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-surface-muted">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Fonctionnalités
                </th>
                {PLAN_ORDER.map((id) => (
                  <th
                    key={id}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-center font-semibold",
                      id === "business" && "bg-action text-white",
                    )}
                  >
                    {PLAN_CARDS.find((p) => p.id === id)?.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-border border-t">
                  <th scope="row" className="px-4 py-3 font-normal">
                    {row.label}
                  </th>
                  {PLAN_ORDER.map((id) => (
                    <td
                      key={id}
                      className={cn("px-4 py-3 text-center", id === "business" && "bg-action-soft")}
                    >
                      <Cell v={row.values[id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <div className="border-border bg-surface shadow-card rounded-2xl border p-6">
          <h2 className="mb-4 text-2xl font-extrabold">
            Questions <span className="text-action">fréquentes</span>
          </h2>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="border-border bg-surface-muted/50 group rounded-lg border px-4 py-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  {f.q}
                  <ChevronDown
                    className="size-4 shrink-0 transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="text-muted-foreground mt-2 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="bg-gradient-cta flex flex-col justify-center rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-extrabold">Prêt à commencer ?</h2>
          <p className="mt-3 max-w-md text-white/85">
            Lancez votre essai gratuit de 14 jours et concevez dès maintenant votre premier vêtement
            en 3D.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/inscription">
                Essayer gratuitement 14 jours <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/75">Sans carte bancaire · Sans engagement</p>
        </div>
      </section>
    </>
  );
}
