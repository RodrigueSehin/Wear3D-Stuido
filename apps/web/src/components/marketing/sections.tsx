import { Button } from "@wear3d/ui";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function SectionTitle({
  badge,
  children,
  subtitle,
}: {
  badge: string;
  children: ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="mx-auto mb-8 max-w-3xl text-center">
      <span className="bg-action-soft text-action inline-block rounded-full px-3 py-1 text-xs font-semibold">
        {badge}
      </span>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight">{children}</h2>
      {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
    </header>
  );
}

/** Pastille d'icône teintée des cartes de fonctionnalités. */
export function IconBadge({
  icon: Icon,
  tone = "blue",
}: {
  icon: LucideIcon;
  tone?: "blue" | "violet";
}) {
  return (
    <span
      className={
        tone === "violet"
          ? "bg-accent-violet-soft text-accent-violet grid size-12 shrink-0 place-items-center rounded-full"
          : "bg-action-soft text-action grid size-12 shrink-0 place-items-center rounded-full"
      }
    >
      <Icon className="size-6" strokeWidth={1.6} aria-hidden />
    </span>
  );
}

export function FeatureCard({
  icon,
  title,
  text,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: "blue" | "violet";
}) {
  return (
    <li className="border-border bg-surface shadow-card flex items-center gap-4 rounded-xl border p-5">
      <IconBadge icon={icon} tone={tone} />
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
    </li>
  );
}

export function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i} className="flex items-center gap-2">
          <Check className="text-action size-4 shrink-0" aria-hidden /> {i}
        </li>
      ))}
    </ul>
  );
}

/** Bandeau d'appel à l'action en dégradé bleu-violet. */
export function CtaBanner({
  title,
  text,
  primary = { href: "/inscription", label: "Commencer gratuitement" },
  secondary,
}: {
  title: string;
  text: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="bg-gradient-cta flex flex-col items-start justify-between gap-6 rounded-2xl p-8 text-white md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-white/85">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="white">
            <Link href={primary.href}>
              {primary.label} <ArrowRight aria-hidden />
            </Link>
          </Button>
          {secondary && (
            <Button asChild size="lg" variant="outline-dark">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Vignette de vêtement (rendu du hero) sur fond dégradé : en attendant les photos des maquettes. */
export function JerseyTile({
  src,
  className,
  tone = "from-[#dbe6fb] to-[#f4f7fe]",
}: {
  src: string;
  className?: string;
  tone?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-b ${tone} grid place-items-center overflow-hidden ${className ?? ""}`}
    >
      <Image
        src={src}
        alt=""
        width={240}
        height={280}
        className="h-full w-auto max-w-none object-contain py-2"
      />
    </div>
  );
}
