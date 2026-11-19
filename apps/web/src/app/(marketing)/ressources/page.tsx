import { GARMENTS } from "@wear3d/garment-engine";
import { Button, cn } from "@wear3d/ui";
import { ArrowRight, Download, LifeBuoy, Search, Sparkles, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { JerseyTile } from "@/components/marketing/sections";
import { JerseyThumb } from "@/components/studio/jersey-thumb";
import { previewOf } from "@/lib/catalog";
import { STUDIO_FONTS } from "@/lib/studio/fonts";
import { LOGOS, logoDataUrl } from "@/lib/studio/logos";
import { MOCKUPS } from "@/lib/studio/mockups";

export const metadata: Metadata = {
  title: "Ressources",
  description:
    "Logos, polices, modèles 3D et templates prêts à l'emploi pour personnaliser vos vêtements dans WEAR3D STUDIO.",
};

const TYPES = [
  { id: "all", label: "Tous" },
  { id: "logos", label: "Logos" },
  { id: "polices", label: "Polices" },
  { id: "modeles", label: "Modèles 3D" },
  { id: "templates", label: "Templates" },
] as const;
type TypeId = (typeof TYPES)[number]["id"];

interface Resource {
  id: string;
  type: Exclude<TypeId, "all">;
  badge: string;
  title: string;
  text: string;
  visual: React.ReactNode;
  action: { href: string; label: string; download?: string };
}

function buildResources(): Resource[] {
  const logos: Resource[] = LOGOS.map((l) => ({
    id: `logo-${l.code}`,
    type: "logos",
    badge: "SVG",
    title: `Logo ${l.label}`,
    text: "Logo vectoriel intégré, utilisable sur tout vêtement du catalogue.",
    visual: (
      <div className="grid h-36 place-items-center bg-gradient-to-b from-[#dbe6fb] to-[#f4f7fe]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUrl(l)} alt="" className="h-24 w-24" />
      </div>
    ),
    action: { href: logoDataUrl(l), label: "Télécharger", download: `${l.code}.svg` },
  }));
  const fonts: Resource[] = Object.entries(STUDIO_FONTS).map(([key, f]) => ({
    id: `font-${key}`,
    type: "polices",
    badge: "Police",
    title: `Police ${f.label}`,
    text: "Police disponible dans l'éditeur de textes et de numéros.",
    visual: (
      <div className="bg-brand-navy-900 grid h-36 place-items-center text-white">
        <span className={cn("text-5xl", f.className)}>Aa</span>
      </div>
    ),
    action: { href: "/studio/nouveau", label: "Utiliser" },
  }));
  const models: Resource[] = GARMENTS.map((g) => ({
    id: `model-${g.reference}`,
    type: "modeles",
    badge: "GLB",
    title: `${g.name} – Modèle 3D`,
    text: `${g.zones.length} zones personnalisables, tailles ${g.sizes[0]}–${g.sizes[g.sizes.length - 1]}.`,
    visual: <JerseyTile src={previewOf(g.family)} className="h-36" />,
    action: { href: g.glbUrl, label: "Télécharger", download: `${g.reference.toLowerCase()}.glb` },
  }));
  const templates: Resource[] = MOCKUPS.map((m) => ({
    id: `tpl-${m.id}`,
    type: "templates",
    badge: "Template",
    title: `Maquette ${m.label}`,
    text: "Design prêt à personnaliser : couleurs, motifs et finitions.",
    visual: (
      <div className="bg-gradient-to-b from-[#dbe6fb] to-[#f4f7fe] p-2">
        <JerseyThumb
          body={m.colors[0]}
          sleeves={m.colors[m.sleeves === 3 ? 2 : 0]}
          collar={m.colors[1]}
          className="mx-auto h-32 w-full"
        />
      </div>
    ),
    action: { href: `/studio/nouveau?maquette=${m.id}`, label: "Utiliser" },
  }));
  return [...models, ...logos, ...templates, ...fonts];
}

/** Adresse du support : à renseigner dans NEXT_PUBLIC_CONTACT_EMAIL (sinon renvoie vers la connexion). */
const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q = "", type } = await searchParams;
  const current: TypeId = TYPES.find((t) => t.id === type)?.id ?? "all";
  const query = q.trim().toLowerCase();
  const items = buildResources().filter(
    (r) =>
      (current === "all" || r.type === current) &&
      (!query || `${r.title} ${r.text}`.toLowerCase().includes(query)),
  );
  const href = (t: string) =>
    `/ressources?${new URLSearchParams({ ...(t !== "all" ? { type: t } : {}), ...(q ? { q } : {}) })}`;

  return (
    <>
      <PageHero
        badge="Bibliothèque créative"
        title="Ressources premium pour créer des"
        highlight="vêtements uniques"
        subtitle="Accédez à notre bibliothèque de logos, polices, modèles 3D et templates pour personnaliser vos vêtements en 3D."
      >
        <form
          action="/ressources"
          className="flex max-w-xl overflow-hidden rounded-lg bg-white shadow-lg"
        >
          {current !== "all" && <input type="hidden" name="type" value={current} />}
          <label className="flex flex-1 items-center gap-2 px-3 text-slate-700">
            <Search className="size-5 text-slate-400" aria-hidden />
            <span className="sr-only">Rechercher une ressource</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher une ressource… (logo, police, template)"
              className="w-full py-3 text-sm outline-none"
            />
          </label>
          <Button type="submit" className="rounded-none">
            Rechercher
          </Button>
        </form>
        <nav aria-label="Types de ressources" className="mt-4 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Link
              key={t.id}
              href={href(t.id)}
              aria-current={current === t.id || undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                current === t.id
                  ? "bg-action border-transparent text-white"
                  : "border-white/25 text-white/90 hover:bg-white/10",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-3xl font-extrabold">
          Nos <span className="text-action">ressources</span> à votre disposition
        </h2>
        <p className="text-muted-foreground mt-1">
          {items.length} ressource{items.length > 1 ? "s" : ""}
          {query ? ` pour « ${q} »` : ""}.
        </p>
        {items.length === 0 ? (
          <p className="text-muted-foreground mt-8">
            Aucune ressource ne correspond à votre recherche.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((r) => (
              <li
                key={r.id}
                className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
              >
                <div className="relative">
                  {r.visual}
                  <span className="bg-surface/90 absolute right-2 top-2 rounded-md px-2 py-0.5 text-xs font-bold">
                    {r.badge}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="font-bold">{r.title}</h3>
                  <p className="text-muted-foreground min-h-10 text-sm">{r.text}</p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <a href={r.action.href} download={r.action.download}>
                      {r.action.download && <Download aria-hidden />} {r.action.label}
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:px-6 lg:grid-cols-3">
        <div className="bg-brand-navy-900 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-extrabold">Créez encore plus avec l&apos;IA</h2>
          <p className="mt-2 text-sm text-white/80">
            Générez des designs uniques, des motifs et des concepts de vêtements en quelques
            secondes grâce à notre assistant IA.
          </p>
          <Button asChild variant="amber" className="mt-4">
            <Link href="/app/ia">
              <Sparkles aria-hidden /> Essayer le générateur IA <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="border-border bg-action-soft rounded-2xl border p-6">
          <h2 className="text-xl font-extrabold">Importez vos propres ressources</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Ajoutez vos logos et images (PNG, JPG, SVG, 10 Mo max) directement dans le studio : ils
            sont conservés dans votre compte.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/studio/nouveau">
              <Upload aria-hidden /> Ouvrir le studio
            </Link>
          </Button>
        </div>
        <div id="contact" className="bg-accent-amber-soft rounded-2xl p-6">
          <h2 className="text-xl font-extrabold">Vous avez une idée ?</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Notre équipe vous accompagne pour créer des ressources sur mesure et répond aux demandes
            Enterprise.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <a href={contact ? `mailto:${contact}` : "/connexion"}>
              <LifeBuoy aria-hidden /> Contacter le support
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
