import { Badge } from "@wear3d/ui";
import { Download, FileDown } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/env";
import { createClient } from "@/lib/supabase/server";
import type { CloudClient } from "@/lib/studio/cloud";

export const metadata: Metadata = { title: "Exports" };

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

interface Row {
  id: string;
  format: string;
  created_at: string;
  designs: { name: string } | null;
}

export default async function Page() {
  if (!isSupabaseConfigured) redirect("/connexion?suite=/app/exports");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion?suite=/app/exports");

  const db = supabase as unknown as CloudClient;
  const { data } = await db
    .from("exports")
    .select("id, format, created_at, designs(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data as Row[] | null) ?? [];

  return (
    <div className="max-w-4xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-extrabold">Exports</h1>
        <p className="text-muted-foreground text-sm">
          L&apos;historique de vos exports. Les exports PNG et JPG se font depuis le studio ; les
          exports PDF, GLB et patrons (PDF / PLT) arrivent avec le traitement serveur.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="border-border bg-surface shadow-card flex items-center gap-4 rounded-xl border p-6">
          <FileDown className="text-muted-foreground size-8 shrink-0" aria-hidden />
          <p className="text-muted-foreground text-sm">
            Aucun export enregistré pour l&apos;instant. Utilisez le bouton « Exporter » du studio
            pour télécharger votre design en PNG ou JPG.
          </p>
        </div>
      ) : (
        <ul className="border-border bg-surface shadow-card divide-border divide-y rounded-xl border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <Download className="text-action size-5" aria-hidden />
              <span className="flex-1 truncate font-medium">
                {r.designs?.name ?? "Design supprimé"}
              </span>
              <Badge variant="blue">{r.format.toUpperCase()}</Badge>
              <span className="text-muted-foreground text-sm">
                {fmt.format(new Date(r.created_at))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
