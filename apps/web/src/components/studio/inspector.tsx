"use client";

import { layerLabel, type Layer } from "@wear3d/design-schema";
import { effectiveDpi, MIN_PRINT_DPI } from "@wear3d/editor-2d";
import { cn } from "@wear3d/ui";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Hash,
  ImageIcon,
  Lock,
  LockOpen,
  Trash2,
  TriangleAlert,
  Type,
} from "lucide-react";
import { useState } from "react";
import { getCachedImage } from "@/lib/studio/assets";
import { NUMBER_STYLES, STUDIO_FONTS } from "@/lib/studio/fonts";
import { useSelectedLayer, useStudio } from "@/lib/studio/store";

/** Inspecteur (300 px, CDC §7.2) : propriétés de la sélection, calques. */
export function Inspector() {
  const [tab, setTab] = useState<"props" | "layers">("layers");
  const selected = useSelectedLayer();
  const active = selected && tab === "layers" ? "props" : tab;

  return (
    <aside
      className="border-border bg-surface hidden w-[300px] shrink-0 flex-col border-l lg:flex"
      aria-label="Inspecteur"
    >
      <div className="border-border flex border-b px-4" role="tablist">
        {(
          [
            ["props", "Personnalisation"],
            ["layers", "Calques"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            onClick={() => {
              setTab(id);
              if (id === "layers") useStudio.getState().selectLayer(null);
            }}
            className={cn(
              "-mb-px flex-1 border-b-2 py-3 text-sm font-medium",
              active === id
                ? "border-action text-action"
                : "text-muted-foreground border-transparent",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {active === "props" && selected ? <LayerProperties layer={selected} /> : null}
        {active === "props" && !selected ? (
          <p className="text-muted-foreground text-sm">
            Sélectionnez un élément sur le vêtement ou dans les calques.
          </p>
        ) : null}
        {active === "layers" && <LayerList />}
      </div>
    </aside>
  );
}

const ICONS = { text: Type, number: Hash, image: ImageIcon } as const;

function LayerList() {
  const layers = useStudio((s) => s.doc?.layers ?? []);
  const definition = useStudio((s) => s.definition);
  const selectedId = useStudio((s) => s.selectedLayerId);
  const { selectLayer, updateLayer, removeLayer, reorderLayer, seal } = useStudio.getState();
  const zoneLabel = (code: string) => definition?.zones.find((z) => z.code === code)?.label ?? code;

  if (!layers.length) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun calque. Ajoutez un texte, un numéro ou un logo depuis le rail d&apos;outils.
      </p>
    );
  }

  const toggle = (id: string, key: "visible" | "locked") => {
    seal();
    updateLayer(id, (l) => ({ ...l, [key]: !l[key] }), `toggle:${key}:${id}`);
    seal();
  };

  return (
    <ul className="flex flex-col gap-1">
      {[...layers].reverse().map((layer) => {
        const Icon = ICONS[layer.type];
        return (
          <li
            key={layer.id}
            className={cn(
              "group flex items-center gap-2 rounded-md px-2 py-1.5",
              selectedId === layer.id ? "bg-action-soft" : "hover:bg-surface-muted",
            )}
          >
            <button
              type="button"
              onClick={() => selectLayer(layer.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm",
                    !layer.visible && "text-muted-foreground line-through",
                  )}
                >
                  {layerLabel(layer)}
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  {zoneLabel(layer.zone)}
                </span>
              </span>
            </button>
            <IconButton label="Monter" onClick={() => reorderLayer(layer.id, "up")}>
              <ArrowUp />
            </IconButton>
            <IconButton label="Descendre" onClick={() => reorderLayer(layer.id, "down")}>
              <ArrowDown />
            </IconButton>
            <IconButton
              label={layer.locked ? "Déverrouiller" : "Verrouiller"}
              onClick={() => toggle(layer.id, "locked")}
            >
              {layer.locked ? <Lock /> : <LockOpen />}
            </IconButton>
            <IconButton
              label={layer.visible ? "Masquer" : "Afficher"}
              onClick={() => toggle(layer.id, "visible")}
            >
              {layer.visible ? <Eye /> : <EyeOff />}
            </IconButton>
            <IconButton label="Supprimer" onClick={() => removeLayer(layer.id)}>
              <Trash2 />
            </IconButton>
          </li>
        );
      })}
    </ul>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded p-1 focus-visible:outline-none focus-visible:ring-2 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}

function LayerProperties({ layer }: { layer: Layer }) {
  const definition = useStudio((s) => s.definition);
  const { updateLayer, removeLayer, duplicateLayer, seal } = useStudio.getState();
  const set = (patch: (l: Layer) => Layer, key: string) =>
    updateLayer(layer.id, patch, `${key}:${layer.id}`);
  const t = layer.transform;
  const zone = definition?.zones.find((z) => z.code === layer.zone);

  let dpiWarning: number | null = null;
  if (layer.type === "image" && zone?.printAreaMm) {
    const src = getCachedImage(layer.assetId);
    if (src) {
      const dpi = effectiveDpi(src.width, t.w, zone.printAreaMm.w);
      if (dpi < MIN_PRINT_DPI) dpiWarning = Math.round(dpi);
    }
  }

  return (
    <div className="flex flex-col gap-4" onPointerUp={seal} onBlur={seal}>
      <div className="flex items-center justify-between">
        <p className="truncate font-semibold">{layerLabel(layer)}</p>
        <div className="flex gap-1">
          <IconButton label="Dupliquer (Ctrl+D)" onClick={() => duplicateLayer(layer.id)}>
            <Copy />
          </IconButton>
          <IconButton label="Supprimer (Suppr)" onClick={() => removeLayer(layer.id)}>
            <Trash2 />
          </IconButton>
        </div>
      </div>

      {dpiWarning !== null && (
        <p
          role="alert"
          className="bg-accent-amber-soft text-foreground flex gap-2 rounded-md p-2 text-xs"
        >
          <TriangleAlert className="text-warning size-4 shrink-0" aria-hidden />
          Résolution insuffisante pour l&apos;impression : {dpiWarning} dpi à cette taille (minimum{" "}
          {MIN_PRINT_DPI}). Réduisez le logo ou importez un fichier plus grand.
        </p>
      )}

      {layer.type === "text" && (
        <>
          <Field label="Texte">
            <input
              value={layer.text.value}
              maxLength={200}
              onChange={(e) =>
                set(
                  (l) =>
                    l.type === "text" ? { ...l, text: { ...l.text, value: e.target.value } } : l,
                  "value",
                )
              }
              className={inputCls}
            />
          </Field>
          <Field label="Police">
            <select
              value={layer.text.font}
              onChange={(e) => {
                const key = e.target.value as keyof typeof STUDIO_FONTS;
                set(
                  (l) =>
                    l.type === "text"
                      ? { ...l, text: { ...l.text, font: key, weight: STUDIO_FONTS[key].weight } }
                      : l,
                  "font",
                );
              }}
              className={inputCls}
            >
              {Object.entries(STUDIO_FONTS).map(([k, f]) => (
                <option key={k} value={k}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <ColorField
            label="Couleur"
            value={layer.text.color}
            onChange={(c) =>
              set((l) => (l.type === "text" ? { ...l, text: { ...l.text, color: c } } : l), "color")
            }
          />
          <Slider
            label="Taille"
            value={layer.text.size}
            min={0.02}
            max={0.3}
            step={0.005}
            format={(v) => `${Math.round(v * 100)} %`}
            onChange={(v) =>
              set((l) => (l.type === "text" ? { ...l, text: { ...l.text, size: v } } : l), "size")
            }
          />
          <Slider
            label="Espacement"
            value={layer.text.letterSpacing}
            min={-0.1}
            max={0.5}
            step={0.01}
            format={(v) => v.toFixed(2)}
            onChange={(v) =>
              set(
                (l) => (l.type === "text" ? { ...l, text: { ...l.text, letterSpacing: v } } : l),
                "spacing",
              )
            }
          />
        </>
      )}

      {layer.type === "number" && (
        <>
          <Field label="Numéro">
            <input
              value={layer.number.value}
              inputMode="numeric"
              maxLength={3}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                set(
                  (l) => (l.type === "number" ? { ...l, number: { ...l.number, value: v } } : l),
                  "value",
                );
              }}
              className={inputCls}
            />
          </Field>
          <Field label="Style">
            <select
              value={layer.number.style}
              onChange={(e) =>
                set(
                  (l) =>
                    l.type === "number"
                      ? { ...l, number: { ...l.number, style: e.target.value } }
                      : l,
                  "style",
                )
              }
              className={inputCls}
            >
              {Object.entries(NUMBER_STYLES).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <ColorField
            label="Couleur"
            value={layer.number.color}
            onChange={(c) =>
              set(
                (l) => (l.type === "number" ? { ...l, number: { ...l.number, color: c } } : l),
                "color",
              )
            }
          />
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="X"
          value={t.x * 100}
          suffix="%"
          onChange={(v) => set((l) => ({ ...l, transform: { ...l.transform, x: v / 100 } }), "x")}
        />
        <NumberField
          label="Y"
          value={t.y * 100}
          suffix="%"
          onChange={(v) => set((l) => ({ ...l, transform: { ...l.transform, y: v / 100 } }), "y")}
        />
      </div>
      <Slider
        label="Largeur"
        value={t.w}
        min={0.03}
        max={1}
        step={0.005}
        format={(v) => `${Math.round(v * 100)} %`}
        onChange={(v) => set((l) => ({ ...l, transform: { ...l.transform, w: v } }), "w")}
      />
      <Slider
        label="Rotation"
        value={t.rotation}
        min={-180}
        max={180}
        step={1}
        format={(v) => `${Math.round(v)}°`}
        onChange={(v) =>
          set((l) => ({ ...l, transform: { ...l.transform, rotation: v } }), "rotation")
        }
      />
      <Slider
        label="Opacité"
        value={layer.opacity}
        min={0}
        max={1}
        step={0.01}
        format={(v) => `${Math.round(v * 100)} %`}
        onChange={(v) => set((l) => ({ ...l, opacity: v }), "opacity")}
      />
    </div>
  );
}

const inputCls =
  "border-border bg-surface h-9 w-full rounded-md border px-2 text-sm focus:border-action focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <Field label={label}>
      <span className="border-border flex h-9 items-center gap-2 rounded-md border px-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs">{value.toUpperCase()}</span>
      </span>
    </Field>
  );
}

function NumberField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="border-border flex h-9 items-center gap-1 rounded-md border px-2 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        step={0.5}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.min(100, Math.max(0, v)));
        }}
        className="w-full bg-transparent text-right focus:outline-none"
      />
      <span className="text-muted-foreground text-xs">{suffix}</span>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-mono">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-[var(--action)]"
      />
    </label>
  );
}
