"use client";

import { cn } from "@wear3d/ui";
import { Maximize2, Minus, Plus, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { layerSizePx } from "@wear3d/editor-2d";
import { getCachedImage } from "@/lib/studio/assets";
import { getAtlasCanvas, useAtlas } from "@/lib/studio/atlas";
import { endDrag, surfaceDown, surfaceMove } from "@/lib/studio/interaction";
import {
  PIECES,
  cutPlanLayout,
  formatLength,
  offsetOutline,
  PATTERN_TABS,
  pieceFrame,
  pieceOutline,
  pieceSettings,
  pieceSize,
  availablePieces,
  sheetLayout,
  UNIT_FACTOR,
  type PatternUnit,
  type PieceDef,
  type PlacedPiece,
  type Pt,
  type Sheet,
} from "@/lib/studio/sewing";
import { useSelectedLayer, useStudio } from "@/lib/studio/store";

const RULER = 26;
const BG = "#0c1631";
const ACTION = "#4C8DFF";
const SIZE_COLORS = ["#7dd3fc", "#60a5fa", "#4c8dff", "#a78bfa", "#f472b6", "#fb923c", "#facc15"];

interface Drawn {
  placed: PlacedPiece;
  /** Coin haut gauche du cadre à l'écran. */
  sx: number;
  sy: number;
  outline: Pt[];
}

function pointInPolygon(pts: readonly Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Point (cm, cadre de la pièce) → UV de l'atlas de sa zone (linéaire, extrapolé). */
function pieceToUv(p: PieceDef, size: string, lx: number, ly: number) {
  const def = useStudio.getState().definition;
  const uv = def?.zones.find((z) => z.code === p.zone)?.uvRect;
  if (!uv || !p.zone) return null;
  const f = pieceFrame(p, size);
  return { zone: p.zone, u: uv.x + (lx / f.w) * uv.w, v: uv.y + (ly / f.h) * uv.h };
}

function rulerStep(unit: PatternUnit, pxPerCm: number): number {
  // Pas en cm donnant au moins ~48 px entre deux graduations.
  const candidates =
    unit === "in"
      ? [2.54, 5.08, 12.7, 25.4]
      : unit === "mm"
        ? [1, 2, 5, 10, 20, 50]
        : [1, 2, 5, 10, 20, 50];
  return candidates.find((c) => c * pxPerCm >= 48) ?? candidates.at(-1)!;
}

/**
 * Atelier de patron (vue « Patron ») : pièces à plat sur une grille centimétrique,
 * règles, endroit / envers, plan de coupe, marges et gradation. Les pièces imprimées
 * affichent l'atlas du design : tout changement se voit à la fois ici et en 3D.
 */
export function PatternWorkspace() {
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const tab = useStudio((s) => s.patternTab);
  const unit = useStudio((s) => s.patternUnit);
  const side = useStudio((s) => s.patternSide);
  const selectedPiece = useStudio((s) => s.selectedPiece);
  const selectedLayer = useSelectedLayer();
  const version = useAtlas((s) => s.version);
  const size = doc?.model.size ?? "L";
  const sewing = doc?.sewing;
  const pieces = useMemo(() => availablePieces(definition), [definition]);
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drawn = useRef<Drawn[]>([]);
  const geo = useRef({ s: 1, ox: 0, oy: 0, cx: 0, cy: 0 });
  const panning = useRef<{ x: number; y: number } | null>(null);

  const sheet: Sheet = useMemo(
    () =>
      tab === "cutplan" ? cutPlanLayout(sewing, size, pieces) : sheetLayout(sewing, size, pieces),
    [tab, sewing, size, pieces],
  );
  const gradingPiece = pieces.find((p) => p.id === selectedPiece) ?? pieces[0]!;
  const garmentSizes = definition?.sizes;
  const sizes = useMemo(() => garmentSizes ?? ["S", "M", "L", "XL", "XXL"], [garmentSizes]);

  useEffect(() => setView({ zoom: 1, panX: 0, panY: 0 }), [tab]);

  useEffect(() => {
    const draw = () => {
      const el = canvas.current;
      const container = box.current;
      if (!el || !container || !definition || !doc) return;
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
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Monde (cm) à afficher selon l'onglet.
      const gradingFrames = sizes.map((sz) => pieceFrame(gradingPiece, sz));
      const world =
        tab === "grading"
          ? {
              w: Math.max(...gradingFrames.map((f) => f.w)) + 8,
              h: Math.max(...gradingFrames.map((f) => f.h)) + 8,
            }
          : { w: sheet.width, h: sheet.height };
      const area = { x: RULER + 16, y: RULER + 16, w: W - RULER - 32, h: H - RULER - 32 };
      const s0 = Math.min(area.w / world.w, area.h / world.h);
      const s = s0 * view.zoom;
      const cx = area.x + area.w / 2;
      const cy = area.y + area.h / 2;
      const ox = cx - (world.w / 2) * s + view.panX;
      const oy = cy - (world.h / 2) * s + view.panY;
      geo.current = { s, ox, oy, cx, cy };

      // Grille centimétrique (5 cm / 10 cm).
      const step = s * 5 >= 10 ? 5 : 10;
      for (let gx = Math.floor(-ox / s / step) * step; ox + gx * s < W; gx += step) {
        ctx.strokeStyle = gx % 10 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.035)";
        ctx.beginPath();
        ctx.moveTo(ox + gx * s + 0.5, 0);
        ctx.lineTo(ox + gx * s + 0.5, H);
        ctx.stroke();
      }
      for (let gy = Math.floor(-oy / s / step) * step; oy + gy * s < H; gy += step) {
        ctx.strokeStyle = gy % 10 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.035)";
        ctx.beginPath();
        ctx.moveTo(0, oy + gy * s + 0.5);
        ctx.lineTo(W, oy + gy * s + 0.5);
        ctx.stroke();
      }

      const atlas = getAtlasCanvas();
      const A = atlas.width;
      const list: Drawn[] = [];

      if (tab === "grading") {
        // Gradation : contours de la pièce dans chaque taille, alignés sur le bas et le centre.
        const maxW = world.w - 8;
        const maxH = world.h - 8;
        sizes.forEach((sz, i) => {
          const f = pieceFrame(gradingPiece, sz);
          const x0 = 4 + (maxW - f.w) / 2;
          const y0 = 4 + (maxH - f.h);
          const pts = pieceOutline(gradingPiece, sz);
          ctx.beginPath();
          pts.forEach(([x, y], k) =>
            k
              ? ctx.lineTo(ox + (x0 + x) * s, oy + (y0 + y) * s)
              : ctx.moveTo(ox + (x0 + x) * s, oy + (y0 + y) * s),
          );
          ctx.closePath();
          const current = sz === size;
          ctx.strokeStyle = SIZE_COLORS[i % SIZE_COLORS.length]!;
          ctx.lineWidth = current ? 2.5 : 1.2;
          if (current) {
            ctx.fillStyle = "rgba(76,141,255,0.12)";
            ctx.fill();
          }
          ctx.stroke();
        });
        ctx.font = "600 13px Inter, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(
          `${gradingPiece.label} — gradation ${sizes.join(" · ")}`,
          ox + 4 * s,
          oy + 4 * s - 8,
        );
      } else {
        if (tab === "cutplan" && sheet.fabricLength) {
          // Tissu : laize × métrage, lisières.
          ctx.fillStyle = "#16244a";
          ctx.fillRect(ox, oy, sheet.width * s, sheet.fabricLength * s);
          ctx.strokeStyle = "rgba(143,182,255,0.6)";
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(ox, oy, sheet.width * s, sheet.fabricLength * s);
          ctx.setLineDash([]);
        }
        for (const placed of sheet.placed) {
          const { piece, x, y, mirrored } = placed;
          const settings = pieceSettings(sewing, piece);
          const f = pieceFrame(piece, size);
          const local = pieceOutline(piece, size);
          // Envers : la pièce est vue retournée.
          const flip = mirrored !== (side === "back");
          const toScreen = (p: Pt): Pt => [
            ox + (x + (flip ? f.w - p[0] : p[0])) * s,
            oy + (y + p[1]) * s,
          ];
          const outline = local.map(toScreen);
          const sx = ox + x * s;
          const sy = oy + y * s;
          list.push({ placed, sx, sy, outline });

          const path = new Path2D();
          outline.forEach(([px, py], i) => (i ? path.lineTo(px, py) : path.moveTo(px, py)));
          path.closePath();

          // Marge de couture.
          if (settings.seam > 0) {
            const seam = offsetOutline(local, settings.seam).map(toScreen);
            const sp = new Path2D();
            seam.forEach(([px, py], i) => (i ? sp.lineTo(px, py) : sp.moveTo(px, py)));
            sp.closePath();
            if (tab === "assembly") {
              ctx.fillStyle = "rgba(251,146,60,0.28)";
              ctx.fill(sp);
            }
            ctx.strokeStyle = tab === "assembly" ? "#fb923c" : "rgba(255,255,255,0.45)";
            ctx.setLineDash([5, 4]);
            ctx.lineWidth = 1;
            ctx.stroke(sp);
            ctx.setLineDash([]);
          }

          // Tissu imprimé (atlas de la zone) ou pièce unie.
          ctx.save();
          ctx.clip(path);
          const zone = definition.zones.find((z) => z.code === piece.zone);
          if (zone) {
            const r = zone.uvRect;
            ctx.save();
            ctx.translate(sx + (flip ? f.w * s : 0), sy);
            ctx.scale(flip ? -1 : 1, 1);
            ctx.drawImage(atlas, r.x * A, r.y * A, r.w * A, r.h * A, 0, 0, f.w * s, f.h * s);
            ctx.restore();
          } else {
            const cuff = piece.id === "cuff" ? doc.trims?.cuffs : undefined;
            ctx.fillStyle = cuff?.enabled
              ? cuff.color
              : (doc.zones[piece.colorZone]?.color ?? "#ffffff");
            ctx.fill(path);
            if (cuff?.enabled && cuff.stripes > 0) {
              // Rayures du bord de manche, dans le sens de la longueur.
              const sh = Math.max(1.5, f.h * s * 0.06);
              ctx.fillStyle = cuff.stripeColor;
              for (let k = 1; k <= cuff.stripes; k++)
                ctx.fillRect(sx, sy + (f.h * s * k) / (cuff.stripes + 1) - sh / 2, f.w * s, sh);
            }
          }
          if (side === "back") {
            // Envers du tissu : impression atténuée.
            ctx.fillStyle = "rgba(220,228,245,0.55)";
            ctx.fill(path);
          }
          ctx.restore();

          // Contour, crans, droit-fil.
          const selected = selectedPiece === piece.id;
          ctx.strokeStyle = selected ? ACTION : "rgba(255,255,255,0.9)";
          ctx.lineWidth = selected ? 2.5 : 1.2;
          ctx.stroke(path);
          ctx.strokeStyle = "rgba(255,255,255,0.95)";
          ctx.lineWidth = 1.5;
          const c: Pt = [
            outline.reduce((a, p) => a + p[0], 0) / outline.length,
            outline.reduce((a, p) => a + p[1], 0) / outline.length,
          ];
          for (const [nx, ny] of piece.notches) {
            const at = toScreen([nx * f.w, ny * f.h]);
            const len = Math.hypot(c[0] - at[0], c[1] - at[1]) || 1;
            const k = Math.min(8, 0.8 * s);
            ctx.beginPath();
            ctx.moveTo(at[0], at[1]);
            ctx.lineTo(at[0] + ((c[0] - at[0]) / len) * k, at[1] + ((c[1] - at[1]) / len) * k);
            ctx.stroke();
          }
          if (f.w * s > 60) {
            const g = Math.min(f.w, f.h) * 0.3 * s;
            const gx = sx + (f.w * s) / 2;
            const gy = sy + f.h * 0.55 * s;
            const [ax, ay, bx, by] =
              settings.grain === "horizontal"
                ? [gx - g, gy, gx + g, gy]
                : settings.grain === "bias"
                  ? [gx - g * 0.7, gy + g * 0.7, gx + g * 0.7, gy - g * 0.7]
                  : [gx, gy - g, gx, gy + g];
            ctx.strokeStyle = "rgba(255,255,255,0.75)";
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.setLineDash([]);
            for (const [px, py, qx, qy] of [
              [ax, ay, bx, by],
              [bx, by, ax, ay],
            ] as const) {
              const ang = Math.atan2(py - qy, px - qx);
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px - 7 * Math.cos(ang - 0.4), py - 7 * Math.sin(ang - 0.4));
              ctx.moveTo(px, py);
              ctx.lineTo(px - 7 * Math.cos(ang + 0.4), py - 7 * Math.sin(ang + 0.4));
              ctx.stroke();
            }
          }

          // Étiquette : nom, dimensions, nombre de coupes.
          const name = `${piece.label.replace(" (corps)", "")}${settings.cut > 1 ? ` (×${settings.cut})` : ""}`;
          ctx.textAlign = "center";
          if (tab === "cutplan") {
            // Plan de coupe : pièces serrées, étiquette au centre de la pièce.
            const lx = sx + (f.w * s) / 2;
            const ly = sy + (f.h * s) / 2;
            ctx.font = "600 11px Inter, sans-serif";
            const tw = ctx.measureText(name).width + 12;
            ctx.fillStyle = "rgba(10,18,41,0.75)";
            ctx.beginPath();
            ctx.roundRect(lx - tw / 2, ly - 10, tw, 18, 9);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.fillText(name, lx, ly + 3);
          } else {
            const dims = pieceSize(piece, size);
            const lx = sx + (f.w * s) / 2;
            const ly = sy + f.h * s + 16;
            ctx.fillStyle = "#fff";
            ctx.font = "600 13px Inter, sans-serif";
            ctx.fillText(name, lx, ly);
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "11px Inter, sans-serif";
            ctx.fillText(
              `${formatLength(dims.w, unit)} × ${formatLength(dims.h, unit)} – couper ${settings.cut}`,
              lx,
              ly + 15,
            );
          }
          ctx.textAlign = "start";
        }
      }
      drawn.current = list;

      // Cadre du calque sélectionné (pièces imprimées, côté endroit).
      if (selectedLayer && side === "front" && tab !== "grading") {
        for (const d of list) {
          const { piece, mirrored } = d.placed;
          if (piece.zone !== selectedLayer.zone || mirrored) continue;
          const f = pieceFrame(piece, size);
          const t = selectedLayer.transform;
          const { w, h } = layerSizePx(
            selectedLayer,
            { x: 0, y: 0, w: f.w * s, h: f.h * s },
            (id) => {
              const img = getCachedImage(id);
              return img ? img.width / img.height : undefined;
            },
          );
          ctx.save();
          ctx.translate(d.sx + t.x * f.w * s, d.sy + t.y * f.h * s);
          ctx.rotate((t.rotation * Math.PI) / 180);
          ctx.strokeStyle = ACTION;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          ctx.restore();
        }
      }

      // Règles (unité choisie).
      const stepCm = rulerStep(unit, s);
      ctx.fillStyle = "#0a1229";
      ctx.fillRect(0, 0, W, RULER);
      ctx.fillRect(0, 0, RULER, H);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px Inter, sans-serif";
      const label = (cm: number) =>
        Math.round(cm * UNIT_FACTOR[unit] * 10) / 10 === 0
          ? "0"
          : (Math.round(cm * UNIT_FACTOR[unit] * 10) / 10).toLocaleString("fr-FR");
      for (let v = Math.ceil((RULER - ox) / s / stepCm) * stepCm; ox + v * s < W; v += stepCm) {
        const x = ox + v * s;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, RULER - 8);
        ctx.lineTo(x + 0.5, RULER);
        ctx.stroke();
        ctx.fillText(label(v), x + 3, 12);
      }
      for (let v = Math.ceil((RULER - oy) / s / stepCm) * stepCm; oy + v * s < H; v += stepCm) {
        const y = oy + v * s;
        ctx.beginPath();
        ctx.moveTo(RULER - 8, y + 0.5);
        ctx.lineTo(RULER, y + 0.5);
        ctx.stroke();
        ctx.save();
        ctx.translate(12, y - 3);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(label(v), 0, 0);
        ctx.restore();
      }
      ctx.fillStyle = "#0a1229";
      ctx.fillRect(0, 0, RULER, RULER);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(unit === "in" ? "po" : unit, 5, 16);
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [
    doc,
    definition,
    sheet,
    tab,
    unit,
    side,
    selectedPiece,
    selectedLayer,
    version,
    view,
    size,
    sewing,
    gradingPiece,
    sizes,
  ]);

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    setView((v) => {
      const zoom = Math.min(8, Math.max(0.3, v.zoom * factor));
      const r = zoom / v.zoom;
      const { cx, cy } = geo.current;
      const x = px ?? cx;
      const y = py ?? cy;
      return { zoom, panX: x - cx - (x - cx - v.panX) * r, panY: y - cy - (y - cy - v.panY) * r };
    });
  }, []);

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

  useEffect(() => {
    window.addEventListener("pointerup", endDrag);
    return () => window.removeEventListener("pointerup", endDrag);
  }, []);

  /** Pièce sous le pointeur et coordonnées locales (cm, cadre non retourné). */
  const hitAt = (x: number, y: number) => {
    const { s } = geo.current;
    for (let i = drawn.current.length - 1; i >= 0; i--) {
      const d = drawn.current[i]!;
      if (!pointInPolygon(d.outline, x, y)) continue;
      const f = pieceFrame(d.placed.piece, size);
      const flip = d.placed.mirrored !== (side === "back");
      const lx = (x - d.sx) / s;
      return { d, lx: flip ? f.w - lx : lx, ly: (y - d.sy) / s };
    }
    return null;
  };

  const local = (e: React.PointerEvent) => {
    const rect = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const editable = side === "front" && tab !== "grading";
  const pieceCount = pieces.filter((p) => !pieceSettings(sewing, p).hidden).length;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <div
        role="tablist"
        aria-label="Vue patron"
        className="flex flex-wrap gap-1 rounded-2xl border border-white/70 bg-white/85 p-1 shadow-sm backdrop-blur"
      >
        {PATTERN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => useStudio.getState().setPatternTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition",
              tab === t.id ? "bg-action text-white" : "hover:bg-surface-muted text-[#0b1530]",
            )}
          >
            {t.label}
            {t.id === "pattern" && (
              <span
                className={cn(
                  "rounded-md px-1.5 text-[11px]",
                  tab === t.id ? "bg-white/20" : "bg-surface-muted",
                )}
              >
                {pieceCount} pièces
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#0c1631] shadow-[0_8px_30px_rgba(15,35,90,0.25)]">
        <div ref={box} className="relative min-h-0 flex-1">
          <canvas
            ref={canvas}
            className="absolute inset-0 touch-none"
            aria-label="Patron de couture"
            onPointerDown={(e) => {
              const { x, y } = local(e);
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              const hit = e.button === 0 ? hitAt(x, y) : null;
              if (!hit) {
                panning.current = { x, y };
                return;
              }
              useStudio.getState().selectPiece(hit.d.placed.piece.id);
              if (editable && !hit.d.placed.mirrored) {
                const uv = pieceToUv(hit.d.placed.piece, size, hit.lx, hit.ly);
                if (uv) surfaceDown(uv);
              }
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
              if (!editable) return;
              // Glisser d'un calque : le point est projeté dans chaque pièce imprimée.
              const { s } = geo.current;
              const hits = drawn.current.flatMap((d) => {
                if (d.placed.mirrored) return [];
                const uv = pieceToUv(d.placed.piece, size, (x - d.sx) / s, (y - d.sy) / s);
                return uv ? [uv] : [];
              });
              // Pièce sous le pointeur : un calque glissé dessus change de zone (dos, manche…).
              const over = hitAt(x, y);
              const overUv =
                over && !over.d.placed.mirrored
                  ? pieceToUv(over.d.placed.piece, size, over.lx, over.ly)
                  : null;
              surfaceMove(hits, overUv);
            }}
            onPointerUp={() => {
              panning.current = null;
            }}
          />

          {/* Unités et zoom */}
          <div className="absolute right-3 top-9 flex items-center gap-2">
            <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-semibold text-white">
              {(["mm", "cm", "in"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  onClick={() => useStudio.getState().setPatternUnit(u)}
                  className={cn(
                    "rounded-md px-2.5 py-1",
                    unit === u ? "bg-action" : "hover:bg-white/10",
                  )}
                >
                  {u === "in" ? "po" : u}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Zoom avant"
              onClick={() => zoomAt(1.25)}
              className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
            >
              <ZoomIn className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Ajuster à la vue"
              onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })}
              className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
            >
              <Maximize2 className="size-4" aria-hidden />
            </button>
          </div>

          {tab === "cutplan" && sheet.fabricLength && <CutPlanCard sheet={sheet} unit={unit} />}
          {tab === "assembly" && <AssemblyCard />}
          {tab === "grading" && <GradingCard piece={gradingPiece} sizes={sizes} unit={unit} />}
        </div>

        <PatternFooter zoom={view.zoom} onZoom={(f) => zoomAt(f)} pieceCount={pieceCount} />
      </div>
    </div>
  );
}

