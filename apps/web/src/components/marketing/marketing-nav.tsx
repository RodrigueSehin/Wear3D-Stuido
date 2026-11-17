import { Button, Logo } from "@wear3d/ui";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/produit", key: "product" },
  { href: "/solutions", key: "solutions", menu: true },
  { href: "/tarifs", key: "pricing" },
  { href: "/ressources", key: "resources", menu: true },
] as const;

export async function MarketingNav() {
  const t = await getTranslations("nav");
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6">
      <Link href="/" aria-label="Accueil">
        <Logo inverted />
      </Link>
      <nav className="hidden items-center gap-8 text-sm font-medium text-white/85 lg:flex">
        {LINKS.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            className="inline-flex items-center gap-1 hover:text-white"
          >
            {t(l.key)}
            {"menu" in l && <ChevronDown className="size-4" aria-hidden />}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Button asChild variant="outline-dark" size="sm" className="hidden sm:inline-flex">
          <Link href="/connexion">{t("signIn")}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/inscription">{t("tryFree")}</Link>
        </Button>
      </div>
    </header>
  );
}
