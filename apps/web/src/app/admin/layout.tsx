import Link from "next/link";

const SECTIONS = [
  ["", "Tableau de bord"],
  ["utilisateurs", "Utilisateurs"],
  ["organisations", "Organisations"],
  ["modeles", "Modèles 3D"],
  ["materiaux", "Matériaux"],
  ["ia", "IA"],
  ["plans", "Plans et quotas"],
  ["audit", "Journaux d'audit"],
] as const;

/** Espace administration plateforme (rôle platform_admin, contrôlé en phase 3). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="bg-brand-navy-950 hidden w-56 shrink-0 p-4 text-white md:block">
        <p className="font-display mb-4 px-2 font-bold">Administration</p>
        <ul className="flex flex-col gap-1 text-sm">
          {SECTIONS.map(([path, label]) => (
            <li key={path}>
              <Link
                href={`/admin${path ? `/${path}` : ""}`}
                className="block rounded-md px-2 py-2 text-white/80 hover:bg-white/10"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
