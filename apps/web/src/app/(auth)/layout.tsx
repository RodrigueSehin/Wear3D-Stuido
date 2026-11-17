import { Logo } from "@wear3d/ui";
import Link from "next/link";

/** Mise en page scindée des maquettes Connexion / Inscription. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="bg-hero hidden flex-col justify-between p-12 text-white lg:flex">
        <Link href="/" aria-label="Accueil">
          <Logo inverted />
        </Link>
        <div>
          <h2 className="text-5xl font-extrabold leading-tight">
            Votre espace <span className="text-brand-sky">WEAR3D STUDIO</span>
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Accédez à vos projets, créations, ressources et à l&apos;éditeur 3D.
          </p>
        </div>
        <span />
      </aside>
      <main className="bg-background flex items-center justify-center p-4 sm:p-8">
        <div className="border-border bg-surface shadow-card w-full max-w-lg rounded-xl border p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
