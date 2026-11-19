import { Badge, Button, Logo } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Briefcase,
  Download,
  Gem,
  Image as ImageIcon,
  Layers,
  MousePointer2,
  Palette,
  PlayCircle,
  Shirt,
  Sparkles,
  Trophy,
  Type,
  Users,
  Users2,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JerseyTurntable } from "@/components/marketing/jersey-turntable";
import { CheckList, FeatureCard, SectionTitle } from "@/components/marketing/sections";

export const metadata: Metadata = {
  title: "Produit",
  description:
    "Un studio 3D complet pour créer des vêtements uniques et professionnels : éditeur 3D, personnalisation avancée, génération IA, export multi-formats.",
};

const FEATURES = [
  {
    icon: Box,
    title: "Éditeur 3D 360°",
    text: "Personnalisez chaque zone de votre vêtement en temps réel.",
  },
  {
    icon: Sparkles,
    title: "Génération IA",
    text: "Obtenez des designs uniques à partir d'une simple description.",
    tone: "violet",
  },
  {
    icon: Palette,
    title: "Personnalisation avancée",
    text: "Couleurs, matières, logos, textes, numéros et motifs.",
  },
  {
    icon: Layers,
    title: "Simulation réaliste",
    text: "Un rendu fidèle des tissus, textures et volumes.",
  },
  {
    icon: Download,
    title: "Exportation multi-formats",
    text: "PNG, JPG, PDF et GLB pour tous vos usages.",
    tone: "violet",
  },
  {
    icon: Users,
    title: "Collaboration",
    text: "Travaillez en équipe sur vos projets (entreprise, club, association).",
  },
] as const;

const NEEDS = [
  {
    icon: Trophy,
    title: "Clubs sportifs",
    text: "Créez vos maillots et tenues de compétition.",
    img: "/vetements/portrait-1-hd.webp",
  },
  {
    icon: Briefcase,
    title: "Entreprises",
    text: "Concevez des uniformes et vêtements professionnels.",
    img: "/vetements/portrait-2-hd.webp",
  },
  {
    icon: Gem,
    title: "Créateurs & marques",
    text: "Donnez vie à vos collections de vêtements.",
    img: "/vetements/portrait-3-hd.webp",
  },
  {
    icon: Users2,
    title: "Associations",
    text: "Personnalisez vos tenues aux couleurs de votre organisation.",
    img: "/vetements/portrait-4-hd.webp",
  },
] as const;

const HERO_STATS = [
  { icon: Box, value: "360°", label: "Visualisation 3D" },
  { icon: Shirt, value: "+50", label: "Modèles de vêtements" },
  { icon: Download, value: "HD", label: "Export haute qualité" },
] as const;

const TOOLS = [MousePointer2, Type, ImageIcon, Layers] as const;
const SWATCHES = ["#1F5EFF", "#BBD3FF", "#F7D358"] as const;

