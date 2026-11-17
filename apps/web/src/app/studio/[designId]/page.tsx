import { Badge, Button, Logo } from "@wear3d/ui";
import {
  ArrowLeft,
  Box,
  Hash,
  ImageIcon,
  Palette,
  Redo2,
  Share2,
  Sparkles,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Studio 3D" };

const TOOLS = [
  { icon: Box, label: "Modèle" },
  { icon: Palette, label: "Couleurs" },
  { icon: ImageIcon, label: "Textures" },
  { icon: Upload, label: "Logos" },
  { icon: Type, label: "Textes" },
  { icon: Hash, label: "Numéros" },
  { icon: Sparkles, label: "IA" },
];

/** Squelette de la mise en page du studio (maquette « Studio ») — moteur en phase 1. */
export default async function StudioPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  return (
    <div className="flex h-full flex-col">
      <header className="border-border bg-surface flex items-center gap-4 border-b px-4 py-2">
        <Link href="/app" className="hover:bg-surface-muted rounded-md p-2" aria-label="Retour">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <span className="font-semibold">Studio 3D</span>
        <Badge variant="outline">Brouillon</Badge>
        <div
          className="bg-surface-muted mx-auto hidden rounded-full p-1 text-sm sm:flex"
          role="tablist"
        >
          <span
            role="tab"
            aria-selected
            className="bg-brand-navy-900 rounded-full px-4 py-1 text-white"
          >
            Design
          </span>
          <span role="tab" aria-selected={false} className="text-muted-foreground px-4 py-1">
            Simulation
          </span>
        </div>
        <Button variant="ghost" size="icon" aria-label="Annuler">
          <Undo2 aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Rétablir">
          <Redo2 aria-hidden />
        </Button>
        <Button variant="outline" size="sm">
          <Share2 aria-hidden /> Partager
        </Button>
        <Button size="sm">Exporter</Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          className="bg-brand-navy-900 flex w-16 flex-col items-center gap-1 py-3"
          aria-label="Outils"
        >
          <Logo inverted className="mb-3 scale-75 [&>span:last-child]:hidden" />
          {TOOLS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="flex w-14 flex-col items-center gap-1 rounded-md py-2 text-[11px] text-white/80 hover:bg-white/10"
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </nav>
        <section className="bg-viewport text-muted-foreground flex flex-1 items-center justify-center">
          <p className="text-center text-sm">
            Viewport 3D — phase 1
            <br />
            <span className="font-mono text-xs">design : {designId}</span>
          </p>
        </section>
        <aside className="border-border bg-surface hidden w-[300px] border-l p-4 xl:block">
          <div className="border-border flex gap-6 border-b text-sm font-medium">
            <span className="text-muted-foreground pb-2">Personnalisation</span>
            <span className="border-action text-action border-b-2 pb-2">Calques</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