/* ---------- Barre du bas ---------- */

function PatternFooter({
  zoom,
  onZoom,
  pieceCount,
}: {
  zoom: number;
  onZoom: (factor: number) => void;
  pieceCount: number;
}) {
  const size = useStudio((s) => s.doc?.model.size ?? "L");
  const sizes = useStudio((s) => s.definition?.sizes ?? []);
  const side = useStudio((s) => s.patternSide);
  const tab = useStudio((s) => s.patternTab);
  const fabricWidth = useStudio((s) => s.doc?.sewing?.fabricWidth ?? 150);
  const field = "flex h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm text-white";
  const setSewing = (patch: { fabricWidth?: number; seamAll?: number }) => {
    const s = useStudio.getState();
    s.seal();
    s.update((d) => {
      const sewing = d.sewing ?? { fabricWidth: 150, pieces: {} };
      const pieces = { ...sewing.pieces };
      if (patch.seamAll !== undefined)
        for (const p of PIECES)
          pieces[p.id] = {
            ...pieceSettings(sewing, p),
            cut: pieces[p.id]?.cut,
            seam: patch.seamAll,
          };
      return {
        ...d,
        sewing: { ...sewing, pieces, fabricWidth: patch.fabricWidth ?? sewing.fabricWidth },
      };
    });
    s.seal();
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 p-2.5">
      <label className={field}>
        Taille :
        <select
          value={size}
          aria-label="Taille du patron"
          onChange={(e) => {
            const s = useStudio.getState();
            s.seal();
            s.update((d) => ({ ...d, model: { ...d.model, size: e.target.value } }));
            s.seal();
          }}
          className="bg-transparent font-semibold outline-none [&>option]:text-[#0b1530]"
        >
          {sizes.map((sz) => (
            <option key={sz}>{sz}</option>
          ))}
        </select>
      </label>
      <div className={field}>
        Échelle :
        <button
          type="button"
          aria-label="Réduire"
          onClick={() => onZoom(0.8)}
          className="rounded p-0.5 hover:bg-white/10"
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="w-11 text-center font-semibold">{Math.round(zoom * 100)} %</span>
        <button
          type="button"
          aria-label="Agrandir"
          onClick={() => onZoom(1.25)}
          className="rounded p-0.5 hover:bg-white/10"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
      <div className={field}>
        Pièces : <span className="font-semibold">{pieceCount}</span>
      </div>
      {tab === "cutplan" && (
        <label className={field}>
          Laize :
          <select
            value={fabricWidth}
            aria-label="Laize du tissu"
            onChange={(e) => setSewing({ fabricWidth: Number(e.target.value) })}
            className="bg-transparent font-semibold outline-none [&>option]:text-[#0b1530]"
          >
            {[140, 150, 160, 180].map((w) => (
              <option key={w} value={w}>
                {w} cm
              </option>
            ))}
          </select>
        </label>
      )}
      {tab === "assembly" && (
        <label className={field}>
          Marge (toutes) :
          <select
            defaultValue=""
            aria-label="Marge de couture de toutes les pièces"
            onChange={(e) => e.target.value && setSewing({ seamAll: Number(e.target.value) })}
            className="bg-transparent font-semibold outline-none [&>option]:text-[#0b1530]"
          >
            <option value="">—</option>
            {[0.5, 0.7, 1, 1.5, 2].map((m) => (
              <option key={m} value={m}>
                {m.toLocaleString("fr-FR")} cm
              </option>
            ))}
          </select>
        </label>
      )}
      <div
        className="ml-auto flex rounded-lg bg-white/10 p-0.5 text-sm font-semibold text-white"
        role="radiogroup"
        aria-label="Face du tissu"
      >
        {(
          [
            ["front", "Endroit"],
            ["back", "Envers"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={side === id}
            onClick={() => useStudio.getState().setPatternSide(id)}
            className={cn(
              "rounded-md px-3 py-1.5",
              side === id ? "bg-action" : "hover:bg-white/10",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Cartes d'information par onglet ---------- */

const card =
  "absolute bottom-3 right-3 max-w-[300px] rounded-xl border border-white/10 bg-[#0a1229]/90 p-3 text-xs text-white/85 shadow-lg backdrop-blur";

function CutPlanCard({ sheet, unit }: { sheet: Sheet; unit: PatternUnit }) {
  return (
    <div className={card}>
      <p className="mb-1 text-sm font-semibold text-white">Plan de coupe</p>
      <p>
        Laize : {formatLength(sheet.width, unit)} · Métrage :{" "}
        {formatLength(sheet.fabricLength ?? 0, unit)}
      </p>
      <p>
        Rendement matière : <strong>{Math.round((sheet.efficiency ?? 0) * 100)} %</strong> · Coupes
        : {sheet.placed.length}
      </p>
      <p className="mt-1 text-white/60">Les secondes coupes sont retournées (miroir).</p>
    </div>
  );
}

const ASSEMBLY = [
  "Assembler devant et dos aux épaules (crans d'épaule).",
  "Monter les manches dans les emmanchures (cran de tête de manche).",
  "Fermer les côtés et les dessous de manches en une couture.",
  "Assembler col extérieur et intérieur, puis monter le col sur l'encolure.",
  "Monter les bords de manche, puis réaliser l'ourlet du bas.",
];

function AssemblyCard() {
  return (
    <div className={card}>
      <p className="mb-1.5 text-sm font-semibold text-white">Ordre d&apos;assemblage</p>
      <ol className="list-decimal space-y-1 pl-4">
        {ASSEMBLY.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="mt-2 flex items-center gap-1.5 text-white/60">
        <span className="inline-block h-2 w-4 rounded-sm bg-[#fb923c]/60" /> Marge de couture
      </p>
    </div>
  );
}

function GradingCard({
  piece,
  sizes,
  unit,
}: {
  piece: PieceDef;
  sizes: readonly string[];
  unit: PatternUnit;
}) {
  return (
    <div className={card}>
      <p className="mb-1.5 text-sm font-semibold text-white">
        {piece.label} — tableau de gradation
      </p>
      <table className="w-full text-left">
        <thead className="text-white/60">
          <tr>
            <th className="pr-2 font-medium">Taille</th>
            <th className="pr-2 font-medium">Largeur</th>
            <th className="font-medium">Hauteur</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((sz, i) => {
            const d = pieceSize(piece, sz);
            return (
              <tr key={sz}>
                <td className="pr-2">
                  <span
                    className="mr-1.5 inline-block size-2 rounded-full"
                    style={{ background: SIZE_COLORS[i % SIZE_COLORS.length] }}
                  />
                  {sz}
                </td>
                <td className="pr-2">{formatLength(d.w, unit)}</td>
                <td>{formatLength(d.h, unit)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1.5 text-white/60">
        Sélectionnez une pièce dans les calques pour voir sa gradation.
      </p>
    </div>
  );
}
