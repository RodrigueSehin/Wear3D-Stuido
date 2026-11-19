import { Button } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Briefcase,
  Download,
  Gem,
  Layers,
  PlayCircle,
  Shirt,
  Sparkles,
  Star,
  Trophy,
  Users,
  Users2,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { CheckList, CtaBanner, JerseyTile, SectionTitle } from "@/components/marketing/sections";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Clubs sportifs, entreprises, créateurs et marques, associations : des outils adaptés à chaque profil pour concevoir et visualiser vos vêtements en 3D.",
};

const PROFILES = [
  {
    id: "clubs",
    icon: Trophy,
    title: "Clubs sportifs",
    text: "Créez vos maillots, tenues d'entraînement et équipements aux couleurs de votre club.",
    points: [
      "Maillots personnalisés",
      "Numéros et noms",
      "Collections par saison",
      "Partage et validation d'équipe",
    ],
    img: "/hero/jersey-football.png",
  },
  {
    id: "entreprises",
    icon: Briefcase,
    title: "Entreprises",
    text: "Concevez des uniformes et vêtements professionnels de qualité pour vos équipes.",
    points: [
      "Uniformes professionnels",
      "Identité visuelle de marque",
      "Gestion des équipes",
      "Validation et export HD",
    ],
    img: "/hero/jersey-polo.png",
  },
  {
    id: "createurs",
    icon: Gem,
    title: "Créateurs & marques",
    text: "Donnez vie à vos collections, testez vos idées et présentez des designs réalistes.",
    points: [
      "Liberté de création",
      "Génération de designs par IA",
      "Rendus haute qualité",
      "Export pour production",
    ],
    img: "/hero/jersey-hoodie.png",
  },
  {
    id: "associations",
    icon: Users2,
    title: "Associations",
    text: "Personnalisez vos vêtements pour vos événements, campagnes et actions communautaires.",
    points: [
      "Tenues personnalisées",
      "Logos et messages",
      "Commandes groupées",
      "Gestion multi-membres",
    ],
    img: "/hero/jersey-polo.png",
  },
] as const;

const CASES = [
  {
    icon: Trophy,
    title: "Maillot de club",
    by: "Club Athletico",
    img: "/hero/jersey-football.png",
  },
  { icon: Briefcase, title: "Uniforme d'entreprise", by: "MetroLog", img: "/hero/jersey-polo.png" },
  { icon: Gem, title: "Collection streetwear", by: "Kairo Brand", img: "/hero/jersey-hoodie.png" },
  {
    icon: Users2,
    title: "Tenue d'association",
    by: "Solidarité Plus",
    img: "/hero/jersey-polo.png",
  },
] as const;

const TESTIMONIALS = [
  {
    name: "Club Étoile FC",
    role: "Club sportif",
    text: "Un outil simple et puissant. Nous avons créé notre nouvelle collection de maillots en un temps record.",
  },
  {
    name: "Textile Pro",
    role: "Entreprise",
    text: "Parfait pour nos uniformes d'entreprise. Le rendu 3D est très réaliste et l'équipe adore la facilité d'utilisation.",
  },
  {
    name: "Kairo Brand",
    role: "Marque de vêtements",
    text: "La génération IA nous inspire vraiment. C'est devenu un outil incontournable pour nos collections.",
  },
] as const;

