import { Bell, CircleHelp, Search } from "lucide-react";
import { AppSidebar } from "@/components/app/app-sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
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
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
