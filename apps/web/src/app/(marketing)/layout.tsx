import { Logo } from "@wear3d/ui";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-hero">
        <MarketingNav />
      </div>
      <main className="flex-1">{children}</main>
      <footer className="bg-brand-navy-950 text-white/70">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-10 text-sm sm:flex-row sm:items-center sm:px-6">
          <Logo inverted />
          <p>© {new Date().getFullYear()} WEAR3D STUDIO</p>
        </div>
      </footer>
    </div>
  );
}
