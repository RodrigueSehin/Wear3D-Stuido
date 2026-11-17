"use client";

import { Button, cn, Logo } from "@wear3d/ui";
import {
  Box,
  Crown,
  FolderOpen,
  Home,
  ImageIcon,
  Layers,
  Settings,
  Shirt,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Item = { href: string; key: string; icon: LucideIcon };

const MAIN: Item[] = [
  { href: "/app", key: "dashboard", icon: Home },
  { href: "/app/projets", key: "creations", icon: Layers },
  { href: "/studio/nouveau", key: "studio", icon: Box },
  { href: "/app/ia", key: "ai", icon: Sparkles },
  { href: "/catalogue", key: "catalog", icon: Shirt },
  { href: "/app/bibliotheque", key: "library", icon: ImageIcon },
  { href: "/app/partages", key: "shared", icon: Users },
];

const SECONDARY: Item[] = [
  { href: "/app/exports", key: "exports", icon: FolderOpen },
  { href: "/app/abonnement", key: "subscription", icon: Crown },
  { href: "/app/parametres", key: "settings", icon: Settings },
];

export function AppSidebar() {
  const t = useTranslations("app");
  const pathname = usePathname();

  const renderItem = ({ href, key, icon: Icon }: Item) => {
    const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
    return (
      <li key={key}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white",
            active && "bg-action hover:bg-action text-white",
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
          {t(key)}
        </Link>
      </li>
    );
  };

  return (
    <aside className="bg-brand-navy-900 hidden w-64 shrink-0 flex-col gap-6 p-4 lg:flex">
      <Link href="/app" className="px-2 py-1" aria-label={t("dashboard")}>
        <Logo inverted />
      </Link>
      <nav className="flex flex-1 flex-col gap-4">
        <ul className="flex flex-col gap-1">{MAIN.map(renderItem)}</ul>
        <hr className="border-white/10" />
        <ul className="flex flex-col gap-1">{SECONDARY.map(renderItem)}</ul>
      </nav>
      <div className="bg-brand-navy-800 rounded-lg border border-white/15 p-4 text-center text-white">
        <Crown className="text-accent-amber mx-auto size-8" aria-hidden />
        <p className="font-display mt-2 font-bold">{t("upgradeTitle")}</p>
        <p className="mt-1 text-xs text-white/75">{t("upgradeText")}</p>
        <Button asChild variant="white" size="sm" className="mt-3 w-full">
          <Link href="/tarifs">{t("upgradeButton")}</Link>
        </Button>
      </div>
    </aside>
  );
}
