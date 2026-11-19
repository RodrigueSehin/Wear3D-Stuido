import { formatBytes, PLAN_CARDS, usagePercent } from "@wear3d/billing";
import { Badge, Button } from "@wear3d/ui";
import {
  ArrowRight,
  Box,
  Cloud,
  Crown,
  FolderOpen,
  ImageIcon,
  Plus,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JerseyThumb } from "@/components/studio/jersey-thumb";
import { loadDashboard } from "@/lib/app/dashboard";

export const metadata: Metadata = { title: "Tableau de bord" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function Meter({ value, tone = "bg-action" }: { value: number; tone?: string }) {
  return (
    <div
      className="bg-surface-muted h-2 overflow-hidden rounded-full"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`${tone} h-full rounded-full`} style={{ width: `${value}%` }} />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  tone,
  extra,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  tone: string;
  extra?: React.ReactNode;
}) {
  return (
    <li className={`flex items-center gap-4 rounded-xl border border-white/60 p-4 ${tone}`}>
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/70">
        <Icon className="size-6" strokeWidth={1.6} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-3xl font-extrabold leading-tight">
          {value}
          {unit && <span className="text-muted-foreground ml-1 text-sm font-medium">{unit}</span>}
        </p>
        {extra}
      </div>
    </li>
  );
}

const ACTIONS = [
  { href: "/studio/nouveau", icon: Plus, label: "Nouveau projet", primary: true },
  { href: "/studio/nouveau", icon: Box, label: "Ouvrir le Studio 3D" },
  { href: "/app/ia", icon: Sparkles, label: "Générer avec l'IA" },
  { href: "/catalogue", icon: Shirt, label: "Explorer le catalogue" },
] as const;

