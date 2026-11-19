import { Button } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Briefcase,
  Download,
  Gem,
  Layers,
  PlayCircle,
  Palette,
  Shirt,
  Sparkles,
  Trophy,
  Users,
  Users2,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import {
  CheckList,
  CtaBanner,
  FeatureCard,
  JerseyTile,
  SectionTitle,
} from "@/components/marketing/sections";

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
    img: "/hero/jersey-football.png",
  },
  {
    icon: Briefcase,
    title: "Entreprises",
    text: "Concevez des uniformes et vêtements professionnels.",
    img: "/hero/jersey-polo.png",
  },
  {
    icon: Gem,
    title: "Créateurs & marques",
    text: "Donnez vie à vos collections de vêtements.",
    img: "/hero/jersey-hoodie.png",
  },
  {
    icon: Users2,
    title: "Associations",
    text: "Personnalisez vos tenues aux couleurs de votre organisation.",
    img: "/hero/jersey-polo.png",
  },
] as const;

export default function Page() {
  return (
    <>
      <PageHero
        badge="Notre solution"
        title="Un studio 3D complet pour créer des"
        highlight="vêtements uniques et professionnels"
        subtitle="WEAR3D STUDIO rassemble un puissant éditeur 3D, des outils de personnalisation avancés et une intelligence artificielle pour concevoir, visualiser et exporter vos vêtements en toute simplicité."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/studio/nouveau">
              Essayer le studio 3D <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline-dark">
            <Link href="/solutions">
              <PlayCircle aria-hidden /> Voir les solutions
            </Link>
          </Button>
        </div>
        <ul className="mt-6 flex flex-wrap gap-8 text-sm">
          {[
            [Box, "360°", "Visualisation 3D"],
            [Shirt, "+50", "Modèles de vêtements"],
            [Download, "HD", "Export haute qualité"],
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
          <div className="bg-brand-navy-900 shadow-card relative overflow-hidden rounded-xl">
            <Image
              src="/hero/background.png"
              alt="Aperçu de l'éditeur WEAR3D STUDIO avec un maillot bleu en 3D"
              width={1280}
              height={720}
              className="h-auto w-full object-cover opacity-90"
            />
            <Image
              src="/hero/jersey-football.png"
              alt=""
              width={260}
              height={300}
              className="absolute left-1/2 top-1/2 h-4/5 w-auto -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <div>
            <span className="bg-action-soft text-action ring-action/20 inline-block rounded-full px-3 py-1 text-xs font-semibold ring-1">
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
                  "Gestion des calques et groupes",
                  "Vue 2D et patron de couture",
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
              <JerseyTile src={n.img} className="h-40" />
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

      <CtaBanner
        title="Prêt à créer votre prochain vêtement ?"
        text="Rejoignez WEAR3D STUDIO et concevez sans limites."
      />
    </>
  );
}
