"use client";

import { layerSizePx, zoneRectPx } from "@wear3d/editor-2d";
import { useEffect, useRef } from "react";
import { getCachedImage } from "@/lib/studio/assets";
import { getAtlasCanvas, useAtlas } from "@/lib/studio/atlas";
import { endDrag, surfaceDown, surfaceMove, zoneAtUv } from "@/lib/studio/interaction";
import { useSelectedLayer, useStudio } from "@/lib/studio/store";

/** Partie utile de l'atlas (les îles occupent le haut). */
const VISIBLE_H = 0.92;

/**
 * Vue 2D à plat (CDC F-23) : l'atlas UV avec le contour des zones. Les calques se
 * sélectionnent et se déplacent comme en 3D.
 */
export function FlatView() {
  const definition = useStudio((s) => s.definition);
  const selectedZone = useStudio((s) => s.selectedZone);
  const hoveredZone = useStudio((s) => s.hoveredZone);
  const selected = useSelectedLayer();
  const version = useAtlas((s) => s.version);
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const layout = useRef({ x: 0, y: 0, size: 1 });

  useEffect(() => {
    const draw = () => {
      const el = canvas.current;
      const container = box.current;
      if (!el || !container || !definition) return;
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const pad = 32;
      // Marge à gauche pour la barre d'outils flottante (56 px + écart).
      const left = 76;
      const size = Math.min(w - left - pad, (h - pad * 2 - 40) / VISIBLE_H);
      const x = left + (w - left - pad - size) / 2;
      const y = pad;
      layout.current = { x, y, size };

      const atlas = getAtlasCanvas();
      ctx.save();
      ctx.shadowColor = "rgba(15,35,90,0.15)";
      ctx.shadowBlur = 24;
      for (const z of definition.zones) {
        const r = z.uvRect;
        ctx.drawImage(
          atlas,
          r.x * atlas.width,
          r.y * atlas.height,
          r.w * atlas.width,
          r.h * atlas.height,
          x + r.x * size,
          y + r.y * size,
          r.w * size,
          r.h * size,
        );
      }
      ctx.restore();

      ctx.font = "600 12px Inter, sans-serif";
      for (const z of definition.zones) {
        const r = z.uvRect;
        const active = z.code === selectedZone || z.code === hoveredZone;
        ctx.strokeStyle = active ? "#1F5EFF" : "rgba(11,21,48,0.25)";
        ctx.lineWidth = active ? 2 : 1;
        ctx.setLineDash(active ? [] : [6, 4]);
        ctx.strokeRect(x + r.x * size, y + r.y * size, r.w * size, r.h * size);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(11,21,48,0.75)";
        ctx.fillText(z.label, x + r.x * size + 8, y + r.y * size + 18);
      }

      // Cadre de sélection du calque.
      if (selected) {
        const zone = definition.zones.find((z) => z.code === selected.zone);
        if (zone) {
          const zpx = zoneRectPx({ code: zone.code, ...zone.uvRect }, size);
          const dims = layerSizePx(selected, zpx, (id) => {
            const img = getCachedImage(id);
            return img ? img.width / img.height : undefined;
          });
          ctx.save();
          ctx.translate(
            x + zpx.x + selected.transform.x * zpx.w,
            y + zpx.y + selected.transform.y * zpx.h,
          );
          ctx.rotate((selected.transform.rotation * Math.PI) / 180);
          ctx.strokeStyle = "#1F5EFF";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(-dims.w / 2, -dims.h / 2, dims.w, dims.h);
          ctx.setLineDash([]);
          ctx.fillStyle = "#FFFFFF";
          for (const [cx, cy] of [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ] as const) {
            ctx.fillRect((cx * dims.w) / 2 - 4, (cy * dims.h) / 2 - 4, 8, 8);
            ctx.strokeRect((cx * dims.w) / 2 - 4, (cy * dims.h) / 2 - 4, 8, 8);
          }
          ctx.restore();
        }
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [definition, version, selected, selectedZone, hoveredZone]);

  useEffect(() => {
    window.addEventListener("pointerup", endDrag);
    return () => window.removeEventListener("pointerup", endDrag);
  }, []);

  const toUv = (e: React.PointerEvent) => {
    const rect = canvas.current!.getBoundingClientRect();
    const { x, y, size } = layout.current;
    return { u: (e.clientX - rect.left - x) / size, v: (e.clientY - rect.top - y) / size };
  };

  return (
    <div ref={box} className="relative min-h-0 flex-1">
      <canvas
        ref={canvas}
        className="absolute inset-0 touch-none"
        aria-label="Vue à plat des zones du vêtement"
        onPointerDown={(e) => {
          const { u, v } = toUv(e);
          const zone = zoneAtUv(u, v);
          if (!zone) {
            useStudio.getState().select(null);
            return;
          }
          if (surfaceDown({ zone, u, v })) (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const { u, v } = toUv(e);
          const zone = zoneAtUv(u, v);
          useStudio.getState().setHoveredZone(zone ?? null);
          // Pendant un glisser, on projette le point dans chaque zone : le calque reste dans la sienne.
          const def = useStudio.getState().definition;
          if (def) surfaceMove(def.zones.map((z) => ({ zone: z.code, u, v })));
        }}
        onPointerLeave={() => useStudio.getState().setHoveredZone(null)}
      />
    </div>
  );
}
