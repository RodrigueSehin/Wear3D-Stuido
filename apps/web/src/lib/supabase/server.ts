import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@wear3d/db";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "@/env";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Agit au nom de l'utilisateur : la RLS s'applique (CDC S-02).
 */
export async function createClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Appel depuis un Server Component : le middleware rafraîchit la session.
        }
      },
    },
  });
}
