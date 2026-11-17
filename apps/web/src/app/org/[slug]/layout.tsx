import Link from "next/link";

const TABS = [
  ["", "Tableau de bord"],
  ["membres", "Membres"],
  ["equipes", "Équipes"],
  ["marque", "Kit de marque"],
  ["validation", "Validation"],
  ["statistiques", "Statistiques"],
  ["facturation", "Facturation"],
] as const;

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="min-h-dvh">
      <nav
        className="border-border bg-surface flex gap-1 overflow-x-auto border-b px-4 sm:px-6"
        aria-label="Organisation"
      >
        {TABS.map(([path, label]) => (
          <Link
            key={path}
            href={`/org/${slug}${path ? `/${path}` : ""}`}
            className="text-muted-foreground hover:text-foreground whitespace-nowrap px-3 py-3 text-sm font-medium"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
