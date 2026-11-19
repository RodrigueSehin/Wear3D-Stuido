"use client";

import { createTextLayer, type TextLayer } from "@wear3d/design-schema";
import { ATLAS_SIZE } from "@wear3d/garment-engine";
import { cn, Popover, PopoverContent, PopoverTrigger, Slider } from "@wear3d/ui";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  Plus,
  Underline,
} from "lucide-react";
import { useState } from "react";
import { STUDIO_FONTS, type StudioFontKey } from "@/lib/studio/fonts";
import { contrastColor } from "@/lib/studio/textures";
import { draggable, placementZone, revealZone } from "@/lib/studio/placement";
import { useSelectedLayer, useStudio } from "@/lib/studio/store";
import { ColorPickerPanel, NumberBox } from "./controls";

const MAX_CHARS = 50;
const PALETTE = ["#FFFFFF", "#1F5EFF", "#0B1530", "#000000", "#E11D2E", "#FFC83D"] as const;

type EffectId = "none" | "outline" | "shadow" | "glow" | "gradient" | "relief" | "rounded" | "arc";

/** Aperçu « Aa » de chaque effet (approximation CSS du rendu réel sur le vêtement). */
const EFFECTS: { id: EffectId; label: string; style: React.CSSProperties }[] = [
  { id: "none", label: "Aucun", style: {} },
  {
    id: "outline",
    label: "Contour",
    style: { color: "#fff", WebkitTextStroke: "1.5px #0a3d91" },
  },
  { id: "shadow", label: "Ombre", style: { textShadow: "2px 3px 3px rgba(0,0,0,.45)" } },
  { id: "glow", label: "Lueur", style: { color: "#1f5eff", textShadow: "0 0 8px #4c8dff" } },
  {
    id: "gradient",
    label: "Dégradé",
    style: {
      background: "linear-gradient(180deg,#1f5eff,#7a3cff)",
      WebkitBackgroundClip: "text",
      color: "transparent",
    },
  },
  {
    id: "relief",
    label: "Relief",
    style: { color: "#c9d3e8", textShadow: "-1px -1px 0 #fff, 2px 2px 2px rgba(0,0,0,.35)" },
  },
  { id: "rounded", label: "Arrondi", style: { WebkitTextStroke: "2px #0b1530" } },
  { id: "arc", label: "Arche", style: {} },
];

function initialDraft(): TextLayer {
  const d = createTextLayer("BODY_FRONT", "");
  d.text.font = "bebas";
  d.text.weight = STUDIO_FONTS.bebas.weight;
  d.text.size = 0.09;
  return d;
}

function isActive(l: TextLayer, id: EffectId): boolean {
  switch (id) {
    case "none":
      return !EFFECTS.some((e) => e.id !== "none" && isActive(l, e.id));
    case "outline":
      return l.effects.outline.enabled;
    case "shadow":
      return l.effects.shadow.enabled;
    case "glow":
      return l.effects.glow.enabled;
    case "gradient":
      return !!l.text.gradient;
    case "relief":
      return l.text.relief;
    case "rounded":
      return l.text.rounded;
    case "arc":
      return l.text.arc !== 0;
  }
}

/** Bascule un effet. Le contour et le dégradé choisissent des couleurs lisibles par défaut. */
function toggleEffect(l: TextLayer, id: EffectId): TextLayer {
  const on = isActive(l, id);
  const effects = structuredClone(l.effects);
  const text = { ...l.text };
  switch (id) {
    case "none":
      effects.outline.enabled = effects.shadow.enabled = effects.glow.enabled = false;
      delete text.gradient;
      text.relief = text.rounded = false;
      text.arc = 0;
      break;
    case "outline": {
      // Texte clair → contour bleu nuit ; texte foncé → contour blanc.
      const lightText = contrastColor(l.text.color) === "#0B1530";
      effects.outline = {
        ...effects.outline,
        enabled: !on,
        color: on ? effects.outline.color : lightText ? "#0A3D91" : "#FFFFFF",
        width: Math.max(effects.outline.width, 0.004),
      };
      break;
    }
    case "shadow":
      effects.shadow.enabled = !on;
      break;
    case "glow":
      effects.glow.enabled = !on;
      break;
    case "gradient":
      if (on) delete text.gradient;
      else
        text.gradient = {
          from: l.text.color,
          to: contrastColor(l.text.color) === "#FFFFFF" ? "#FFFFFF" : "#1F5EFF",
          angle: 90,
        };
      break;
    case "relief":
      text.relief = !on;
      break;
    case "rounded":
      text.rounded = !on;
      break;
    case "arc":
      text.arc = on ? 0 : 60;
      break;
  }
  return { ...l, text, effects };
}

