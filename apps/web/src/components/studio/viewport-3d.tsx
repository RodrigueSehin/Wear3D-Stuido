"use client";

import {
  isWebGL2Available,
  VIEW_AZIMUTH,
  VIEW_LABELS,
  type ViewPreset,
} from "@wear3d/garment-engine";
import {
  createAtlasTexture,
  GarmentViewer,
  type GarmentViewerHandle,
} from "@wear3d/garment-engine/react";
import { cn } from "@wear3d/ui";
import { ChevronLeft, ChevronRight, MonitorX, Rotate3d } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { composeInto, getAtlasCanvas, useAtlas } from "@/lib/studio/atlas";
import { endDrag, surfaceDown, surfaceMove } from "@/lib/studio/interaction";
import { useStudio } from "@/lib/studio/store";
import { viewerBridge } from "@/lib/studio/viewer-bridge";

const THUMB_VIEWS: ViewPreset[] = ["front", "three-quarter", "back", "left"];

/** Vue la plus proche d'un azimut (pour la miniature active). */
function nearestView(azimuth: number): ViewPreset {
  let best: ViewPreset = "front";
  let bestD = Infinity;
  for (const v of THUMB_VIEWS) {
    const d = Math.abs(((azimuth - VIEW_AZIMUTH[v] + 540) % 360) - 180);
    if (d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best;
}

/**
 * Viewport 3D (chargé à la demande : embarque three.js). Podium, miniatures de vues
 * à droite, curseur 360° en bas, comme la maquette Studio.
 */
export default function Viewport3D() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const lighting = useStudio((s) => s.lighting);
  const hoveredZone = useStudio((s) => s.hoveredZone);
  const selectedZone = useStudio((s) => s.selectedZone);
  const selection = useStudio((s) => s.selection);
  const tool = useStudio((s) => s.tool);
  const preview = useStudio((s) => s.preview);
  const showPodium = useStudio((s) => s.showPodium);
  const dragging = useStudio((s) => s.dragging);
  const atlasVersion = useAtlas((s) => s.version);

  const viewer = useRef<GarmentViewerHandle | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [azimuth, setAzimuth] = useState(0);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const raf = useRef(0);

  useEffect(() => setWebgl(isWebGL2Available()), []);

  const texture = useMemo(
    () => (typeof document === "undefined" ? null : createAtlasTexture(getAtlasCanvas())),
    [],
  );
  useEffect(() => () => texture?.dispose(), [texture]);

  // Le pont permet à la barre supérieure et à la barre du bas de piloter la vue.
  const setViewerRef = useCallback(
    (handle: GarmentViewerHandle | null) => {
      viewer.current = handle;
      viewerBridge.viewer = handle;
      viewerBridge.renderHd =
        handle && texture
          ? async () => {
              const s = useStudio.getState();
              if (!s.doc || !s.definition) throw new Error("Aucun design");
              const hd = document.createElement("canvas");
              hd.width = hd.height = 4096;
              composeInto(hd, s.doc, s.definition);
              texture.image = hd;
              texture.needsUpdate = true;
              try {
                return await handle.capture(3840);
              } finally {
                texture.image = getAtlasCanvas();
                texture.needsUpdate = true;
              }
            }
          : null;
    },
    [texture],
  );
  useEffect(
    () => () => {
      viewerBridge.viewer = null;
      viewerBridge.renderHd = null;
    },
    [],
  );

  // Miniatures des vues, régénérées après les modifications.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (viewer.current) setThumbs(viewer.current.snapshot(THUMB_VIEWS));
    }, 700);
    return () => clearTimeout(t);
  }, [ready, atlasVersion, lighting, doc?.zones]);

  useEffect(() => {
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  const onAzimuth = useCallback((deg: number) => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setAzimuth(Math.round(deg)));
  }, []);

  // Vue courante pour la barre du bas (Face, Dos, Gauche, Droite).
  useEffect(() => {
    const dist = (target: number) => Math.abs(((azimuth - target + 540) % 360) - 180);
    const bar: ViewPreset =
      dist(90) < 45 ? "left" : dist(180) < 45 ? "back" : dist(270) < 45 ? "right" : "front";
    useStudio.getState().setActiveView(bar);
  }, [azimuth]);

  const materials = useMemo(
    () => Object.fromEntries(Object.entries(doc?.zones ?? {}).map(([z, v]) => [z, v.material])),
    [doc?.zones],
  );

  if (webgl === false) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <MonitorX className="text-muted-foreground size-10" aria-hidden />
        <p className="font-display text-lg font-bold">Affichage 3D indisponible</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Votre navigateur ne prend pas en charge WebGL 2. Utilisez une version récente de Chrome,
          Edge, Firefox ou Safari, ou passez en vue 2D.
        </p>
      </div>
    );
  }

  const activeView = nearestView(azimuth);
  const editing = !preview;
  const highlight = editing && selection?.kind === "base" ? selectedZone : null;

  return (
    <div className="relative min-h-0 flex-1">
      {definition && texture && webgl && (
        <GarmentViewer
          ref={setViewerRef}
          className={cn(
            "!absolute inset-0",
            hoveredZone && editing && "cursor-pointer",
            dragging && "cursor-grabbing",
          )}
          definition={definition}
          atlas={texture}
          atlasVersion={atlasVersion}
          materials={materials}
          lighting={lighting}
          hoveredZone={editing ? hoveredZone : null}
          selectedZone={highlight}
          tool={preview ? "orbit" : tool}
          showPodium={showPodium}
          autoRotate={preview}
          interacting={dragging}
          onSurfaceDown={surfaceDown}
          onSurfaceMove={surfaceMove}
          onHoverZone={(z) => useStudio.getState().setHoveredZone(z)}
          onAzimuthChange={onAzimuth}
          onMissed={() => editing && useStudio.getState().select(null)}
          onReady={() => setReady(true)}
        />
      )}

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="h-72 w-56 animate-pulse rounded-[42%_42%_14%_14%] bg-[#0a1638]/10" />
          <p className="text-muted-foreground text-sm">Chargement du modèle…</p>
        </div>
      )}

      {/* Miniatures des vues (colonne droite). */}
      {!preview && (
        <div
          className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-3"
          aria-label="Vues"
        >
          {THUMB_VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              title={VIEW_LABELS[v]}
              aria-label={`Vue ${VIEW_LABELS[v]}`}
              aria-pressed={activeView === v}
              onClick={() => viewer.current?.setView(v)}
              className={cn(
                "hover:border-action/60 flex h-[86px] w-[76px] items-center justify-center overflow-hidden rounded-xl border-2 bg-white/70 shadow-sm backdrop-blur transition",
                activeView === v ? "border-action" : "border-white",
              )}
            >
              {thumbs[v] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[v]} alt="" className="size-full object-cover" />
              ) : (
                <span className="h-12 w-9 rounded-md bg-[#0a1638]/10" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Rotation 360°. */}
      <div className="absolute bottom-4 left-1/2 flex w-[300px] -translate-x-1/2 flex-col items-center gap-1">
        <span className="font-display flex items-center gap-1.5 text-lg font-bold text-[#0b1530]">
          <Rotate3d className="size-5" aria-hidden /> 360°
        </span>
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            aria-label="Pivoter à gauche"
            onClick={() => viewer.current?.setAzimuth(azimuth - 45)}
            className="hover:bg-surface-muted flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <input
            type="range"
            min={0}
            max={359}
            value={azimuth}
            aria-label="Rotation du vêtement"
            onChange={(e) => {
              const v = Number(e.target.value);
              setAzimuth(v);
              viewer.current?.setAzimuth(v, false);
            }}
            className="studio-range w-full"
          />
          <button
            type="button"
            aria-label="Pivoter à droite"
            onClick={() => viewer.current?.setAzimuth(azimuth + 45)}
            className="hover:bg-surface-muted flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
