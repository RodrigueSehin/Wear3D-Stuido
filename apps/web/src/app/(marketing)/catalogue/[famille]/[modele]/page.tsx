import { FABRIC_NAMES, GARMENTS } from "@wear3d/garment-engine";
import { Button } from "@wear3d/ui";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JerseyTile } from "@/components/marketing/sections";
import { familyLabel, modelBySlug, previewOf, slugOf, studioHref } from "@/lib/catalog";

type Params = { famille: string; modele: string };

export function generateStaticParams(): Params[] {
  return GARMENTS.map((g) => ({ famille: g.family, modele: slugOf(g) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { famille, modele } = await params;
  const g = modelBySlug(famille, modele);
  return g
    ? { title: g.name, description: `${g.name} : modèle 3D personnalisable dans WEAR3D STUDIO.` }
    : { title: "Modèle introuvable" };
}

const CAPABILITY: Record<string, string> = {
  color: "couleur",
  material: "tissu",
  pattern: "motif",
  text: "texte",
  image: "logo / image",
};

export default async function Page({ params }: { params: Promise<Params> }) {
  const { famille, modele } = await params;
  const g = modelBySlug(famille, modele);
  if (!g) notFound();
  const cuffs = g.trims?.cuffs;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href={`/catalogue?famille=${g.family}`}
        className="text-action inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> {familyLabel(g.family)}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <JerseyTile src={previewOf(g.family)} className="h-[420px] rounded-2xl" />

        <div>
          <p className="text-muted-foreground text-sm">Réf. {g.reference}</p>
          <h1 className="mt-1 text-4xl font-extrabold">{g.name}</h1>

          <dl className="mt-6 space-y-5 text-sm">
            <div>
              <dt className="mb-1 font-semibold">Tailles</dt>
              <dd className="flex flex-wrap gap-2">
                {g.sizes.map((s) => (
                  <span key={s} className="border-border rounded-md border px-3 py-1 font-medium">
                    {s}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-semibold">Tissus disponibles</dt>
              <dd className="flex flex-wrap gap-2">
                {g.materials.map((m) => (
                  <span
                    key={m}
                    className="bg-action-soft text-action rounded-full px-3 py-1 font-medium"
                  >
                    {FABRIC_NAMES[m]?.name ?? m}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-semibold">Zones personnalisables</dt>
              <dd>
                <ul className="space-y-1.5">
                  {g.zones.map((z) => (
                    <li key={z.code} className="flex items-start gap-2">
                      <Check className="text-action mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>
                        <strong>{z.label}</strong>
                        <span className="text-muted-foreground">
                          {" "}
                          — {z.allows.map((a) => CAPABILITY[a] ?? a).join(", ")}
                          {z.printAreaMm
                            ? ` · zone d'impression ${z.printAreaMm.w} × ${z.printAreaMm.h} mm`
                            : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            {cuffs && (
              <div>
                <dt className="mb-1 font-semibold">Finitions</dt>
                <dd>Bords de manche réglables (couleur, hauteur, rayures).</dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={studioHref(g)}>
                Personnaliser dans le studio <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/tarifs">Voir les formules</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
