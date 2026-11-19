import {
  formatBytes,
  PLAN_CARDS,
  PLAN_QUOTAS,
  usagePercent,
  formatXof,
  MONTHLY_PRICE_XOF,
} from "@wear3d/billing";
import { Badge, Button } from "@wear3d/ui";
import { Crown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadDashboard } from "@/lib/app/dashboard";

export const metadata: Metadata = { title: "Abonnement" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function Meter({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{text}</span>
      </div>
      <div
        className="bg-surface-muted h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={
            value >= 100
              ? "bg-danger h-full"
              : value >= 80
                ? "bg-warning h-full"
                : "bg-action h-full"
          }
          style={{ width: `${value}%` }}
        />
      </div>
      {value >= 80 && (
        <p className="text-warning mt-1 text-xs">
          {value >= 100
            ? "Limite atteinte : les nouvelles créations sont bloquées."
            : "Vous approchez de la limite."}
        </p>
      )}
    </div>
  );
}

export default async function Page() {
  const d = await loadDashboard();
  if (!d) redirect("/connexion?suite=/app/abonnement");
  const card = PLAN_CARDS.find((p) => p.id === d.plan)!;
  const q = PLAN_QUOTAS[d.plan];
  const price = MONTHLY_PRICE_XOF[d.plan];

  return (
    <div className="max-w-4xl space-y-6 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold">Abonnement</h1>

      <section className="border-border bg-surface shadow-card rounded-2xl border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-action grid size-12 place-items-center rounded-xl text-white">
              <Crown className="size-6" aria-hidden />
            </span>
            <div>
              <p className="flex items-center gap-2 text-2xl font-extrabold">
                {card.name} <Badge variant="success">Actif</Badge>
              </p>
              <p className="text-muted-foreground text-sm">
                {price === null
                  ? "Sur devis"
                  : price === 0
                    ? "Gratuit"
                    : `${formatXof(price)} / mois`}
                {d.renewal ? ` · Renouvellement le ${dateFmt.format(new Date(d.renewal))}` : ""}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/tarifs">
              {d.plan === "free" ? "Passer à une offre supérieure" : "Changer de formule"}
            </Link>
          </Button>
        </div>
        <ul className="text-muted-foreground mt-4 grid gap-1 text-sm sm:grid-cols-2">
          {card.features.map((f) => (
            <li key={f}>✓ {f}</li>
          ))}
        </ul>
      </section>

      <section
        className="border-border bg-surface shadow-card space-y-4 rounded-2xl border p-6"
        aria-labelledby="usage"
      >
        <h2 id="usage" className="text-xl font-extrabold">
          Consommation
        </h2>
        <Meter
          label="Projets"
          value={usagePercent(d.designCount, q.projects)}
          text={`${d.designCount} / ${q.projects ?? "illimités"}`}
        />
        <Meter
          label="Crédits IA"
          value={usagePercent(d.creditsBalance, q.creditsPerMonth)}
          text={`${d.creditsBalance} / ${q.creditsPerMonth ?? "sur mesure"}`}
        />
        <Meter
          label="Stockage"
          value={usagePercent(d.storageUsed, q.storageBytes)}
          text={`${formatBytes(d.storageUsed)} / ${q.storageBytes ? formatBytes(q.storageBytes) : "sur mesure"}`}
        />
      </section>

      <p className="text-muted-foreground text-sm">
        Le paiement en ligne (carte bancaire et mobile money) sera disponible prochainement. En
        attendant, contactez-nous pour changer de formule.
      </p>
    </div>
  );
}
