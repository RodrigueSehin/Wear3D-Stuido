import { Badge, Button, Logo } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Download,
  Layers,
  PlayCircle,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
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
      <section className="bg-hero text-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
          <Badge variant="outline" className="bg-brand-navy-800/60 border-white/25 text-white">
            {t("badge")}
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            {t("titleStart")} <span className="text-brand-sky">{t("titleHighlight")}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{t("subtitle")}</p>
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

          <ul className="bg-brand-navy-900/70 mt-14 grid gap-4 rounded-lg border border-white/10 p-5 sm:grid-cols-2 lg:grid-cols-5">
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
