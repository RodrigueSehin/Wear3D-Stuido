import { Badge, Button } from "@wear3d/ui";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Générateur IA" };

export default function Page() {
  return (
    <div className="max-w-3xl space-y-5 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold">Générateur IA</h1>
      <div className="from-accent-violet-soft to-surface border-border rounded-2xl border bg-gradient-to-br p-8">
        <Badge variant="violet">Bientôt disponible</Badge>
        <div className="mt-4 flex items-start gap-4">
          <span className="bg-accent-violet grid size-12 shrink-0 place-items-center rounded-xl text-white">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-extrabold">Décrivez votre idée, l&apos;IA dessine</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Concepts de vêtements, motifs raccordables et palettes de couleurs générés en quelques
              secondes, puis appliqués directement sur votre modèle 3D. Les crédits IA de votre
              formule sont déjà comptabilisés dans votre tableau de bord.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/studio/nouveau">Créer sans IA dans le studio</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/galerie">Partir d&apos;une maquette</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
