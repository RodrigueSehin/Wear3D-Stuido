import "server-only";
import { isPlanId, PLAN_QUOTAS, type PlanId, type PlanQuota } from "@wear3d/billing";
import { isSupabaseConfigured } from "@/env";
import { previewColors } from "./preview";
import { createClient } from "@/lib/supabase/server";
import type { CloudClient } from "@/lib/studio/cloud";

export interface RecentDesign {
  id: string;
  name: string;
  updatedAt: string;
  body: string;
  sleeves: string;
  collar: string;
}

export interface DashboardData {
  userId: string;
  displayName: string;
  workspaceId: string | null;
  plan: PlanId;
  renewal: string | null;
  quota: PlanQuota;
  designCount: number;
  creditsBalance: number;
  storageUsed: number;
  assetCount: number;
  recent: RecentDesign[];
}

const sum = (rows: unknown, key: string) =>
  ((rows as Record<string, number>[] | null) ?? []).reduce((n, r) => n + (Number(r[key]) || 0), 0);

/**
 * Données du tableau de bord pour l'utilisateur connecté (la RLS limite tout à ses espaces).
 * Tolérant : une table absente ou une erreur réseau donne des zéros, jamais une page cassée.
 */
export async function loadDashboard(): Promise<DashboardData | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const db = supabase as unknown as CloudClient;
  const safe = async <T>(p: PromiseLike<{ data: T | null; error: unknown }>, fallback: T) => {
    try {
      const r = await p;
      return r.error || r.data === null ? fallback : r.data;
    } catch {
      return fallback;
    }
  };

  const profile = await safe<{ display_name: string } | null>(
    db.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    null,
  );
  const member = await safe<{ workspace_id: string } | null>(
    db
      .from("workspace_members")
      .select("workspace_id, workspaces!inner(kind)")
      .eq("user_id", user.id)
      .eq("workspaces.kind", "personal")
      .limit(1)
      .maybeSingle(),
    null,
  );
  const workspaceId = member?.workspace_id ?? null;

  const subscription = workspaceId
    ? await safe<{ plan_code: string; period_end: string | null } | null>(
        db
          .from("subscriptions")
          .select("plan_code, period_end")
          .eq("workspace_id", workspaceId)
          .in("status", ["active", "trialing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        null,
      )
    : null;
  const plan: PlanId = isPlanId(subscription?.plan_code) ? subscription.plan_code : "free";

  const countRes = await db
    .from("designs")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  const recentRows = await safe<
    { id: string; name: string; updated_at: string; document: unknown }[]
  >(
    db
      .from("designs")
      .select("id, name, updated_at, document")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(4),
    [],
  );
  const assets = await safe<{ size_bytes: number }[]>(db.from("assets").select("size_bytes"), []);
  const ledger = workspaceId
    ? await safe<{ delta: number }[]>(
        db.from("credit_ledger").select("delta").eq("workspace_id", workspaceId),
        [],
      )
    : [];

  return {
    userId: user.id,
    displayName:
      profile?.display_name ??
      (user.user_metadata?.first_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "",
    workspaceId,
    plan,
    renewal: subscription?.period_end ?? null,
    quota: PLAN_QUOTAS[plan],
    designCount: (countRes as { count?: number | null }).count ?? 0,
    creditsBalance: sum(ledger, "delta"),
    storageUsed: sum(assets, "size_bytes"),
    assetCount: assets.length,
    recent: recentRows.map((r) => ({
      id: r.id,
      name: r.name,
      updatedAt: r.updated_at,
      ...previewColors(r.document),
    })),
  };
}
