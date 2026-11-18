"use client";

import { MATERIAL_CODES, type MaterialCode } from "@wear3d/design-schema";
import { FABRIC_NAMES, type ViewPreset } from "@wear3d/garment-engine";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@wear3d/ui";
import { ChevronDown } from "lucide-react";
import { useStudio, useSelectedLayer } from "@/lib/studio/store";
import { fabricSwatch } from "@/lib/studio/swatches";
import { setView } from "@/lib/studio/viewer-bridge";
import { ColorPickerPanel } from "./controls";

const QUICK_COLORS = ["#1D4ED8", "#FFFFFF", "#0B1530", "#DC2626", "#16A34A", "#FACC15", "#7C3AED"];

/** Icônes de vue : t-shirt de face, de dos, de profil. */
function ViewIcon({ view }: { view: "front" | "back" | "side" }) {
  if (view === "side") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path
          d="M10 3c1 1 3 1 4 0l1 1-1 3 1 1v12c-2 .7-4 .7-6 0V8l1-1-1-3z"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill={view === "front" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M8 3 4 5.5 5.5 10 7 9.2V20h10V9.2l1.5.8L20 5.5 16 3c-1 1.5-3 2-4 2s-3-.5-4-2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const VIEWS: { view: ViewPreset; label: string; icon: "front" | "back" | "side" }[] = [
  { view: "front", label: "Face", icon: "front" },
  { view: "back", label: "Dos", icon: "back" },
  { view: "left", label: "Gauche", icon: "side" },
  { view: "right", label: "Droite", icon: "side" },
];

export function BottomBar() {
  const activeView = useStudio((s) => s.activeView);
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const selectedZone = useStudio((s) => s.selectedZone);
  const recent = useStudio((s) => s.recentColors);
  const viewMode = useStudio((s) => s.viewMode);
  const layer = useSelectedLayer();

  // Couleur ciblée : le calque sélectionné (texte, numéro) sinon la zone sélectionnée.
  const zone = selectedZone ?? definition?.zones[0]?.code ?? "";
  const layerColor =
    layer?.type === "text"
      ? layer.text.color
      : layer?.type === "number"
        ? layer.number.color
        : null;
  const current = (layerColor ?? doc?.zones[zone]?.color ?? "#FFFFFF").toUpperCase();

  const applyColor = (color: string, live = false) => {
    const s = useStudio.getState();
    if (layer && (layer.type === "text" || layer.type === "number")) {
      s.updateLayer(
        layer.id,
        (l) =>
          l.type === "text"
            ? { ...l, text: { ...l.text, color } }
            : l.type === "number"
              ? { ...l, number: { ...l.number, color } }
              : l,
        `color:${layer.id}`,
      );
    } else {
      s.setZoneColor(zone, color);
    }
    if (!live) {
      s.seal();
      s.pushRecentColor(color);
    }
  };

  const fabric: MaterialCode = doc?.zones[zone]?.material ?? "cotton";
  const fabricColor = doc?.zones[zone]?.color ?? "#1D4ED8";
  const materialZones =
    definition?.zones.filter((z) => z.allows.includes("material")).map((z) => z.code) ?? [];

  return (
    <div className="mx-auto flex h-[92px] max-w-[980px] items-center gap-6 rounded-2xl border border-white/70 bg-white/90 px-5 shadow-[0_8px_30px_rgba(15,35,90,0.10)] backdrop-blur">
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold text-[#0b1530]">Vue</span>
        <div className="flex gap-1">
          {VIEWS.map((v) => (
            <button
              key={v.view}
              type="button"
              disabled={viewMode === "2d"}
              aria-pressed={activeView === v.view}
              onClick={() => {
                useStudio.getState().setActiveView(v.view);
                setView(v.view);
              }}
              className={cn(
                "flex h-[52px] w-[68px] flex-col items-center justify-center gap-0.5 rounded-xl border text-xs disabled:opacity-40",
                activeView === v.view
                  ? "border-action bg-action-soft text-action"
                  : "hover:bg-surface-muted border-transparent text-[#0b1530]",
                v.view === "right" && "[&_svg]:-scale-x-100",
              )}
            >
              <ViewIcon view={v.icon} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <span className="bg-border h-14 w-px" aria-hidden />

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold text-[#0b1530]">Couleurs rapides</span>
        <div className="flex items-center gap-2.5">
          {QUICK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Appliquer ${c}`}
              aria-pressed={current === c}
              onClick={() => applyColor(c)}
              className={cn(
                "size-8 rounded-full border border-black/10 shadow-sm transition hover:scale-110",
                current === c && "ring-action ring-2 ring-offset-2",
              )}
              style={{ background: c }}
            />
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Autre couleur"
                className="size-8 rounded-full border border-black/10 shadow-sm transition hover:scale-110"
                style={{
                  background:
                    "conic-gradient(#ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
                }}
              />
            </PopoverTrigger>
            <PopoverContent side="top">
              <ColorPickerPanel
                value={current}
                recent={recent}
                onChange={(c) => applyColor(c, true)}
                onCommit={(c) => applyColor(c)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <span className="bg-border h-14 w-px" aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-semibold text-[#0b1530]">Tissu</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-border hover:border-action flex h-12 items-center gap-3 rounded-xl border bg-white px-2 text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fabricSwatch(fabric, fabricColor)}
                alt=""
                className="h-9 w-14 rounded-md object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {FABRIC_NAMES[fabric].name}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {FABRIC_NAMES[fabric].subtitle}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64">
            {MATERIAL_CODES.filter((m) => definition?.materials.includes(m)).map((m) => (
              <DropdownMenuItem
                key={m}
                onSelect={() => useStudio.getState().setZonesMaterial(materialZones, m)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fabricSwatch(m, fabricColor, 48)} alt="" className="!size-8 rounded" />
                <span>
                  <span className="block font-medium">{FABRIC_NAMES[m].name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {FABRIC_NAMES[m].subtitle}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
