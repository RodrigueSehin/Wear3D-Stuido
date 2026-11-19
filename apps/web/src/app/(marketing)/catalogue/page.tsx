import { Badge, Button, cn } from "@wear3d/ui";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { JerseyTile } from "@/components/marketing/sections";
import { FAMILIES, familyLabel, modelsOf, previewOf, slugOf, studioHref } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catalogue de vêtements",
  description:
    "T-shirts, maillots de football, hoodies : choisissez un modèle 3D et personnalisez-le dans le studio.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ famille?: string }>;
}) {
  const { famille } = await searchParams;
  const current = FAMILIES.find((f) => f.id === famille)?.id;
  const models = modelsOf(current);

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
      active
        ? "border-action bg-action text-white"
        : "border-border bg-surface hover:border-action",
    );

  return (
    <>
      <PageHero
        badge="Catalogue"
        title="Choisissez votre modèle, on s'occupe du"
        highlight="rendu 3D"
        subtitle="Des vêtements prêts à personnaliser : couleurs, matières, logos, textes, numéros et motifs, avec un patron de couture pour la fabrication."
        showJerseys={false}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <nav aria-label="Familles de vêtements" className="flex flex-wrap gap-2">
          <Link href="/catalogue" className={chip(!current)} aria-current={!current || undefined}>
            Tous
          </Link>
          {FAMILIES.map((f) => (
            <Link
              key={f.id}
              href={`/catalogue?famille=${f.id}`}
              className={chip(current === f.id)}
              aria-current={current === f.id || undefined}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {models.length === 0 ? (
          <div className="border-border bg-surface shadow-card mt-8 rounded-xl border p-8 text-center">
            <Badge variant="violet">Bientôt</Badge>
            <h2 className="mt-3 text-xl font-bold">
              {current ? familyLabel(current) : "Cette famille"} arrive prochainement
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Les modèles de cette famille sont en cours de préparation.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/catalogue">Voir tous les modèles</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((g) => (
              <li
                key={g.reference}
                className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
              >
                <Link href={`/catalogue/${g.family}/${slugOf(g)}`} aria-label={`Voir ${g.name}`}>
                  <JerseyTile src={previewOf(g.family)} className="h-56" />
                </Link>
                <div className="space-y-3 p-5">
                  <div>
                    <p className="text-muted-foreground text-xs">{familyLabel(g.family)}</p>
                    <h2 className="text-lg font-bold">{g.name}</h2>
                    <p className="text-muted-foreground text-sm">
                      {g.sizes[0]}–{g.sizes[g.sizes.length - 1]} · {g.zones.length} zones
                      personnalisables
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={studioHref(g)}>
                        Personnaliser <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/catalogue/${g.family}/${slugOf(g)}`}>Détails</Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
