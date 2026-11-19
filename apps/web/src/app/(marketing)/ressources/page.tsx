import { GARMENTS } from "@wear3d/garment-engine";
import { Button, cn } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Download,
  LayoutGrid,
  LifeBuoy,
  Palette,
  Search,
  Shapes,
  Sparkles,
  Type,
  Upload,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBanner, JerseyTile } from "@/components/marketing/sections";
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

const TYPES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "Tous", icon: LayoutGrid },
  { id: "logos", label: "Logos", icon: Shapes },
  { id: "polices", label: "Polices", icon: Type },
  { id: "modeles", label: "Modèles 3D", icon: Box },
  { id: "templates", label: "Templates", icon: Palette },
];
type TypeId = "all" | "logos" | "polices" | "modeles" | "templates";

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
  searchParams: Promise<{ q?: string; type?: string; tri?: string; n?: string }>;
}) {
  const { q = "", type, tri, n } = await searchParams;
  const sortByName = tri === "nom";
  const limit = Math.min(Math.max(Number(n) || 12, 12), 200);
  const current = (TYPES.find((t) => t.id === type)?.id ?? "all") as TypeId;
  const query = q.trim().toLowerCase();
  const matches = buildResources().filter(
    (r) =>
      (current === "all" || r.type === current) &&
      (!query || `${r.title} ${r.text}`.toLowerCase().includes(query)),
  );
  if (sortByName) matches.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  const items = matches.slice(0, limit);
  const params = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = {
      type: current !== "all" ? current : undefined,
      q: q || undefined,
      tri: sortByName ? "nom" : undefined,
      ...over,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const str = p.toString();
    return `/ressources${str ? `?${str}` : ""}`;
  };
  const href = (t: string) => params({ type: t !== "all" ? t : undefined, n: undefined });

  return (
    <>
      <section className="bg-brand-navy-950 relative overflow-hidden rounded-b-[2.5rem] text-white">
        <Image
          src="/hero/background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_bottom]"
        />
        <div
          aria-hidden
          className="from-brand-navy-950 via-brand-navy-950/70 absolute inset-0 bg-gradient-to-r to-transparent"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-14 pt-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="bg-brand-navy-800/60 inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 text-xs font-semibold">
              <LayoutGrid className="size-3.5" aria-hidden /> Bibliothèque créative
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Ressources premium pour créer des{" "}
              <span className="text-brand-sky">vêtements uniques</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              Accédez à notre bibliothèque complète de logos, motifs, textures, polices et modèles
              3D pour personnaliser vos vêtements en 3D.
            </p>
            <form
              action="/ressources"
              className="mt-6 flex max-w-xl overflow-hidden rounded-lg bg-white shadow-lg"
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
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
                    current === t.id
                      ? "bg-action border-transparent text-white"
                      : "border-white/25 text-white/90 hover:bg-white/10",
                  )}
                >
                  <t.icon className="size-4" aria-hidden /> {t.label}
                </Link>
              ))}
            </nav>
          </div>

          <div aria-hidden className="relative mx-auto hidden h-80 w-full max-w-lg lg:block">
            <div className="ring-brand-sky/60 absolute inset-x-6 bottom-0 h-16 rounded-[50%] ring-2 [box-shadow:0_0_40px_rgba(76,141,255,.45)]" />
            <Image
              src="/vetements/hoodie-hd.webp"
              alt=""
              width={300}
              height={270}
              className="absolute bottom-3 right-4 h-60 w-auto drop-shadow-[0_18px_28px_rgb(0_10_50/0.55)]"
            />
            <Image
              src="/vetements/tshirt-hd.webp"
              alt=""
              width={300}
              height={270}
              className="absolute bottom-3 left-8 z-10 h-64 w-auto drop-shadow-[0_18px_28px_rgb(0_10_50/0.55)]"
            />
            <span className="absolute left-0 top-4 z-20 grid size-20 -rotate-6 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoDataUrl(LOGOS[0]!)} alt="" className="size-14" />
            </span>
            <span className="absolute right-2 top-2 z-20 grid size-16 rotate-6 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-extrabold backdrop-blur">
              Aa
            </span>
            <span className="absolute bottom-6 right-0 z-20 grid size-14 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
              <Palette className="size-7" aria-hidden />
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-extrabold">
              Nos <span className="text-action">ressources</span> à votre disposition
            </h2>
            <p className="text-muted-foreground mt-1">
              Une bibliothèque riche et variée pour donner vie à toutes vos idées créatives —{" "}
              {matches.length} ressource{matches.length > 1 ? "s" : ""}
              {query ? ` pour « ${q} »` : ""}.
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Trier par :</span>
            <Link
              href={params({ tri: undefined, n: undefined })}
              aria-current={!sortByName || undefined}
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                !sortByName ? "bg-action-soft text-action" : "hover:bg-surface-muted",
              )}
            >
              Sélection
            </Link>
            <Link
              href={params({ tri: "nom", n: undefined })}
              aria-current={sortByName || undefined}
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                sortByName ? "bg-action-soft text-action" : "hover:bg-surface-muted",
              )}
            >
              Nom (A-Z)
            </Link>
          </p>
        </div>
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
        {matches.length > items.length && (
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href={params({ n: String(limit + 12) })} scroll={false}>
                Afficher plus ({matches.length - items.length} restantes)
              </Link>
            </Button>
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-3">
        <div className="from-brand-navy-900 to-brand-navy-800 relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white">
          <span
            aria-hidden
            className="border-brand-sky/50 text-brand-sky absolute -right-4 top-6 grid size-24 rotate-6 place-items-center rounded-2xl border-2 text-4xl font-extrabold [box-shadow:0_0_30px_rgba(76,141,255,.35)]"
          >
            IA
          </span>
          <h2 className="max-w-[16rem] text-2xl font-extrabold">
            Créez encore plus avec l&apos;IA
          </h2>
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
            Ajoutez vos logos, images et motifs personnels pour une personnalisation 100 % à votre
            image.
          </p>
          <Link
            href="/studio/nouveau"
            className="border-action/50 text-action hover:bg-surface mt-4 flex flex-col items-center gap-1 rounded-xl border-2 border-dashed p-5 text-center text-sm font-semibold transition"
          >
            <Upload className="size-7" aria-hidden />
            Glisser-déposer vos fichiers dans le studio
            <span className="text-muted-foreground text-xs font-normal">
              Formats : PNG, JPG, SVG (max 10 Mo)
            </span>
          </Link>
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

      <CtaBanner
        title="Transformez vos idées en vêtements exceptionnels !"
        text="Avec WEAR3D STUDIO, donnez vie à vos projets créatifs en toute simplicité."
      />
    </>
  );
}
