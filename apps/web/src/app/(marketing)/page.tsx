import { Badge, Button, Logo } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Building2,
  Download,
  Eye,
  Layers,
  PlayCircle,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeroShowcase } from "@/components/marketing/hero-showcase";

/** Familles du catalogue : visuel (public/vetements) et lien vers la famille. */
const FAMILIES = [
  { id: "tshirts", img: "tshirt" },
  { id: "football", img: "football" },
  { id: "polos", img: "polo" },
  { id: "hoodies", img: "hoodie" },
  { id: "sport", img: "veste" },
  { id: "basketball", img: "basketball" },
  { id: "uniforms", img: "uniforme" },
  { id: "shorts", img: "short" },
  { id: "jackets", img: "veste" },
] as const;

const STATS = [
  { icon: Users, value: "10 000+", label: "Créateurs" },
  { icon: Building2, value: "1 200+", label: "Entreprises & clubs" },
  { icon: Shirt, value: "50+", label: "Modèles de vêtements" },
  { icon: Star, value: "4,8/5", label: "Satisfaction client" },
];

const FEATURES = [
  { icon: Box, title: "Éditeur 3D intuitif", text: "Visualisation en temps réel" },
  { icon: Sparkles, title: "Assistant IA", text: "Générez des designs uniques" },
  { icon: Layers, title: "Simulation réaliste", text: "Rendu et texture de tissu" },
  { icon: Download, title: "Export professionnel", text: "PNG, JPG, GLB et PDF" },
  { icon: Users, title: "Collaboratif", text: "Idéal pour équipes et clubs" },
];

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Shirt, title: "Choisissez un modèle", text: "Parmi notre catalogue 3D" },
  { icon: SlidersHorizontal, title: "Personnalisez", text: "Couleurs, matières, logos, textes…" },
  { icon: Eye, title: "Visualisez en 3D", text: "Rotation 360° et rendu réaliste" },
  { icon: Download, title: "Exportez", text: "Votre création en haute qualité" },
];

export default async function HomePage() {
  const t = await getTranslations("home");
  const tf = await getTranslations("families");

  return (
    <div className="bg-brand-navy-950 text-white">
      <section>
        <div className="relative overflow-hidden">
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
            className="from-brand-navy-950 via-brand-navy-950/60 absolute inset-0 bg-gradient-to-r to-transparent"
          />
          <div className="relative mx-auto max-w-7xl px-4 pb-4 pt-6 sm:px-6">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
              <div>
                <Badge
                  variant="outline"
                  className="bg-brand-navy-800/60 border-white/25 text-white"
                >
                  {t("badge")}
                </Badge>
                <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                  {t("titleStart")} <span className="text-brand-sky">{t("titleHighlight")}</span>
                </h1>
                <p className="mt-5 max-w-xl text-lg text-white/80">{t("subtitle")}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button asChild size="lg">
                    <Link href="/catalogue">
                      Essayer gratuitement <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline-dark">
                    <Link href="/produit">
                      <PlayCircle aria-hidden /> {t("demo")}
                    </Link>
                  </Button>
                </div>
                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                  {STATS.map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon
                        className="size-6 shrink-0 text-white/80"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <div>
                        <dt className="text-sm font-bold leading-tight">{value}</dt>
                        <dd className="text-[11px] leading-tight text-white/70">{label}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
              <HeroShowcase />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6">
          <ul className="bg-brand-navy-900/70 grid gap-4 rounded-lg border border-white/10 p-5 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3">
                <Icon className="size-8 shrink-0 text-white" strokeWidth={1.5} aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6" aria-labelledby="catalog">
        <h2 id="catalog" className="text-center text-3xl font-extrabold">
          {t("catalogTitle")}
        </h2>
        <p className="mt-2 text-center text-white/70">{t("catalogSubtitle")}</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
          {FAMILIES.map((f) => (
            <li key={f.id}>
              <Link
                href={`/catalogue?famille=${f.id}`}
                className="bg-brand-navy-900/70 hover:border-brand-sky hover:bg-brand-navy-800 flex h-44 flex-col items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-center text-sm font-semibold transition"
              >
                <span className="relative block h-28 w-full">
                  <Image
                    src={`/vetements/${f.img}-hd.webp`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 11vw, 33vw"
                    className="object-contain"
                  />
                </span>
                {tf(f.id)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6" aria-labelledby="steps">
        <h2 id="steps" className="text-center text-3xl font-extrabold">
          Créez votre vêtement en 4 étapes
        </h2>
        <ol className="mt-8 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="contents">
              <div className="bg-brand-navy-900/70 flex items-center gap-3 rounded-lg border border-white/10 p-4">
                <span className="bg-action grid size-9 shrink-0 place-items-center rounded-full font-bold">
                  {i + 1}
                </span>
                <Icon className="size-7 shrink-0" strokeWidth={1.5} aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-white/70">{text}</span>
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="mx-auto hidden size-5 text-white/60 md:block" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="bg-gradient-cta flex flex-col items-start gap-6 rounded-xl p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <Logo inverted className="hidden sm:inline-flex" />
            <div>
              <h2 className="text-2xl font-extrabold">{t("ctaTitle")}</h2>
              <p className="mt-1 text-white/85">{t("ctaSubtitle")}</p>
            </div>
          </div>
          <Button asChild variant="white" size="lg">
            <Link href="/inscription">
              {t("ctaButton")} <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
