import { Badge, Button } from "@wear3d/ui";
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
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckList, SectionTitle } from "@/components/marketing/sections";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Clubs sportifs, entreprises, créateurs et marques, associations : des outils adaptés à chaque profil pour concevoir et visualiser vos vêtements en 3D.",
};

const PROFILES: {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  points: string[];
  img: string;
}[] = [
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
    img: "football",
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
    img: "polo",
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
    img: "hoodie-noir",
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
    img: "veste",
  },
];

const CASES: { icon: LucideIcon; title: string; by: string; img: string }[] = [
  { icon: Trophy, title: "Maillot de club", by: "Club Athletico", img: "football" },
  { icon: Briefcase, title: "Uniforme d'entreprise", by: "MetroLog", img: "polo" },
  { icon: Gem, title: "Collection streetwear", by: "Kairo Brand", img: "hoodie-noir" },
  { icon: Users2, title: "Tenue d'association", by: "Solidarité Plus", img: "uniforme" },
  { icon: Trophy, title: "Maillot de basketball", by: "Lions B.C.", img: "basketball" },
];

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

const HERO_STATS = [
  { icon: Users, value: "+10 000", label: "Utilisateurs" },
  { icon: Shirt, value: "+50", label: "Modèles de vêtements" },
  { icon: Layers, value: "Solutions flexibles", label: "pour tous les secteurs" },
] as const;

/** Portraits du hero : position, taille et étiquette flottante de chacun. */
const HERO_PEOPLE = [
  {
    src: "/vetements/portrait-3-hd.webp",
    alt: "Homme portant une veste de survêtement WEAR3D",
    className: "left-[38%] bottom-0 z-10 h-[88%]",
  },
  {
    src: "/vetements/portrait-1-hd.webp",
    alt: "Joueur de football en maillot bleu numéro 10",
    className: "left-0 bottom-0 z-20 h-[92%]",
  },
  {
    src: "/vetements/portrait-4-hd.webp",
    alt: "Femme portant une veste de sport bleu marine et jaune",
    className: "right-0 bottom-0 z-20 h-[90%]",
  },
  {
    src: "/vetements/portrait-2-hd.webp",
    alt: "Femme portant un hoodie blanc WEAR3D STUDIO",
    className: "left-[22%] bottom-0 z-30 h-[78%]",
  },
] as const;

const HERO_PILLS = [
  { icon: Trophy, label: "Clubs sportifs", className: "left-[10%] top-4" },
  { icon: Briefcase, label: "Entreprises", className: "right-[6%] top-2" },
  { icon: Gem, label: "Créateurs", className: "left-[28%] bottom-3" },
  { icon: Users2, label: "Associations", className: "right-[4%] bottom-8" },
] as const;

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Box, title: "Éditeur 3D intuitif", text: "et complet" },
  { icon: Sparkles, title: "Génération IA", text: "de designs uniques" },
  { icon: Layers, title: "Collaboration", text: "en équipe" },
  { icon: Download, title: "Export multi-formats", text: "(PNG, JPG, PDF, GLB)" },
];

