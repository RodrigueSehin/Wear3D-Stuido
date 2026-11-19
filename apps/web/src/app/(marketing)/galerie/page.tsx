import { Button, cn } from "@wear3d/ui";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JerseyThumb } from "@/components/studio/jersey-thumb";
import { PageHero } from "@/components/marketing/page-hero";
import { MOCKUP_CATEGORIES, MOCKUPS, type MockupCategory } from "@/lib/studio/mockups";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Des designs prêts à l'emploi : choisissez une maquette et personnalisez-la dans le studio 3D.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const current = MOCKUP_CATEGORIES.find((c) => c.id === categorie)?.id ?? "all";
  const items =
    current === "all"
      ? MOCKUPS
      : MOCKUPS.filter((m) => m.categories.includes(current as MockupCategory));

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
        badge="Galerie"
        title="Des maquettes prêtes à"
        highlight="personnaliser"
        subtitle="Partez d'un design existant : changez les couleurs, ajoutez vos logos, vos noms et vos numéros."
        showJerseys={false}
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <nav aria-label="Catégories" className="flex flex-wrap gap-2">
          {MOCKUP_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={c.id === "all" ? "/galerie" : `/galerie?categorie=${c.id}`}
              className={chip(current === c.id)}
              aria-current={current === c.id || undefined}
            >
              {c.label}
            </Link>
          ))}
        </nav>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <li
              key={m.id}
              className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
            >
              <div className="bg-gradient-to-b from-[#dbe6fb] to-[#f4f7fe] p-4">
                <JerseyThumb
                  body={m.colors[0]}
                  sleeves={m.colors[m.sleeves === 3 ? 2 : 0]}
                  collar={m.colors[1]}
                  pattern={
                    m.pattern
                      ? {
                          assetId: m.pattern.assetId,
                          color: m.colors[1],
                          opacity: m.pattern.opacity,
                        }
                      : undefined
                  }
                  className="mx-auto h-40 w-full"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-sm font-semibold">{m.label}</span>
                <Button asChild size="sm" variant="soft">
                  <Link
                    href={`/studio/nouveau?maquette=${m.id}`}
                    aria-label={`Utiliser ${m.label}`}
                  >
                    Utiliser <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