export default function Page() {
  return (
    <div className="bg-brand-navy-950 text-white">
      <section className="relative overflow-hidden rounded-b-[2.5rem]">
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
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Badge variant="outline" className="bg-brand-navy-800/60 border-white/25 text-white">
              Notre solution
            </Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Un studio 3D complet pour créer des <span className="text-brand-sky">vêtements</span>{" "}
              uniques et professionnels
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              WEAR3D STUDIO rassemble un puissant éditeur 3D, des outils de personnalisation avancés
              et une intelligence artificielle pour concevoir, visualiser et exporter vos vêtements
              en toute simplicité.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/studio/nouveau">
                  Essayer le studio 3D <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline-dark">
                <Link href="/solutions">
                  <PlayCircle aria-hidden /> Voir la démo (2 min)
                </Link>
              </Button>
            </div>
            <dl className="mt-8 flex flex-wrap items-center gap-6 text-sm">
              {HERO_STATS.map(({ icon: Icon, value, label }, i) => (
                <div key={label} className="flex items-center gap-6">
                  {i > 0 && <span aria-hidden className="hidden h-8 w-px bg-white/20 sm:block" />}
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-7 text-white/85" strokeWidth={1.25} aria-hidden />
                    <div>
                      <dt className="font-bold leading-tight">{value}</dt>
                      <dd className="text-xs text-white/70">{label}</dd>
                    </div>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto h-[400px] w-full max-w-lg lg:h-[430px]">
            <div className="ring-brand-sky/60 absolute inset-x-6 bottom-2 h-20 rounded-[50%] ring-2 [box-shadow:0_0_40px_rgba(76,141,255,.45)]" />
            <ul className="absolute left-0 top-6 z-10 flex flex-col gap-2 rounded-xl border border-white/15 bg-white/10 p-2 backdrop-blur">
              {SWATCHES.map((c) => (
                <li
                  key={c}
                  className="size-6 rounded-md border border-white/40"
                  style={{ background: c }}
                />
              ))}
            </ul>
            <div className="absolute inset-x-12 bottom-6 top-0 sm:inset-x-14">
              <JerseyTurntable />
            </div>
            <ul className="absolute right-0 top-6 z-10 flex flex-col gap-3 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              {TOOLS.map((Icon, i) => (
                <li key={i}>
                  <Icon className="size-6" strokeWidth={1.5} />
                </li>
              ))}
            </ul>
            <span className="absolute bottom-6 right-8 text-sm font-bold text-white/90">360°</span>
          </div>
        </div>
      </section>

      <div className="bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionTitle
            badge="Fonctionnalités principales"
            subtitle="Des outils puissants, simples et intuitifs, pensés pour les créateurs, clubs, entreprises et marques."
          >
            Tout ce qu&apos;il faut pour concevoir vos vêtements
          </SectionTitle>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <div className="bg-action-soft grid items-center gap-8 rounded-3xl p-6 lg:grid-cols-[1.3fr_1fr] lg:p-10">
            <div className="bg-brand-navy-900 shadow-card overflow-hidden rounded-xl">
              <Image
                src="/produit/studio.webp"
                alt="Le studio 3D de WEAR3D STUDIO : bibliothèque de modèles, vue 3D du maillot, calques et inspecteur"
                width={1400}
                height={788}
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="h-auto w-full"
              />
            </div>
            <div>
              <span className="bg-surface text-action ring-action/20 inline-block rounded-full px-3 py-1 text-xs font-semibold ring-1">
                Le Studio 3D
              </span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight">
                Un éditeur puissant, directement en ligne
              </h2>
              <p className="text-muted-foreground mt-3">
                Une interface moderne et intuitive pour donner vie à vos idées, sans logiciel à
                installer.
              </p>
              <div className="mt-5">
                <CheckList
                  items={[
                    "Visualisation 3D en temps réel",
                    "Personnalisation par zones",
                    "Ajout de logos, textes et numéros",
                    "Gestion des calques",
                    "Simulation des matières",
                    "Export haute qualité",
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-extrabold">
            Une solution pour <span className="text-action">tous les besoins</span>
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NEEDS.map((n) => (
              <li
                key={n.title}
                className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
              >
                <div className="relative h-48 bg-gradient-to-b from-[#c4d6f3] to-[#e9eff9]">
                  <Image
                    src={n.img}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, 50vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-4">
                  <h3 className="flex items-center gap-2 font-bold">
                    <n.icon className="text-action size-5" aria-hidden /> {n.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">{n.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="from-brand-navy-900 to-accent-violet flex flex-col items-start gap-6 rounded-2xl bg-gradient-to-r p-8 text-white md:flex-row md:items-center">
            <Logo inverted className="hidden md:inline-flex" />
            <span aria-hidden className="hidden h-12 w-px bg-white/25 md:block" />
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold">Prêt à créer votre prochain vêtement ?</h2>
              <p className="mt-1 text-white/80">
                Rejoignez WEAR3D STUDIO et concevez sans limites.
              </p>
            </div>
            <Button asChild size="lg" variant="white">
              <Link href="/inscription">
                Commencer gratuitement <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
