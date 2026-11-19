"use client";

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Logo,
} from "@wear3d/ui";
import {
  ChevronDown,
  CloudAlert,
  CloudCheck,
  CloudOff,
  Eye,
  EyeOff,
  FileBox,
  FileImage,
  FileText,
  ImageIcon,
  Loader2,
  Pencil,
  Redo2,
  Share2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { EXPORT_RESOLUTIONS, JPG_QUALITY, renderSizeOf, useSettings } from "@/lib/studio/settings";
import { resolveBackdropUrl } from "@/lib/studio/scene-backdrop";
import { sceneFilter } from "@/lib/studio/scenes";
import { useStudio, type SaveState } from "@/lib/studio/store";
import { captureImage, downloadBlob, slugify, type ExportFormat } from "@/lib/studio/viewer-bridge";

const time = (d: Date | null) =>
  d ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

function SaveStatus() {
  const saveState = useStudio((s) => s.saveState);
  const lastSavedAt = useStudio((s) => s.lastSavedAt);
  const map: Record<SaveState, { icon: typeof CloudCheck; label: string; tone: string }> = {
    idle: { icon: CloudCheck, label: "Brouillon", tone: "text-emerald-400" },
    saving: { icon: Loader2, label: "Enregistrement…", tone: "text-white/80" },
    saved: {
      icon: CloudCheck,
      label: `Enregistré à ${time(lastSavedAt)}`,
      tone: "text-emerald-400",
    },
    offline: { icon: CloudOff, label: "Hors ligne", tone: "text-amber-400" },
    error: { icon: CloudAlert, label: "Erreur d'enregistrement", tone: "text-red-400" },
  };
  const s = map[saveState];
  return (
    <span
      className="hidden h-10 items-center gap-2 rounded-full bg-white/[0.07] px-4 text-sm text-white/90 lg:inline-flex"
      aria-live="polite"
    >
      <s.icon
        className={cn("size-5", s.tone, saveState === "saving" && "animate-spin")}
        aria-hidden
      />
      {s.label}
    </span>
  );
}

function DesignName() {
  const name = useStudio((s) => s.name);
  const rename = useStudio((s) => s.rename);
  const input = useRef<HTMLInputElement>(null);
  return (
    <label className="hidden h-11 min-w-0 items-center gap-3 rounded-xl border border-white/25 bg-white/[0.04] px-4 text-white focus-within:border-white/60 md:inline-flex">
      <span className="sr-only">Nom du design</span>
      <input
        ref={input}
        value={name}
        onChange={(e) => rename(e.target.value)}
        maxLength={80}
        className="w-36 min-w-0 bg-transparent text-[17px] font-medium outline-none xl:w-56"
      />
      <button type="button" onClick={() => input.current?.select()} aria-label="Renommer">
        <Pencil className="size-4 text-white/80" aria-hidden />
      </button>
    </label>
  );
}

const ghost =
  "inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 px-3 text-[15px] font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-50 2xl:px-4";

export function TopBar() {
  const canUndo = useStudio((s) => s.canUndo);
  const canRedo = useStudio((s) => s.canRedo);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const preview = useStudio((s) => s.preview);
  const setPreview = useStudio((s) => s.setPreview);
  const name = useStudio((s) => s.name);
  const [busy, setBusy] = useState<string | null>(null);

  const settings = useSettings();
  const exportLabel =
    EXPORT_RESOLUTIONS.find((r) => r.width === settings.exportWidth)?.label ??
    `${settings.exportWidth} px`;

  /** « Rendu HD » : taille et qualité des Paramètres ; export : résolution par défaut. */
  async function run(kind: string, format: ExportFormat, hd = false) {
    setBusy(kind);
    try {
      const quality = JPG_QUALITY[settings.quality];
      // Scène : décor (si inclus à l'export) et ajustements appliqués à l'image.
      const scene = useStudio.getState().doc?.scene;
      const url = scene?.includeInExport ? await resolveBackdropUrl(scene.id) : null;
      const sceneOpts = {
        filter: sceneFilter(scene),
        ...(url && scene ? { backdrop: { url, blur: scene.backgroundBlur } } : {}),
      };
      const size = renderSizeOf(settings.renderSize);
      const blob = hd
        ? await captureImage(format, {
            width: size.w,
            height: size.h,
            hd: true,
            quality,
            ...sceneOpts,
          })
        : await captureImage(format, {
            width: settings.exportWidth,
            hd: settings.exportWidth > 2048,
            quality,
            ...sceneOpts,
          });
      const suffix = hd ? `-${size.w}x${size.h}` : `-${settings.exportWidth}`;
      downloadBlob(blob, `${slugify(name) || "wear3d-design"}${suffix}.${format}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <header className="flex h-[70px] shrink-0 items-center gap-3 bg-gradient-to-r from-[#060d26] via-[#0a1638] to-[#0b1a45] px-4 text-white">
      <Link href="/app" aria-label="Retour au tableau de bord" className="shrink-0">
        <Logo inverted className="[&>span:last-child]:text-base [&_svg]:h-9 [&_svg]:w-14" />
      </Link>
      <span className="mx-2 hidden h-9 w-px bg-white/20 sm:block" aria-hidden />
      <h1 className="font-display hidden text-2xl font-bold sm:block">Studio 3D</h1>
      <span className="ml-3" />
      <DesignName />

      <div className="ml-auto flex items-center gap-3">
        <SaveStatus />
        <div className="flex h-11 items-center rounded-xl bg-white/10 px-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Annuler (Ctrl+Z)"
            className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-40"
          >
            <Undo2 className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Rétablir (Ctrl+Y)"
            className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-40"
          >
            <Redo2 className="size-5" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className={ghost}
          onClick={() => setPreview(!preview)}
          aria-pressed={preview}
        >
          {preview ? (
            <EyeOff className="size-5" aria-hidden />
          ) : (
            <Eye className="size-5" aria-hidden />
          )}
          <span className="hidden xl:inline">{preview ? "Quitter l'aperçu" : "Aperçu"}</span>
        </button>
        <button
          type="button"
          className={ghost}
          onClick={() => run("hd", "png", true)}
          disabled={busy !== null}
        >
          {busy === "hd" ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <ImageIcon className="size-5" aria-hidden />
          )}
          <span className="hidden xl:inline">Rendu HD</span>
        </button>
        <button
          type="button"
          className={cn(ghost, "hidden lg:inline-flex")}
          disabled
          title="Partage par lien : phase 5"
        >
          <Share2 className="size-5" aria-hidden />
          <span className="hidden xl:inline">Partager</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={busy !== null}
              className="bg-action hover:bg-action-hover inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
            >
              {busy && busy !== "hd" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Exporter
              <ChevronDown className="size-4" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem onSelect={() => void run("default", settings.exportFormat)}>
              <FileImage /> Export rapide — {settings.exportFormat.toUpperCase()} · {exportLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Format d&apos;export</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => void run("png", "png")}>
              <FileImage /> Image PNG (fond transparent)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void run("jpg", "jpg")}>
              <FileImage /> Image JPG
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <FileText /> PDF fiche produit — phase 5
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <FileBox /> Modèle 3D GLB — V1.1
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