/** Largeur relative qui contient le texte sans l'écraser (mesure sur un canvas de travail). */
function fitWidth(layer: TextLayer, zoneW: number, zoneH: number): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return layer.transform.w;
  const px = layer.text.size * zoneH;
  const f = STUDIO_FONTS[layer.text.font as StudioFontKey] ?? STUDIO_FONTS.bebas;
  ctx.font = `${layer.text.italic ? "italic " : ""}${layer.text.weight} ${px}px ${f.family}`;
  const widest = Math.max(
    ...layer.text.value
      .split("\n")
      .map((line) => ctx.measureText(line).width + line.length * layer.text.letterSpacing * px),
  );
  return Math.min(0.95, Math.max(0.12, (widest * 1.06) / zoneW));
}

export function TextsPanel() {
  const selected = useSelectedLayer();
  const definition = useStudio((s) => s.definition);
  const recent = useStudio((s) => s.recentColors);
  const [draft, setDraft] = useState<TextLayer>(initialDraft);
  const target = selected?.type === "text" ? selected : null;
  const current = target ?? draft;
  const text = current.text;

  const zoneCode =
    definition?.zones.find((z) => z.code === current.zone && z.allows.includes("text"))?.code ??
    "BODY_FRONT";
  const zoneRect = definition?.zones.find((z) => z.code === zoneCode)?.uvRect;
  const zoneH = (zoneRect?.h ?? 0.62) * ATLAS_SIZE.export;
  const sizePx = text.size * zoneH;

  /** Modifie le calque texte sélectionné, ou le brouillon s'il n'y en a pas. */
  const patch = (fn: (l: TextLayer) => TextLayer, key: string, discrete = false) => {
    const s = useStudio.getState();
    if (!target) return setDraft(fn);
    if (discrete) s.seal();
    s.updateLayer(target.id, (l) => (l.type === "text" ? fn(l) : l), `${key}:${target.id}`);
    if (discrete) s.seal();
  };
  const patchText = (p: Partial<TextLayer["text"]>, key: string, discrete = false) =>
    patch((l) => ({ ...l, text: { ...l.text, ...p } }), key, discrete);

  /** Largeur relative qui contient le texte dans la zone donnée. */
  const widthIn = (code: string, layer: TextLayer) => {
    const rect = useStudio.getState().definition?.zones.find((z) => z.code === code)?.uvRect;
    return fitWidth(
      layer,
      (rect?.w ?? 0.49) * ATLAS_SIZE.studio,
      (rect?.h ?? 0.62) * ATLAS_SIZE.studio,
    );
  };

  /** Ajoute le texte sur le côté visible du vêtement. */
  const add = () => {
    if (!text.value.trim()) return;
    const s = useStudio.getState();
    const code = placementZone("text");
    const fresh = createTextLayer(code, text.value);
    const layer: TextLayer = {
      ...fresh,
      text: { ...text },
      effects: structuredClone(current.effects),
    };
    layer.transform = { ...fresh.transform, w: widthIn(code, layer) };
    s.addLayer(layer);
    revealZone(code);
  };

  const bold = text.weight >= 700;
  const toggleBold = () => {
    const f = STUDIO_FONTS[text.font as StudioFontKey];
    patchText({ weight: bold ? Math.min(f?.weight ?? 400, 400) : 700 }, "weight", true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 [&>*]:shrink-0">
        <p className="text-muted-foreground text-sm leading-snug">
          Ajoutez, personnalisez et positionnez des textes sur votre vêtement.
        </p>

        <div className="border-border focus-within:border-action rounded-xl border bg-white p-3">
          <textarea
            value={text.value}
            maxLength={MAX_CHARS}
            rows={2}
            placeholder="Votre texte"
            aria-label="Contenu du texte"
            onChange={(e) => patchText({ value: e.target.value }, "value")}
            onBlur={() => useStudio.getState().seal()}
            className="block w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-[#7b86a0]"
          />
          <p className="text-muted-foreground text-right text-xs">
            {text.value.length} / {MAX_CHARS}
          </p>
        </div>

        <button
          type="button"
          onClick={add}
          disabled={!text.value.trim()}
          title="Cliquer pour ajouter, ou glisser sur le vêtement pour le placer"
          {...(text.value.trim()
            ? draggable({
                kind: "text",
                layer: current,
                width: widthIn(placementZone("text"), current),
              })
            : {})}
          className="bg-action hover:bg-action-hover disabled:hover:bg-action flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white transition disabled:opacity-60"
        >
          <Plus className="size-5" aria-hidden /> Ajouter le texte
        </button>

        <Group title="Police de caractères">
          <FontPicker
            value={text.font}
            onChange={(k) =>
              patchText({ font: k, weight: STUDIO_FONTS[k as StudioFontKey].weight }, "font", true)
            }
          />
        </Group>

        <Group title="Style de texte">
          <div className="flex items-center gap-2">
            <ToggleBtn label="Gras" pressed={bold} onClick={toggleBold}>
              <Bold className="size-4" />
            </ToggleBtn>
            <ToggleBtn
              label="Italique"
              pressed={text.italic}
              onClick={() => patchText({ italic: !text.italic }, "italic", true)}
            >
              <Italic className="size-4" />
            </ToggleBtn>
            <ToggleBtn
              label="Souligné"
              pressed={text.underline}
              onClick={() => patchText({ underline: !text.underline }, "underline", true)}
            >
              <Underline className="size-4" />
            </ToggleBtn>
            <span className="mx-1 flex-1" />
            {(
              [
                ["left", "Aligner à gauche", AlignLeft],
                ["center", "Centrer", AlignCenter],
                ["right", "Aligner à droite", AlignRight],
              ] as const
            ).map(([a, label, Icon]) => (
              <ToggleBtn
                key={a}
                label={label}
                pressed={text.align === a}
                onClick={() => patchText({ align: a }, "align", true)}
              >
                <Icon className="size-4" />
              </ToggleBtn>
            ))}
          </div>
        </Group>

        <Group title="Taille">
          <div className="flex items-center gap-3">
            <Slider
              value={[text.size]}
              min={0.02}
              max={0.3}
              step={0.005}
              aria-label="Taille du texte"
              onValueChange={([v]) => patchText({ size: v ?? text.size }, "size")}
              onValueCommit={() => useStudio.getState().seal()}
              className="flex-1"
            />
            <NumberBox
              unit="px"
              value={Math.round(sizePx)}
              min={8}
              max={Math.round(0.3 * zoneH)}
              onChange={(v) => patchText({ size: v / zoneH }, "size", true)}
              className="w-[92px] shrink-0"
            />
          </div>
        </Group>

        <Group title="Espacement">
          <div className="grid grid-cols-2 gap-3">
            <NumberBox
              label="AV"
              unit="px"
              value={Math.round(text.letterSpacing * sizePx)}
              min={-Math.round(0.1 * sizePx)}
              max={Math.round(2 * sizePx)}
              onChange={(v) => patchText({ letterSpacing: v / sizePx }, "spacing", true)}
            />
            <NumberBox
              label="↕"
              value={Number(text.lineHeight.toFixed(1))}
              step={0.1}
              min={0.6}
              max={3}
              onChange={(v) => patchText({ lineHeight: v }, "lineHeight", true)}
            />
          </div>
        </Group>

        <Group title="Couleur">
          <div className="flex items-center gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Couleur ${c}`}
                aria-pressed={text.color.toUpperCase() === c}
                onClick={() => patchText({ color: c }, "color", true)}
                className={cn(
                  "size-8 rounded-full border border-black/15 transition",
                  text.color.toUpperCase() === c && "ring-action ring-2 ring-offset-2",
                )}
                style={{ background: c }}
              />
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Couleur personnalisée"
                  className="size-8 rounded-full border border-black/15"
                  style={{
                    background: "conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
                  }}
                />
              </PopoverTrigger>
              <PopoverContent align="start">
                <ColorPickerPanel
                  value={text.color}
                  recent={recent}
                  onChange={(c) => patchText({ color: c }, "color")}
                  onCommit={(c) => {
                    const s = useStudio.getState();
                    s.pushRecentColor(c);
                    s.seal();
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </Group>

        <Group title="Effets de texte">
          <div className="grid grid-cols-4 gap-2">
            {EFFECTS.map((e) => {
              const active = isActive(current, e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => patch((l) => toggleEffect(l, e.id), `fx-${e.id}`, true)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg border-2 bg-white py-2 text-xs transition",
                    active ? "border-action" : "border-border hover:border-action/40",
                  )}
                >
                  <span
                    className="text-[22px] font-bold leading-7 text-[#0b1530]"
                    style={e.style}
                    aria-hidden
                  >
                    Aa
                  </span>
                  {e.label}
                </button>
              );
            })}
          </div>

          {text.arc !== 0 && (
            <div>
              <div className="flex justify-between text-sm">
                <span>Courbure</span>
                <span className="font-mono text-xs">{Math.round(text.arc)}°</span>
              </div>
              <Slider
                value={[text.arc]}
                min={-180}
                max={180}
                step={5}
                aria-label="Courbure du texte"
                onValueChange={([v]) => patchText({ arc: v === 0 ? 5 : (v ?? text.arc) }, "arc")}
                onValueCommit={() => useStudio.getState().seal()}
              />
            </div>
          )}
          {text.gradient && (
            <div className="grid grid-cols-2 gap-3">
              {(["from", "to"] as const).map((k) => (
                <label
                  key={k}
                  className="border-border flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm"
                >
                  <input
                    type="color"
                    value={text.gradient![k]}
                    aria-label={k === "from" ? "Début du dégradé" : "Fin du dégradé"}
                    onChange={(e) =>
                      patchText(
                        { gradient: { ...text.gradient!, [k]: e.target.value.toUpperCase() } },
                        `grad-${k}`,
                      )
                    }
                    onBlur={() => useStudio.getState().seal()}
                    className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  {k === "from" ? "Début" : "Fin"}
                </label>
              ))}
            </div>
          )}
        </Group>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-[#0b1530]">{title}</p>
      {children}
    </div>
  );
}

function ToggleBtn({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border transition",
        pressed
          ? "border-action bg-action text-white"
          : "border-border hover:bg-surface-muted bg-white text-[#0b1530]",
      )}
    >
      {children}
    </button>
  );
}

/** Liste de polices où chaque nom est affiché dans sa propre typographie. */
function FontPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = STUDIO_FONTS[value as StudioFontKey] ?? STUDIO_FONTS.bebas;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Police de caractères"
          className="border-border hover:border-action flex h-11 w-full items-center gap-3 rounded-lg border bg-white px-3 text-left"
        >
          <span className="text-muted-foreground text-sm font-bold">AA</span>
          <span className={cn("flex-1 truncate text-[17px]", current.className)}>
            {current.label}
          </span>
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-64 overflow-y-auto p-1">
        <ul role="listbox" aria-label="Polices">
          {Object.entries(STUDIO_FONTS).map(([key, f]) => (
            <li key={key}>
              <button
                type="button"
                role="option"
                aria-selected={key === value}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  "hover:bg-surface-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-lg",
                  f.className,
                  key === value && "bg-action-soft text-action",
                )}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