export default function Page() {
  return (
    <>
      <PageHero
        badge="Solutions"
        title="Des solutions sur mesure pour tous vos"
        highlight="projets textiles"
        subtitle="Que vous soyez un club sportif, une entreprise, un créateur ou une association, WEAR3D STUDIO vous donne les outils pour concevoir, personnaliser et visualiser vos vêtements en 3D."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/inscription">
              Commencer gratuitement <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline-dark">
            <Link href="/produit">
              <PlayCircle aria-hidden /> Découvrir le produit
            </Link>
          </Button>
        </div>
        <ul className="mt-6 flex flex-wrap gap-8 text-sm">
          {[
            [Users, "+10 000", "Utilisateurs"],
            [Shirt, "+50", "Modèles de vêtements"],
            [Layers, "Flexibles", "Pour tous les secteurs"],
          ].map(([Icon, v, l]) => {
            const I = Icon as typeof Box;
            return (
              <li key={String(l)} className="flex items-center gap-2">
                <I className="size-7" strokeWidth={1.25} aria-hidden />
                <span>
                  <strong className="block">{String(v)}</strong>
                  <span className="text-white/70">{String(l)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionTitle
          badge="Pour qui ?"
          subtitle="Des outils adaptés aux besoins de chaque utilisateur, du particulier aux grandes organisations."
        >
          Nos solutions par profil
        </SectionTitle>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROFILES.map((p) => (
            <li
              key={p.id}
              id={p.id}
              className="border-border bg-surface shadow-card flex flex-col overflow-hidden rounded-xl border"
            >
              <JerseyTile src={p.img} className="h-44" />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <p.icon className="text-action size-6" aria-hidden /> {p.title}
                </h3>
                <p className="text-muted-foreground text-sm">{p.text}</p>
                <div className="flex-1">
                  <CheckList items={p.points} />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/inscription?profil=${p.id}`}>
                    Découvrir la solution <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="bg-brand-navy-800 grid items-center gap-6 rounded-xl p-6 text-white lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <h2 className="text-2xl font-extrabold leading-tight">
            Une solution puissante, <span className="text-brand-sky">flexible et évolutive</span>
          </h2>
          {[
            [Box, "Éditeur 3D intuitif", "et complet"],
            [Sparkles, "Génération IA", "de designs uniques"],
            [Layers, "Collaboration", "en équipe"],
            [Download, "Export multi-formats", "(PNG, JPG, PDF, GLB)"],
          ].map(([Icon, t, s]) => {
            const I = Icon as typeof Box;
            return (
              <div key={String(t)} className="flex flex-col items-center gap-1 text-center text-sm">
                <I className="size-7" strokeWidth={1.4} aria-hidden />
                <strong>{String(t)}</strong>
                <span className="text-white/70">{String(s)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <SectionTitle
          badge="Cas d'usage"
          subtitle="Découvrez comment nos utilisateurs créent des vêtements uniques avec WEAR3D STUDIO."
        >
          Des projets concrets, des résultats professionnels
        </SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CASES.map((c) => (
            <li
              key={c.title}
              className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
            >
              <JerseyTile src={c.img} className="h-36" />
              <div className="flex items-center gap-3 p-4">
                <c.icon className="text-action size-6 shrink-0" aria-hidden />
                <div>
                  <h3 className="text-sm font-bold">{c.title}</h3>
                  <p className="text-muted-foreground text-xs">{c.by}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="bg-action-soft grid gap-6 rounded-2xl p-6 lg:grid-cols-[0.8fr_3fr]">
          <div>
            <span className="bg-surface text-action inline-block rounded-full px-3 py-1 text-xs font-semibold">
              Ils nous font confiance
            </span>
            <h2 className="mt-3 text-2xl font-extrabold">Ce qu&apos;ils disent de WEAR3D STUDIO</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Des créateurs, clubs et entreprises qui transforment leurs idées en vêtements réels.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li
                key={t.name}
                className="border-border bg-surface shadow-card rounded-xl border p-4"
              >
                <p className="font-bold">{t.name}</p>
                <p className="text-muted-foreground mb-2 text-xs">{t.role}</p>
                <p className="text-sm">« {t.text} »</p>
                <p
                  className="mt-3 flex gap-0.5 text-amber-400"
                  role="img"
                  aria-label="5 étoiles sur 5"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="size-4 fill-current" aria-hidden />
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBanner
        title="Prêt à lancer votre projet textile ?"
        text="Rejoignez des milliers de clubs, d'entreprises et de créateurs qui conçoivent, personnalisent et visualisent leurs vêtements en 3D."
        secondary={{ href: "/produit", label: "Découvrir le produit" }}
      />
    </>
  );
}
