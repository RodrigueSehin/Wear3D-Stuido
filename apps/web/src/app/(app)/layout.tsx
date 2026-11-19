import { Bell, CircleHelp, LogOut, Search } from "lucide-react";
import { isSupabaseConfigured } from "@/env";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app/app-sidebar";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = isSupabaseConfigured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const name =
    (user?.user_metadata?.first_name as string | undefined) ?? user?.email?.split("@")[0] ?? null;
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-surface/70 flex items-center justify-end gap-4 border-b px-4 py-3 sm:px-6">
          <label className="relative mr-auto hidden w-full max-w-md md:block">
            <span className="sr-only">Rechercher</span>
            <Search
              className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Rechercher un projet, un modèle, une ressource…"
              className="border-border bg-surface focus-visible:ring-ring h-10 w-full rounded-full border pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2"
            />
          </label>
          <button
            type="button"
            className="hover:bg-surface-muted rounded-full p-2"
            aria-label="Notifications"
          >
            <Bell className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className="hover:bg-surface-muted rounded-full p-2"
            aria-label="Aide"
          >
            <CircleHelp className="size-5" aria-hidden />
          </button>
          {user && (
            <form action={signOut} className="flex items-center gap-2">
              <span
                className="bg-action text-action-foreground grid size-8 place-items-center rounded-full text-sm font-semibold uppercase"
                title={user.email ?? undefined}
              >
                {name?.[0] ?? "?"}
              </span>
              <button
                type="submit"
                className="hover:bg-surface-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                aria-label="Se déconnecter"
              >
                <LogOut className="size-4" aria-hidden /> Déconnexion
              </button>
            </form>
          )}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
