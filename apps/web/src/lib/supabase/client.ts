import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@wear3d/db";
import { requireSupabaseEnv } from "@/env";

/** Client Supabase pour les composants client (clé publique uniquement). */
export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
