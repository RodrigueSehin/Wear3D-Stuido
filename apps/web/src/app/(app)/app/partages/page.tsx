import { Badge } from "@wear3d/ui";
import { Link2, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/env";
import { createClient } from "@/lib/supabase/server";
import type { CloudClient } from "@/lib/studio/cloud";

export const metadata: Metadata = { title: "Projets partagés" };

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

interface Row {
  id: string;
  token: string;
  can_comment: boolean;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  designs: { name: string } | null;
}

export default async function Page() {
  if (!isSupabaseConfigured) redirect("/connexion?suite=/app/partages");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion?suite=/app/partages");

  const db = supabase as unknown as CloudClient;
  const { data } = await db
    .from("share_links")
    .select("id, token, can_comment, expires_at, revoked_at, created_at, designs(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data as Row[] | null) ?? [];

  return (
    <div className="max-w-4xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-extrabold">Projets partagés</h1>
        <p className="text-muted-foreground text-sm">
          Les liens de partage de vos créations. La création de liens et le visualiseur public
          arrivent prochainement.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="border-border bg-surface shadow-card flex items-center gap-4 rounded-xl border p-6">
          <Users className="text-muted-foreground size-8 shrink-0" aria-hidden />
          <p className="text-muted-foreground text-sm">
            Vous n&apos;avez partagé aucune création pour l&apos;instant.
          </p>
        </div>
      ) : (
        <ul className="border-border bg-surface shadow-card divide-border divide-y rounded-xl border">
          {rows.map((r) => {
            const expired = r.expires_at && new Date(r.expires_at) < new Date();
            const inactive = Boolean(r.revoked_at) || Boolean(expired);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Link2 className="text-action size-5" aria-hidden />
                <span className="flex-1 truncate font-medium">
                  {r.designs?.name ?? "Design supprimé"}
                </span>
                {r.can_comment && <Badge variant="violet">Commentaires</Badge>}
                <Badge variant={inactive ? "outline" : "success"}>
                  {r.revoked_at ? "Révoqué" : expired ? "Expiré" : "Actif"}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {fmt.format(new Date(r.created_at))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