export default async function Page() {
  const d = await loadDashboard();
  if (!d) redirect("/connexion?suite=/app");

  const planName = PLAN_CARDS.find((p) => p.id === d.plan)?.name ?? "Free";
  const credits = d.quota.creditsPerMonth;
  const creditsPct = usagePercent(d.creditsBalance, credits);
  const storagePct = usagePercent(d.storageUsed, d.quota.storageBytes);
  const firstName = d.displayName.split(" ")[0] || d.displayName;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-3xl font-extrabold">
          Bonjour <span className="font-black">{d.displayName}</span> <span aria-hidden>👋</span>
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur WEAR3D STUDIO. Concevez, personnalisez et exportez vos vêtements en 3D.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="from-brand-navy-900 to-action relative min-h-52 overflow-hidden rounded-2xl bg-gradient-to-r p-8 text-white">
          <div className="relative z-10 max-w-md">
            <h2 className="text-3xl font-extrabold leading-tight">
              Créez votre prochain vêtement <span className="text-brand-sky">en 3D</span> dès
              maintenant !
            </h2>
            <p className="mt-3 text-white/80">
              Utilisez le Studio 3D, nos modèles ou l&apos;IA pour concevoir un design unique et
              professionnel.
            </p>
            <Button asChild variant="white" size="lg" className="mt-5">
              <Link href="/studio/nouveau">
                Nouveau projet <Plus aria-hidden />
              </Link>
            </Button>
          </div>
          <div
            aria-hidden
            className="absolute bottom-0 right-4 hidden h-full items-end gap-1 md:flex"
          >
            <Image
              src="/hero/jersey-polo.png"
              alt=""
              width={160}
              height={190}
              className="h-36 w-auto"
            />
            <Image
              src="/hero/jersey-football.png"
              alt=""
              width={200}
              height={230}
              className="h-44 w-auto"
            />
            <Image
              src="/hero/jersey-hoodie.png"
              alt=""
              width={160}
              height={190}
              className="h-36 w-auto"
            />
          </div>
        </section>

        <section className="border-border from-action-soft to-surface shadow-card rounded-2xl border bg-gradient-to-br p-5">
          <div className="flex items-center gap-3">
            <span className="bg-action grid size-11 place-items-center rounded-xl text-white">
              <Crown className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="font-bold">Mon abonnement</h2>
              <p className="flex items-center gap-2 text-lg font-extrabold">
                {planName} <Badge variant="success">Actif</Badge>
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {d.renewal
              ? `Renouvellement : ${dateFmt.format(new Date(d.renewal))}`
              : d.plan === "free"
                ? "Formule gratuite, sans engagement"
                : "Abonnement actif"}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <div className="mb-1 flex justify-between">
                <dt>Crédits IA</dt>
                <dd className="font-semibold">
                  {d.creditsBalance} / {credits ?? "∞"}
                </dd>
              </div>
              <Meter value={creditsPct} />
            </div>
            <div>
              <div className="mb-1 flex justify-between">
                <dt>Stockage</dt>
                <dd className="font-semibold">
                  {formatBytes(d.storageUsed)} /{" "}
                  {d.quota.storageBytes ? formatBytes(d.quota.storageBytes) : "∞"}
                </dd>
              </div>
              <Meter value={storagePct} />
            </div>
          </dl>
        </section>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Box}
          label="Projets"
          value={d.designCount}
          unit={d.quota.projects ? `/ ${d.quota.projects}` : undefined}
          tone="bg-action-soft text-action"
        />
        <Stat
          icon={ImageIcon}
          label="Images importées"
          value={d.assetCount}
          tone="bg-accent-violet-soft text-accent-violet"
        />
        <Stat
          icon={Sparkles}
          label="Crédits IA"
          value={d.creditsBalance}
          tone="bg-accent-amber-soft text-amber-600"
        />
        <Stat
          icon={Cloud}
          label="Stockage utilisé"
          value={formatBytes(d.storageUsed)}
          tone="bg-success-soft text-success"
          extra={
            <div className="mt-2">
              <Meter value={storagePct} tone="bg-success" />
            </div>
          }
        />
      </ul>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <section aria-labelledby="quick">
          <h2 id="quick" className="mb-3 text-xl font-extrabold">
            Actions rapides
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
            {ACTIONS.map(({ href, icon: Icon, label, ...rest }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`border-border bg-surface hover:border-action shadow-card flex h-full flex-col items-center gap-2 rounded-xl border p-4 text-center text-sm font-medium transition ${"primary" in rest ? "ring-action/40 bg-action-soft ring-2" : ""}`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-full ${"primary" in rest ? "bg-action text-white" : "text-foreground"}`}
                  >
                    <Icon className="size-6" strokeWidth={1.6} aria-hidden />
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recent">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent" className="text-xl font-extrabold">
              Mes projets récents
            </h2>
            <Link
              href="/app/projets"
              className="text-action inline-flex items-center gap-1 text-sm font-semibold"
            >
              Voir tout <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <div className="border-border bg-surface shadow-card flex flex-col items-start gap-3 rounded-xl border p-6">
              <FolderOpen className="text-muted-foreground size-8" aria-hidden />
              <p className="text-muted-foreground text-sm">
                Vous n&apos;avez pas encore de projet, {firstName}. Lancez votre premier design !
              </p>
              <Button asChild>
                <Link href="/studio/nouveau">Créer mon premier design</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {d.recent.map((r) => (
                <li
                  key={r.id}
                  className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
                >
                  <Link
                    href={`/studio/${r.id}`}
                    className="block bg-gradient-to-b from-[#dbe6fb] to-[#f4f7fe] p-3"
                    aria-label={`Ouvrir ${r.name}`}
                  >
                    <JerseyThumb
                      body={r.body}
                      sleeves={r.sleeves}
                      collar={r.collar}
                      className="mx-auto h-28 w-full"
                    />
                  </Link>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {dateFmt.format(new Date(r.updatedAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="from-action-soft to-surface border-border flex items-center justify-between gap-4 rounded-2xl border bg-gradient-to-r p-6">
          <div>
            <h2 className="text-xl font-extrabold">Explorez le catalogue</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Des modèles 3D prêts à personnaliser : maillots, t-shirts, hoodies et plus.
            </p>
            <Button asChild className="mt-4">
              <Link href="/catalogue">
                Voir le catalogue <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
        <div className="from-accent-violet-soft to-surface border-border flex items-center justify-between gap-4 rounded-2xl border bg-gradient-to-r p-6">
          <div>
            <h2 className="text-xl font-extrabold">Essayez la génération IA</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Décrivez votre idée et laissez l&apos;IA créer plusieurs designs pour vous.
            </p>
            <Button asChild variant="soft" className="mt-4">
              <Link href="/app/ia">
                Générer un design <Sparkles aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