export default function Page() {
  return (
    <div className="bg-brand-navy-950 text-white">
      <section className="relative overflow-hidden">
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
          className="from-brand-navy-950 via-brand-navy-950/75 absolute inset-0 bg-gradient-to-r to-transparent"
        />
        <div className="relative mx-auto grid max-w-7xl items-end gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="pb-14 lg:pb-16">
            <Badge variant="outline" className="bg-brand-navy-800/60 border-white/25 text-white">
              Solutions
            </Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Des solutions sur mesure pour tous vos{" "}
              <span className="text-brand-sky">projets textiles</span>
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              Que vous soyez un club sportif, une entreprise, un créateur ou une association, WEAR3D
              STUDIO vous donne les outils pour concevoir, personnaliser et visualiser vos vêtements
              en 3D.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/inscription">
                  Commencer gratuitement <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline-dark">
                <Link href="/produit">
                  <PlayCircle aria-hidden /> Demander une démo
                </Link>
              </Button>
            </div>
            <dl className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {HERO_STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon className="size-7 text-white/85" strokeWidth={1.25} aria-hidden />
                  <div>
                    <dt className="font-bold leading-tight">{value}</dt>
                    <dd className="text-xs text-white/70">{label}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto h-[300px] w-full max-w-xl sm:h-[420px] lg:h-[470px]">
            {HERO_PEOPLE.map((p) => (
              <Image
                key={p.src}
                src={p.src}
                alt={p.alt}
                width={420}
                height={560}
                sizes="(min-width: 1024px) 260px, 45vw"
                className={`absolute w-auto drop-shadow-[0_20px_30px_rgb(0_10_50/0.5)] ${p.className}`}
              />
            ))}
            {HERO_PILLS.map(({ icon: Icon, label, className }) => (
              <span
                key={label}
                aria-hidden
                className={`bg-brand-navy-900/80 absolute z-40 hidden items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur sm:inline-flex ${className}`}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-background text-foreground">
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
                <div className="relative h-44 bg-gradient-to-b from-[#c4d6f3] to-[#eef3fb]">
                  <Image
                    src={`/vetements/${p.img}-hd.webp`}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 22vw, 50vw"
                    className="object-contain p-2"
                  />
                </div>
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
          <div className="from-brand-navy-900 to-brand-navy-800 grid items-center gap-6 rounded-xl bg-gradient-to-r p-6 text-white lg:grid-cols-[1.3fr_repeat(4,1fr)]">
            <h2 className="text-2xl font-extrabold leading-tight">
              Une solution puissante, <span className="text-brand-sky">flexible et évolutive</span>
            </h2>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex flex-col items-center gap-1 text-center text-sm lg:border-l lg:border-white/15"
              >
                <Icon className="size-7" strokeWidth={1.4} aria-hidden />
                <strong>{title}</strong>
                <span className="text-white/70">{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <SectionTitle
            badge="Cas d'usage"
            subtitle="Découvrez comment nos utilisateurs créent des vêtements uniques avec WEAR3D STUDIO."
          >
            Des projets concrets, des résultats professionnels
          </SectionTitle>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CASES.map((c) => (
              <li
                key={c.title}
                className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
              >
                <div className="relative h-40 bg-gradient-to-b from-[#c4d6f3] to-[#eef3fb]">
                  <Image
                    src={`/vetements/${c.img}-hd.webp`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 18vw, 50vw"
                    className="object-contain p-2"
                  />
                </div>
                <div className="flex items-center gap-3 p-4">
                  <c.icon className="text-action size-6 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold">{c.title}</h3>
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
              <h2 className="mt-3 text-2xl font-extrabold">
                Ce qu&apos;ils disent de WEAR3D STUDIO
              </h2>
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
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="bg-brand-navy-900 grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                    >
                      {t.name[0]}
                    </span>
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-muted-foreground text-xs">{t.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">« {t.text} »</p>
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

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="from-brand-navy-900 to-accent-violet relative flex flex-col items-start gap-6 overflow-hidden rounded-2xl bg-gradient-to-r p-8 text-white md:flex-row md:items-center">
            <Image
              src="/produit/studio.webp"
              alt=""
              width={420}
              height={236}
              className="hidden w-72 shrink-0 rounded-lg border border-white/20 shadow-2xl md:block"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                Prêt à lancer votre projet textile ?
              </h2>
              <p className="mt-2 max-w-xl text-white/85">
                Rejoignez des milliers de clubs, d&apos;entreprises et de créateurs qui conçoivent,
                personnalisent et visualisent leurs vêtements en 3D.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/inscription">
                    Essayer gratuitement <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline-dark">
                  <Link href="/produit">
                    <PlayCircle aria-hidden /> Voir la démo (2 min)
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
