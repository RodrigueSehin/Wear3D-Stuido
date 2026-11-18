"use client";

import type { GarmentViewerHandle } from "@wear3d/garment-engine/react";
import { Badge, Button, cn } from "@wear3d/ui";
import {
  ArrowLeft,
  Check,
  CloudOff,
  Download,
  Loader2,
  Redo2,
  Share2,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useState, type RefObject } from "react";
import { useStudio, type SaveState } from "@/lib/studio/store";

const SAVE_LABEL: Record<SaveState, { label: string; icon: typeof Check; tone: string }> = {
  idle: { label: "Brouillon", icon: Check, tone: "text-muted-foreground" },
  saving: { label: "En cours…", icon: Loader2, tone: "text-muted-foreground" },
  saved: { label: "Sauvegardé", icon: Check, tone: "text-success" },
  offline: { label: "Hors ligne", icon: CloudOff, tone: "text-warning" },
  error: { label: "Erreur de sauvegarde", icon: TriangleAlert, tone: "text-danger" },
};

export function TopBar({ viewerRef }: { viewerRef: RefObject<GarmentViewerHandle | null> }) {
  const name = useStudio((s) => s.name);
  const rename = useStudio((s) => s.rename);
  const mode = useStudio((s) => s.mode);
  const setMode = useStudio((s) => s.setMode);
  const canUndo = useStudio((s) => s.canUndo);
  const canRedo = useStudio((s) => s.canRedo);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const saveState = useStudio((s) => s.saveState);
  const [exporting, setExporting] = useState(false);
  const save = SAVE_LABEL[saveState];

  async function exportPng() {
    if (!viewerRef.current) return;
    setExporting(true);
    try {
      const blob = await viewerRef.current.capture(2048);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(name) || "wear3d-design"}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  }

  return (
    <header className="border-border bg-surface flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:gap-3 sm:px-4">
      <Link
        href="/app"
        className="hover:bg-surface-muted rounded-md p-2"
        aria-label="Retour au tableau de bord"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </Link>
      <input
        value={name}
        onChange={(e) => rename(e.target.value)}
        aria-label="Nom du design"
        className="hover:border-border focus:border-action w-28 min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold focus:outline-none sm:w-48"
        maxLength={80}
      />
      <Badge variant="outline" className="hidden sm:inline-flex">
        Brouillon
      </Badge>
      <span
        className={cn("hidden items-center gap-1 text-xs md:inline-flex", save.tone)}
        aria-live="polite"
      >
        <save.icon
          className={cn("size-3.5", saveState === "saving" && "animate-spin")}
          aria-hidden
        />
        {save.label}
      </span>

      <div
        className="bg-surface-muted mx-auto flex rounded-full p-1 text-sm"
        role="tablist"
        aria-label="Mode"
      >
        {(["design", "simulation"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-full px-3 py-1 font-medium sm:px-4",
              mode === m
                ? "bg-brand-navy-900 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "design" ? "Design" : "Simulation"}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Annuler (Ctrl+Z)"
      >
        <Undo2 aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Rétablir (Ctrl+Y)"
      >
        <Redo2 aria-hidden />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Partage par lien : phase 5"
        className="hidden lg:inline-flex"
      >
        <Share2 aria-hidden /> Partager
      </Button>
      <Button size="sm" onClick={exportPng} disabled={exporting}>
        {exporting ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
        <span className="hidden sm:inline">Exporter</span>
      </Button>
    </header>
  );
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
