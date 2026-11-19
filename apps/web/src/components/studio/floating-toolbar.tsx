"use client";

import { cn } from "@wear3d/ui";
import {
  Expand,
  Move,
  MousePointer2,
  Move3d,
  RotateCw,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
import { useStudio, type ViewerTool } from "@/lib/studio/store";
import { flatBridge, viewerBridge } from "@/lib/studio/viewer-bridge";

const TOOLS: { id: ViewerTool; label: string; icon: LucideIcon }[] = [
  { id: "select", label: "Sélection", icon: MousePointer2 },
  { id: "move", label: "Déplacer l'élément", icon: Move3d },
  { id: "pan", label: "Panoramique", icon: Move },
  { id: "orbit", label: "Rotation de la vue", icon: RotateCw },
];

/** Barre d'outils verticale flottante (maquette Studio). */
export function FloatingToolbar() {
  const tool = useStudio((s) => s.tool);
  const setTool = useStudio((s) => s.setTool);
  const viewMode = useStudio((s) => s.viewMode);
  const btn =
    "flex size-10 items-center justify-center rounded-xl text-[#0b1530] transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";
  return (
    <div
      role="toolbar"
      aria-label="Outils de la vue"
      aria-orientation="vertical"
      className="flex w-14 flex-col items-center gap-2 rounded-2xl border border-white/70 bg-white/90 py-2 shadow-[0_8px_30px_rgba(15,35,90,0.10)] backdrop-blur"
    >
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={tool === id}
          disabled={viewMode === "2d" && id === "orbit"}
          onClick={() => setTool(id)}
          className={cn(btn, tool === id && "bg-action hover:bg-action text-white")}
        >
          <Icon className="size-5" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        title="Zoom avant"
        aria-label="Zoom avant"
        onClick={() => (viewMode === "2d" ? flatBridge.zoom?.(1) : viewerBridge.viewer?.zoom(1))}
        className={btn}
      >
        <ZoomIn className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        title="Zoom arrière"
        aria-label="Zoom arrière"
        onClick={() => (viewMode === "2d" ? flatBridge.zoom?.(-1) : viewerBridge.viewer?.zoom(-1))}
        className={btn}
      >
        <ZoomOut className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        title="Plein écran"
        aria-label="Plein écran"
        onClick={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen?.();
        }}
        className={btn}
      >
        <Expand className="size-5" aria-hidden />
      </button>
    </div>
  );
}
