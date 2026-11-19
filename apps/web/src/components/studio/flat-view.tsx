"use client";

import { layerSizePx } from "@wear3d/editor-2d";
import { ATLAS_SIZE, type GarmentDefinition } from "@wear3d/garment-engine";
import { cn } from "@wear3d/ui";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCachedImage } from "@/lib/studio/assets";
import { composeInto, getAtlasCanvas, useAtlas } from "@/lib/studio/atlas";
import {
  FLAT_VIEW_LABELS,
  placementToUv,
  pointInPolygon,
  rulerScale,
  viewLayout,
  type FlatMode,
  type FlatView,
  type Placement,
  type ViewLayout,
} from "@/lib/studio/flat-layout";
import { endDrag, surfaceDown, surfaceMove } from "@/lib/studio/interaction";
import { applyDrop, isPanelDrag } from "@/lib/studio/placement";
import { useSelectedLayer, useStudio } from "@/lib/studio/store";
import { downloadBlob, flatBridge, slugify } from "@/lib/studio/viewer-bridge";

const RULER = 24;
/** Marge gauche réservée à la barre d'outils flottante. */
const TOOLBAR = 76;
const GAP = 70;
const ACTION = "#1F5EFF";

interface Drawn {
  layout: ViewLayout;
  ox: number;
  oy: number;
  s: number;
}

const aspectOf = (id: string) => {
  const img = getCachedImage(id);
  return img ? img.width / img.height : undefined;
};

function polygonPath(p: Placement, ox: number, oy: number, s: number): Path2D {
  const path = new Path2D();
  p.outline.forEach(([x, y], i) =>
    i ? path.lineTo(ox + x * s, oy + y * s) : path.moveTo(ox + x * s, oy + y * s),
  );
  path.closePath();
  return path;
}

