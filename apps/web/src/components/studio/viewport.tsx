"use client";

import {
  atlasUvToZone,
  composeAtlas,
  pickLayer,
  zoneRectPx,
  type ZoneRect,
} from "@wear3d/editor-2d";
import {
  ATLAS_SIZE,
  isWebGL2Available,
  VIEW_LABELS,
  type ViewPreset,
} from "@wear3d/garment-engine";
import {
  createAtlasTexture,
  GarmentViewer,
  type GarmentViewerHandle,
  type SurfaceHit,
} from "@wear3d/garment-engine/react";
import { cn } from "@wear3d/ui";
import { MonitorX, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ensureImage, getCachedImage } from "@/lib/studio/assets";
import { loadStudioFonts, resolveFont, resolveNumberFont } from "@/lib/studio/fonts";
import { useStudio } from "@/lib/studio/store";

/**
 * Viewport 3D. Ce module embarque three.js : il est chargé à la demande par le
 * studio (next/dynamic, sans SSR) pour alléger le premier affichage.
 */
const VIEWS: ViewPreset[] = ["front", "three-quarter", "left", "back", "right"];

export function Viewport({ viewerRef }: { viewerRef: RefObject<GarmentViewerHandle | null> }) {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const mode = useStudio((s) => s.mode);
  const lighting = useStudio((s) => s.lighting);
  const hoveredZone = useStudio((s) => s.hoveredZone);
  const selectedZone = useStudio((s) => s.selectedZone);

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [assetsVersion, setAssetsVersion] = useState(0);
  const [atlasVersion, setAtlasVersion] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    setWebgl(isWebGL2Available());
    void loadStudioFonts().then(() => setFontsReady(true));
  }, []);

  // Canvas d'atlas et texture : créés une fois.
  const atlas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = ATLAS_SIZE.studio;
    return { canvas, texture: createAtlasTexture(canvas) };
  }, []);
  useEffect(() => () => atlas?.texture.dispose(), [atlas]);

  const zones: ZoneRect[] = useMemo(
    () => definition?.zones.map((z) => ({ code: z.code, ...z.uvRect })) ?? [],
    [definition],
  );

  // Charge les images référencées par le document.
  useEffect(() => {
    if (!doc) return;
    const missing = doc.layers.flatMap((l) =>
      l.type === "image" && !getCachedImage(l.assetId) ? [l.assetId] : [],
    );
    if (!missing.length) return;
    void Promise.all(missing.map(ensureImage)).then(() => setAssetsVersion((v) => v + 1));
  }, [doc]);

  // Recompose l'atlas à chaque changement du document.
  useEffect(() => {
    if (!atlas || !doc) return;
    const ctx = atlas.canvas.getContext("2d");
    if (!ctx) return;
    composeAtlas(ctx, doc, {
      atlasSize: ATLAS_SIZE.studio,
      zones,
      resolveImage: getCachedImage,
      resolveFont,
      resolveNumberFont,
      background: doc.zones[zones[0]?.code ?? ""]?.color,
    });
    setAtlasVersion((v) => v + 1);
  }, [atlas, doc, zones, fontsReady, assetsVersion]);

  const zoneRect = useCallback((code: string) => zones.find((z) => z.code === code), [zones]);
  const aspect = useCallback((assetId: string) => {
    const img = getCachedImage(assetId);
    return img ? img.width / img.height : undefined;
  }, []);

  const onSurfaceDown = useCallback(
    (hit: SurfaceHit) => {
      const s = useStudio.getState();
      if (!s.doc || s.mode !== "design") return false;
      const rect = zoneRect(hit.zone);
      if (!rect) return false;
      const local = atlasUvToZone(rect, hit.u, hit.v);
      const layer = pickLayer(
        s.doc.layers,
        hit.zone,
        zoneRectPx(rect, ATLAS_SIZE.studio),
        local,
        aspect,
      );
      if (layer) {
        s.selectLayer(layer.id);
        drag.current = {
          id: layer.id,
          dx: local.x - layer.transform.x,
          dy: local.y - layer.transform.y,
        };
        setDragging(true);
        return true; // bloque la rotation caméra pendant le glisser
      }
      s.selectLayer(null);
      s.selectZone(hit.zone);
      return false;
    },
    [zoneRect, aspect],
  );

  const onSurfaceMove = useCallback(
    (hits: SurfaceHit[]) => {
      const d = drag.current;
      if (!d) return;
      const s = useStudio.getState();
      const layer = s.doc?.layers.find((l) => l.id === d.id);
      if (!layer) return;
      // Le calque reste dans sa zone : seuls les points de cette zone le déplacent.
      const hit = hits.find((h) => h.zone === layer.zone);
      const rect = hit && zoneRect(hit.zone);
      if (!hit || !rect) return;
      const local = atlasUvToZone(rect, hit.u, hit.v);
      const x = clamp(local.x - d.dx);
      const y = clamp(local.y - d.dy);
      s.updateLayer(d.id, (l) => ({ ...l, transform: { ...l.transform, x, y } }), `drag:${d.id}`);
    },
    [zoneRect],
  );

  useEffect(() => {
    const end = () => {
      if (!drag.current) return;
      drag.current = null;
      setDragging(false);
      useStudio.getState().seal();
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const materials = useMemo(
    () => Object.fromEntries(Object.entries(doc?.zones ?? {}).map(([z, v]) => [z, v.material])),
    [doc?.zones],
  );

  if (webgl === false) {
    return (
      <div className="bg-viewport flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <MonitorX className="text-muted-foreground size-10" aria-hidden />
        <p className="font-display text-lg font-bold">Affichage 3D indisponible</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Votre navigateur ne prend pas en charge WebGL 2. Utilisez une version récente de Chrome,
          Edge, Firefox ou Safari, ou activez l&apos;accélération matérielle.
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn("bg-viewport relative min-w-0 flex-1", dragging && "cursor-grabbing")}
      aria-label="Vue 3D du vêtement"
    >
      {definition && atlas && webgl && (
        <GarmentViewer
          ref={viewerRef}
          className={cn("!absolute inset-0", hoveredZone && mode === "design" && "cursor-pointer")}
          definition={definition}
          atlas={atlas.texture}
          atlasVersion={atlasVersion}
          materials={materials}
          lighting={lighting}
          hoveredZone={mode === "design" ? hoveredZone : null}
          selectedZone={mode === "design" ? selectedZone : null}
          interacting={dragging}
          onSurfaceDown={onSurfaceDown}
          onSurfaceMove={onSurfaceMove}
          onHoverZone={(z) => useStudio.getState().setHoveredZone(z)}
          onMissed={() => useStudio.getState().selectLayer(null)}
          onReady={() => setReady(true)}
        />
      )}

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="bg-brand-navy-900/10 h-64 w-48 animate-pulse rounded-[40%_40%_12%_12%]" />
          <p className="text-muted-foreground text-sm">Chargement du modèle…</p>
        </div>
      )}

      <div
        className="border-border bg-surface/90 shadow-card absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border p-1 backdrop-blur"
        role="toolbar"
        aria-label="Vues prédéfinies"
      >
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => viewerRef.current?.setView(v)}
            className="hover:bg-surface-muted focus-visible:ring-ring rounded-full px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2"
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => viewerRef.current?.setView("front")}
          className="hover:bg-surface-muted focus-visible:ring-ring rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2"
          aria-label="Réinitialiser la vue"
        >
          <RotateCcw className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
