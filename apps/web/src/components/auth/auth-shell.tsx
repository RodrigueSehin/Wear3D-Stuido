import { Logo } from "@wear3d/ui";
import { Box, CloudDownload, Layers, Sparkles, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface Aside {
  title: string;
  highlight: string;
  text: string;
  features: { icon: LucideIcon; title: string; text: string }[];
  jersey: string;
  thumbs: string[];
}

const ASIDES: Record<"login" | "signup", Aside> = {
  login: {
    title: "Connectez-vous à votre espace",
    highlight: "WEAR3D STUDIO",
    text: "Accédez à vos projets, créations, ressources et à l'éditeur 3D pour concevoir vos vêtements en toute liberté.",
    features: [
      {
        icon: Box,
        title: "Éditeur 3D puissant",
        text: "Personnalisez vos vêtements en temps réel.",
      },
      {
        icon: Sparkles,
        title: "Génération par IA",
        text: "Obtenez des designs uniques en un clic.",
      },
      {
        icon: Layers,
        title: "Vos projets en ligne",
        text: "Sauvegardez, retrouvez et partagez vos créations.",
      },
      { icon: CloudDownload, title: "Export haute qualité", text: "PNG, JPG, PDF et GLB." },
    ],
    jersey: "/hero/jersey-football.png",
    thumbs: ["football", "polo", "hoodie-noir"],
  },
  signup: {
    title: "Créez votre compte",
    highlight: "gratuitement",
    text: "Rejoignez WEAR3D STUDIO et commencez dès aujourd'hui à concevoir, personnaliser et exporter vos vêtements en 3D.",
    features: [
      {
        icon: Box,
        title: "Éditeur 3D professionnel",
        text: "Personnalisez vos vêtements en temps réel.",
      },
      {
        icon: Sparkles,
        title: "Génération par IA",
        text: "Créez des designs uniques en quelques secondes.",
      },
      {
        icon: Layers,
        title: "Bibliothèque riche",
        text: "Modèles 3D, templates, textures et motifs.",
      },
      {
        icon: CloudDownload,
        title: "Export multi-formats",
        text: "PNG, JPG, PDF et GLB haute qualité.",
      },
    ],
    jersey: "/hero/jersey-polo.png",
    thumbs: ["polo", "hoodie-noir", "football"],
  },
};

/** Mise en page scindée des maquettes Connexion / Inscription : panneau navy illustré + carte blanche. */
export function AuthShell({
  variant,
  title,
  subtitle,
  children,
}: {
  variant: "login" | "signup";
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const a = ASIDES[variant];
  return (
    <div className="bg-brand-navy-950 relative isolate grid min-h-dvh overflow-hidden text-white lg:grid-cols-[1.05fr_1fr]">
      <Image
        src="/hero/background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[60%_bottom] opacity-80"
      />
      <div
        aria-hidden
        className="from-brand-navy-950 via-brand-navy-900/90 to-action/40 absolute inset-0 -z-10 bg-gradient-to-br"
      />

      <aside className="relative hidden flex-col gap-6 p-10 lg:flex xl:p-14">
        <Link href="/" aria-label="Accueil" className="w-fit">
          <Logo inverted />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight xl:text-5xl">
            {a.title} <span className="text-brand-sky">{a.highlight}</span>
          </h2>
          <p className="mt-4 text-white/80">{a.text}</p>
          <ul className="mt-6 space-y-3">
            {a.features.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="bg-brand-navy-800/80 grid size-12 shrink-0 place-items-center rounded-xl border border-white/15">
                  <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-40 right-0 hidden w-[44%] xl:block"
        >
          <div className="ring-brand-sky/60 absolute inset-x-0 bottom-0 h-12 rounded-[50%] ring-2 [box-shadow:0_0_40px_rgba(76,141,255,.5)]" />
          <Image
            src={a.jersey}
            alt=""
            width={360}
            height={420}
            priority
            className="relative mx-auto h-auto w-4/5 drop-shadow-[0_24px_36px_rgb(0_10_50/0.6)]"
          />
        </div>

        <ul aria-hidden className="relative z-10 mt-auto flex gap-3">
          {a.thumbs.map((t) => (
            <li
              key={t}
              className="bg-brand-navy-800/60 -skew-x-3 rounded-2xl border border-white/15 p-2 backdrop-blur"
            >
              <Image
                src={`/vetements/${t}-hd.webp`}
                alt=""
                width={140}
                height={150}
                className="h-28 w-28 object-contain"
              />
            </li>
          ))}
        </ul>
      </aside>

      <main className="relative flex items-center justify-center p-4 sm:p-8">
        <div className="text-foreground bg-surface w-full max-w-xl rounded-3xl p-6 shadow-2xl sm:p-10">
          <Link href="/" aria-label="Accueil" className="mb-4 inline-block lg:hidden">
            <Logo />
          </Link>
          <h1 className="font-display text-center text-4xl font-extrabold">{title}</h1>
          <p className="text-muted-foreground mb-6 mt-2 text-center">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