/** Dessine une vue à plat (silhouette habillée de l'atlas) à l'origine et l'échelle données. */
function drawGarment(
  ctx: CanvasRenderingContext2D,
  def: GarmentDefinition,
  layout: ViewLayout,
  ox: number,
  oy: number,
  s: number,
  highlight?: { selected: string | null; hovered: string | null },
) {
  const atlas = getAtlasCanvas();
  const A = atlas.width;
  // Ombre portée de la silhouette.
  ctx.save();
  ctx.shadowColor = "rgba(15,35,90,0.22)";
  ctx.shadowBlur = 18 * Math.min(1, s * 2);
  ctx.shadowOffsetY = 6 * Math.min(1, s * 2);
  ctx.fillStyle = "#ffffff";
  for (const p of layout.placements) ctx.fill(polygonPath(p, ox, oy, s));
  ctx.restore();

  for (const p of layout.placements) {
    const uv = def.zones.find((z) => z.code === p.zone)?.uvRect;
    if (!uv) continue;
    const path = polygonPath(p, ox, oy, s);
    const r = { x: ox + p.rect.x * s, y: oy + p.rect.y * s, w: p.rect.w * s, h: p.rect.h * s };
    ctx.save();
    ctx.clip(path);
    ctx.drawImage(atlas, uv.x * A, uv.y * A, uv.w * A, uv.h * A, r.x, r.y, r.w, r.h);
    if (p.shade) {
      // Volume du tissu : bords légèrement assombris, centre éclairé.
      const g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
      g.addColorStop(0, "rgba(0,0,0,0.22)");
      g.addColorStop(0.3, "rgba(255,255,255,0.06)");
      g.addColorStop(0.7, "rgba(255,255,255,0.02)");
      g.addColorStop(1, "rgba(0,0,0,0.24)");
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(11,21,48,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke(path);
    if (highlight && (p.zone === highlight.selected || p.zone === highlight.hovered)) {
      ctx.strokeStyle = p.zone === highlight.selected ? ACTION : "rgba(31,94,255,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke(path);
    }
  }
}

function modeViews(mode: FlatMode): FlatView[] {
  return mode === "both" ? ["front", "back"] : [mode];
}

const fmt = new Intl.NumberFormat("fr-FR");

/**
 * Vue 2D (maquette « Studio 2D Jersey Editor ») : maillot à plat Face / Dos, règles en
 * pixels d'impression, zoom et panoramique, sélection et glisser des calques.
 */
export function FlatView() {
  const definition = useStudio((s) => s.definition);
  const selectedZone = useStudio((s) => s.selectedZone);
  const hoveredZone = useStudio((s) => s.hoveredZone);
  const selection = useStudio((s) => s.selection);
  const tool = useStudio((s) => s.tool);
  const selected = useSelectedLayer();
  const version = useAtlas((s) => s.version);
  const mode = useStudio((s) => s.flatMode);
  const setMode = useStudio((s) => s.setFlatMode);
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drawn = useRef<Drawn[]>([]);
  const geo = useRef({ cx: 0, cy: 0 });
  const panning = useRef<{ x: number; y: number } | null>(null);

  // Nouvelle vue : cadrage remis à zéro.
  useEffect(() => setView({ zoom: 1, panX: 0, panY: 0 }), [mode]);

  useEffect(() => {
    const draw = () => {
      const el = canvas.current;
      const container = box.current;
      if (!el || !container || !definition) return;
      const dpr = window.devicePixelRatio || 1;
      const W = container.clientWidth;
      const H = container.clientHeight;
      el.width = W * dpr;
      el.height = H * dpr;
      el.style.width = `${W}px`;
      el.style.height = `${H}px`;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const layouts = modeViews(mode).map((v) => viewLayout(v, definition));
      const boxW = layouts.reduce((a, l) => a + l.box.w, 0) + GAP * (layouts.length - 1);
      const boxH = Math.max(...layouts.map((l) => l.box.h));
      const area = {
        x: TOOLBAR + RULER + 12,
        y: RULER + 64,
        w: W - TOOLBAR - RULER - 36,
        h: H - RULER - 64 - 52,
      };
      const s0 = Math.min(area.w / boxW, area.h / boxH);
      const s = s0 * view.zoom;
      const cx = area.x + area.w / 2;
      const cy = area.y + area.h / 2;
      geo.current = { cx, cy };
      // Origine du monde (coin haut gauche du premier cadre).
      const wx = cx - (boxW / 2) * s + view.panX;
      const wy = cy - (boxH / 2) * s + view.panY;

      const list: Drawn[] = [];
      let offset = 0;
      for (const layout of layouts) {
        const ox = wx + (offset - layout.box.x) * s;
        const oy = wy + (boxH - layout.box.h) * 0.5 * s - layout.box.y * s;
        list.push({ layout, ox, oy, s });
        offset += layout.box.w + GAP;
      }
      drawn.current = list;

      const highlight = {
        selected: selection?.kind === "base" ? selectedZone : null,
        hovered: hoveredZone,
      };
      for (const d of list) {
        const b = d.layout.box;
        // Cadre pointillé de la vue (zone d'impression).
        ctx.strokeStyle = "rgba(31,94,255,0.35)";
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(d.ox + b.x * s, d.oy + b.y * s, b.w * s, b.h * s);
        ctx.setLineDash([]);
        drawGarment(ctx, definition, d.layout, d.ox, d.oy, s, highlight);
        // Étiquette de la vue.
        const label = FLAT_VIEW_LABELS[d.layout.view];
        ctx.font = "600 14px Inter, sans-serif";
        const tw = ctx.measureText(label).width + 36;
        const lx = d.ox + (b.x + b.w / 2) * s - tw / 2;
        const ly = d.oy + (b.y + b.h) * s + 12;
        ctx.fillStyle = d.layout.view === "back" ? "#0B2A8F" : ACTION;
        ctx.beginPath();
        ctx.roundRect(lx, ly, tw, 30, 15);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, lx + tw / 2, ly + 15);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }

      // Cadre de sélection du calque, dans chaque vue où sa zone apparaît.
      if (selected) {
        for (const d of list) {
          for (const p of d.layout.placements) {
            if (p.zone !== selected.zone) continue;
            const zpx = {
              x: d.ox + p.rect.x * s,
              y: d.oy + p.rect.y * s,
              w: p.rect.w * s,
              h: p.rect.h * s,
            };
            const dims = layerSizePx(selected, zpx, aspectOf);
            ctx.save();
            ctx.translate(
              zpx.x + selected.transform.x * zpx.w,
              zpx.y + selected.transform.y * zpx.h,
            );
            ctx.rotate((selected.transform.rotation * Math.PI) / 180);
            ctx.strokeStyle = ACTION;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-dims.w / 2, -dims.h / 2, dims.w, dims.h);
            ctx.fillStyle = "#FFFFFF";
            for (const [hx, hy] of [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ] as const) {
              ctx.beginPath();
              ctx.arc((hx * dims.w) / 2, (hy * dims.h) / 2, 4.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }

      // Règles graduées en pixels d'impression (export 4096 px).
      const k = rulerScale(definition, ATLAS_SIZE.export);
      const first = list[0];
      if (first) {
        const x0 = first.ox + first.layout.box.x * s;
        const y0 = first.oy + first.layout.box.y * s;
        const pxPerScreen = k / s;
        const step = [100, 250, 500, 1000, 2000].find((v) => v / pxPerScreen >= 56) ?? 2000;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(TOOLBAR, 0, W - TOOLBAR, RULER);
        ctx.fillRect(TOOLBAR, 0, RULER, H);
        ctx.strokeStyle = "rgba(11,21,48,0.35)";
        ctx.fillStyle = "rgba(11,21,48,0.7)";
        ctx.font = "10px Inter, sans-serif";
        ctx.lineWidth = 1;
        const startX = Math.ceil(((TOOLBAR + RULER - x0) * pxPerScreen) / step) * step;
        for (let v = startX; ; v += step) {
          const sx = x0 + v / pxPerScreen;
          if (sx > W) break;
          ctx.beginPath();
          ctx.moveTo(sx + 0.5, RULER - 8);
          ctx.lineTo(sx + 0.5, RULER);
          ctx.stroke();
          ctx.fillText(fmt.format(v + 0), sx + 3, 11);
        }
        const startY = Math.ceil(((RULER - y0) * pxPerScreen) / step) * step;
        ctx.save();
        for (let v = startY; ; v += step) {
          const sy = y0 + v / pxPerScreen;
          if (sy > H) break;
          ctx.beginPath();
          ctx.moveTo(TOOLBAR + RULER - 8, sy + 0.5);
          ctx.lineTo(TOOLBAR + RULER, sy + 0.5);
          ctx.stroke();
          ctx.save();
          ctx.translate(TOOLBAR + 11, sy - 3);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(fmt.format(v + 0), 0, 0);
          ctx.restore();
        }
        ctx.restore();
        ctx.strokeStyle = "rgba(11,21,48,0.15)";
        ctx.strokeRect(TOOLBAR + 0.5, 0.5, W - TOOLBAR - 1, RULER);
        ctx.strokeRect(TOOLBAR + 0.5, 0.5, RULER, H - 1);
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [definition, version, selected, selectedZone, hoveredZone, selection, mode, view]);

  /** Zoom autour d'un point de l'écran (le point visé reste sous le pointeur). */
  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    setView((v) => {
      const zoom = Math.min(6, Math.max(0.4, v.zoom * factor));
      const r = zoom / v.zoom;
      const { cx, cy } = geo.current;
      const x = px ?? cx;
      const y = py ?? cy;
      return {
        zoom,
        panX: x - cx - (x - cx - v.panX) * r,
        panY: y - cy - (y - cy - v.panY) * r,
      };
    });
  }, []);

  useEffect(() => {
    flatBridge.zoom = (step) => zoomAt(step > 0 ? 1.25 : 0.8);
    flatBridge.fit = () => setView({ zoom: 1, panX: 0, panY: 0 });
    return () => {
      flatBridge.zoom = null;
      flatBridge.fit = null;
    };
  }, [zoomAt]);

  useEffect(() => {
    window.addEventListener("pointerup", endDrag);
    return () => window.removeEventListener("pointerup", endDrag);
  }, []);

  // Molette : zoom (listener non passif pour bloquer le défilement de la page).
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const local = (e: React.PointerEvent) => {
    const rect = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /** Zone sous le pointeur (la plus haute) et sa vue. */
  const hitAt = (x: number, y: number) => {
    for (const d of drawn.current) {
      const ux = (x - d.ox) / d.s;
      const uy = (y - d.oy) / d.s;
      for (let i = d.layout.placements.length - 1; i >= 0; i--) {
        const p = d.layout.placements[i]!;
        if (pointInPolygon(p.outline, ux, uy)) return { d, p, ux, uy };
      }
    }
    return null;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={box} className="relative min-h-0 flex-1">
        <canvas
          ref={canvas}
          className={cn(
            "absolute inset-0 touch-none",
            tool === "pan" ? "cursor-grab active:cursor-grabbing" : "",
          )}
          aria-label="Vue 2D à plat du vêtement"
          onPointerDown={(e) => {
            const { x, y } = local(e);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            if (tool === "pan" || e.button === 1) {
              panning.current = { x, y };
              return;
            }
            const hit = hitAt(x, y);
            const uv = hit && definition && placementToUv(hit.p, definition, hit.ux, hit.uy);
            if (!uv) {
              useStudio.getState().select(null);
              return;
            }
            surfaceDown(uv);
          }}
          onPointerMove={(e) => {
            const { x, y } = local(e);
            if (panning.current) {
              const dx = x - panning.current.x;
              const dy = y - panning.current.y;
              panning.current = { x, y };
              setView((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
              return;
            }
            const hit = hitAt(x, y);
            const zone = hit?.p.zone ?? null;
            if (zone !== useStudio.getState().hoveredZone)
              useStudio.getState().setHoveredZone(zone);
            if (!definition) return;
            // Glisser : le point est projeté dans chaque zone (vue survolée en premier).
            const views = hit
              ? [hit.d, ...drawn.current.filter((d) => d !== hit.d)]
              : drawn.current;
            const hits = views.flatMap((d) =>
              d.layout.placements.flatMap((p) => {
                const uv = placementToUv(p, definition, (x - d.ox) / d.s, (y - d.oy) / d.s);
                return uv ? [uv] : [];
              }),
            );
            // Zone réellement sous le pointeur : un calque glissé dessus y est transféré.
            const over = hit ? placementToUv(hit.p, definition, hit.ux, hit.uy) : null;
            surfaceMove(hits, over);
          }}
          onPointerUp={() => {
            panning.current = null;
          }}
          onPointerLeave={() => useStudio.getState().setHoveredZone(null)}
          // Glisser-déposer depuis les panneaux : dépôt au point visé sur la silhouette.
          onDragOver={(e) => {
            if (!isPanelDrag(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            const rect = canvas.current!.getBoundingClientRect();
            const zone = hitAt(e.clientX - rect.left, e.clientY - rect.top)?.p.zone ?? null;
            if (zone !== useStudio.getState().hoveredZone)
              useStudio.getState().setHoveredZone(zone);
          }}
          onDragLeave={() => useStudio.getState().setHoveredZone(null)}
          onDrop={(e) => {
            if (!isPanelDrag(e)) return;
            e.preventDefault();
            const rect = canvas.current!.getBoundingClientRect();
            const hit = hitAt(e.clientX - rect.left, e.clientY - rect.top);
            useStudio.getState().setHoveredZone(null);
            applyDrop(hit && definition ? placementToUv(hit.p, definition, hit.ux, hit.uy) : null);
          }}
        />
      </div>
      {definition && <BottomStrip definition={definition} mode={mode} setMode={setMode} />}
    </div>
  );
}

/* ---------- Bande du bas : vues et gabarit d'impression ---------- */

function ViewThumb({
  definition,
  view,
  version,
}: {
  definition: GarmentDefinition;
  view: FlatView;
  version: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 64;
    const H = 58;
    el.width = W * dpr;
    el.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const layout = viewLayout(view, definition);
    const b = layout.box;
    const s = Math.min(W / b.w, H / b.h) * 1.05;
    drawGarment(
      ctx,
      definition,
      layout,
      (W - b.w * s) / 2 - b.x * s,
      (H - b.h * s) / 2 - b.y * s,
      s,
    );
  }, [definition, view, version]);
  return <canvas ref={ref} className="h-[58px] w-16" aria-hidden />;
}

function BottomStrip({
  definition,
  mode,
  setMode,
}: {
  definition: GarmentDefinition;
  mode: FlatMode;
  setMode: (m: FlatMode) => void;
}) {
  const version = useAtlas((s) => s.version);
  const name = useStudio((s) => s.name);
  const atlasThumb = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = atlasThumb.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const atlas = getAtlasCanvas();
    el.width = 360;
    el.height = 200;
    ctx.clearRect(0, 0, el.width, el.height);
    // Partie utile de l'atlas (les îles occupent le haut).
    const visible = 0.92;
    const s = Math.min(el.width / atlas.width, el.height / (atlas.height * visible));
    const w = atlas.width * s;
    const h = atlas.height * visible * s;
    ctx.drawImage(
      atlas,
      0,
      0,
      atlas.width,
      atlas.height * visible,
      (el.width - w) / 2,
      (el.height - h) / 2,
      w,
      h,
    );
  }, [version]);

  /** Gabarit d'impression : atlas recomposé en 4096 px, prêt pour la sublimation. */
  async function downloadTemplate() {
    const s = useStudio.getState();
    if (!s.doc || !s.definition) return;
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      c.width = c.height = ATLAS_SIZE.export;
      composeInto(c, s.doc, s.definition);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
      if (blob) downloadBlob(blob, `${slugify(name) || "wear3d-design"}-gabarit-impression.png`);
    } finally {
      setBusy(false);
    }
  }

  const views: FlatView[] = ["front", "back", "left", "right"];
  return (
    <div className="flex shrink-0 items-stretch justify-center gap-3 px-3 pb-1 pt-2">
      <div
        role="tablist"
        aria-label="Vue 2D"
        className="flex gap-1 rounded-2xl border border-white/70 bg-white/85 p-1.5 shadow-sm backdrop-blur"
      >
        {views.map((v) => {
          const active = mode === v || (mode === "both" && (v === "front" || v === "back"));
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={active}
              title={mode === v ? "Revenir à Face + Dos" : `Afficher : ${FLAT_VIEW_LABELS[v]}`}
              onClick={() => setMode(mode === v ? "both" : v)}
              className={cn(
                "flex w-[76px] flex-col items-center gap-0.5 rounded-xl border-2 px-1 pb-1 text-xs font-medium text-[#0b1530] transition",
                mode === v
                  ? "border-action bg-action-soft"
                  : active
                    ? "border-action/30"
                    : "hover:bg-surface-muted border-transparent",
              )}
            >
              <ViewThumb definition={definition} view={v} version={version} />
              {FLAT_VIEW_LABELS[v]}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => void downloadTemplate()}
        disabled={busy}
        title="Télécharger le gabarit d'impression (atlas 4096 × 4096 px)"
        className="hover:border-action/40 flex flex-col items-center gap-1 rounded-2xl border border-white/70 bg-white/85 px-3 py-1.5 shadow-sm backdrop-blur transition"
      >
        <canvas ref={atlasThumb} className="h-[54px] w-[98px] rounded-md" aria-hidden />
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0b1530]">
          Gabarit 2D (impression)
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Download className="size-3.5" aria-hidden />
          )}
        </span>
      </button>
    </div>
  );
}
