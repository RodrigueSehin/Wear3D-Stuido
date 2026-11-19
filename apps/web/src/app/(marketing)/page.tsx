import { Badge, Button, Logo } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Building2,
  Download,
  Layers,
  PlayCircle,
  Shirt,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroShowcase } from "@/components/marketing/hero-showcase";
import { getTranslations } from "next-intl/server";

const FAMILIES = [
  "tshirts",
  "football",
  "polos",
  "hoodies",
  "sport",
  "basketball",
  "uniforms",
  "shorts",
  "jackets",
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

export default async function HomePage() {
  const t = await getTranslations("home");
  const tf = await getTranslations("families");

  return (
    <>
      <section className="bg-brand-navy-950 text-white">
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

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold">{t("catalogTitle")}</h2>
        <p className="text-muted-foreground mt-2 text-center">{t("catalogSubtitle")}</p>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-9">
          {FAMILIES.map((f) => (
            <li key={f}>
              <Link
                href={`/catalogue?famille=${f}`}
                className="border-border bg-surface shadow-card hover:border-action flex h-36 flex-col items-center justify-center gap-3 rounded-lg border p-3 text-center text-sm font-semibold transition"
              >
                <Shirt className="text-action size-12" strokeWidth={1.25} aria-hidden />
                {tf(f)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="bg-gradient-cta flex flex-col items-start gap-6 rounded-xl p-8 text-white sm:flex-row sm:items-center sm:justify-between">
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
    </>
  );
}
