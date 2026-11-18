"use client";

import {
  createImageLayer,
  createNumberLayer,
  createTextLayer,
  MATERIAL_CODES,
} from "@wear3d/design-schema";
import { LIGHTING_LABELS, MATERIAL_PRESETS, type LightingPreset } from "@wear3d/garment-engine";
import { Button, cn } from "@wear3d/ui";
import { ChevronRight, Hash, ImagePlus, Loader2, Plus, Type, X } from "lucide-react";
import { useRef, useState } from "react";
import { ACCEPTED_TYPES, AssetImportError, importImage } from "@/lib/studio/assets";
import { NUMBER_STYLES, STUDIO_FONTS } from "@/lib/studio/fonts";
import { useStudio, type ToolId } from "@/lib/studio/store";
import { ColorPicker } from "./color-picker";

const TITLES: Record<ToolId, string> = {
  model: "Modèle",
  colors: "Couleurs",
  materials: "Matières",
  texts: "Textes",
  images: "Images et logos",
  numbers: "Numéros",
  ai: "Assistant IA",
};

/** Panneau de l'outil actif (280 px, repliable — CDC §7.2). */
export function ToolPanel() {
  const tool = useStudio((s) => s.tool);
  const setTool = useStudio((s) => s.setTool);
  if (!tool) return null;
  return (
    <aside
      className="border-border bg-surface shadow-card absolute inset-y-0 left-0 z-10 flex w-[280px] flex-col border-r md:static md:shadow-none"
      aria-label={TITLES[tool]}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="font-display text-lg font-bold">{TITLES[tool]}</h2>
        <button
          type="button"
          onClick={() => setTool(null)}
          className="hover:bg-surface-muted rounded-md p-1"
          aria-label="Fermer le panneau"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tool === "model" && <ModelPanel />}
        {tool === "colors" && <ColorsPanel />}
        {tool === "materials" && <MaterialsPanel />}
        {tool === "texts" && <TextsPanel />}
        {tool === "images" && <ImagesPanel />}
        {tool === "numbers" && <NumbersPanel />}
      </div>
    </aside>
  );
}

function ZoneList({ capability }: { capability?: "text" | "image" }) {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const selectedZone = useStudio((s) => s.selectedZone);
  const selectZone = useStudio((s) => s.selectZone);
  const zones = definition?.zones.filter((z) => !capability || z.allows.includes(capability)) ?? [];
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-xs font-medium">Zones du vêtement</p>
      {zones.map((z) => (
        <button
          key={z.code}
          type="button"
          onClick={() => selectZone(z.code)}
          aria-pressed={selectedZone === z.code}
          onMouseEnter={() => useStudio.getState().setHoveredZone(z.code)}
          onMouseLeave={() => useStudio.getState().setHoveredZone(null)}
          className={cn(
            "border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm transition",
            selectedZone === z.code ? "border-action bg-action-soft" : "hover:bg-surface-muted",
          )}
        >
          {z.label}
          <span className="flex items-center gap-1">
            <span
              className="border-border size-5 rounded border"
              style={{ background: doc?.zones[z.code]?.color }}
              aria-hidden
            />
            <ChevronRight className="text-muted-foreground size-4" aria-hidden />
          </span>
        </button>
      ))}
    </div>
  );
}

function ModelPanel() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const lighting = useStudio((s) => s.lighting);
  const setLighting = useStudio((s) => s.setLighting);
  const update = useStudio((s) => s.update);
  if (!definition || !doc) return null;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-semibold">{definition.name}</p>
        <p className="text-muted-foreground font-mono text-xs">{definition.reference}</p>
      </div>
      <fieldset>
        <legend className="text-muted-foreground mb-2 text-xs font-medium">Taille</legend>
        <div className="flex flex-wrap gap-1.5">
          {definition.sizes.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={doc.model.size === size}
              onClick={() => update((d) => ({ ...d, model: { ...d.model, size } }))}
              className={cn(
                "border-border min-w-10 rounded-md border px-2 py-1.5 text-sm",
                doc.model.size === size
                  ? "border-action bg-action-soft text-action"
                  : "hover:bg-surface-muted",
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-muted-foreground mb-2 text-xs font-medium">Éclairage</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(LIGHTING_LABELS) as LightingPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={lighting === p}
              onClick={() => setLighting(p)}
              className={cn(
                "border-border rounded-md border px-2 py-1.5 text-xs",
                lighting === p
                  ? "border-action bg-action-soft text-action"
                  : "hover:bg-surface-muted",
              )}
            >
              {LIGHTING_LABELS[p]}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function ColorsPanel() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const selectedZone = useStudio((s) => s.selectedZone);
  const recent = useStudio((s) => s.recentColors);
  const { setZoneColor, setZonesColor, pushRecentColor, seal } = useStudio.getState();
  const zone = selectedZone ?? definition?.zones[0]?.code;
  const color = (zone && doc?.zones[zone]?.color) || "#FFFFFF";
  return (
    <div className="flex flex-col gap-5">
      <ZoneList />
      {zone && (
        <ColorPicker
          value={color}
          recent={recent}
          onChange={(c) => setZoneColor(zone, c)}
          onCommit={(c) => {
            pushRecentColor(c);
            seal();
          }}
        />
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          definition &&
          setZonesColor(
            definition.zones.map((z) => z.code),
            color,
          )
        }
      >
        Appliquer à toutes les zones
      </Button>
    </div>
  );
}

function MaterialsPanel() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const selectedZone = useStudio((s) => s.selectedZone);
  const setZoneMaterial = useStudio((s) => s.setZoneMaterial);
  const zone = selectedZone ?? definition?.zones[0]?.code;
  const current = zone ? doc?.zones[zone]?.material : undefined;
  const allowed = MATERIAL_CODES.filter((m) => definition?.materials.includes(m));
  return (
    <div className="flex flex-col gap-5">
      <ZoneList />
      <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Matière de la zone">
        {allowed.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={current === m}
            onClick={() => zone && setZoneMaterial(zone, m)}
            className={cn(
              "border-border rounded-md border px-3 py-2 text-left text-sm",
              current === m ? "border-action bg-action-soft text-action" : "hover:bg-surface-muted",
            )}
          >
            {MATERIAL_PRESETS[m].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function targetZone(capability: "text" | "image", fallback: string): string {
  const s = useStudio.getState();
  const zone = s.definition?.zones.find((z) => z.code === s.selectedZone);
  return zone?.allows.includes(capability) ? zone.code : fallback;
}

function TextsPanel() {
  const addLayer = useStudio((s) => s.addLayer);
  return (
    <div className="flex flex-col gap-5">
      <ZoneList capability="text" />
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium">Ajouter un texte</p>
        {(Object.keys(STUDIO_FONTS) as (keyof typeof STUDIO_FONTS)[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              const layer = createTextLayer(targetZone("text", "BODY_FRONT"), "WEAR3D");
              layer.text.font = key;
              layer.text.weight = STUDIO_FONTS[key].weight;
              layer.text.color = "#14243B";
              addLayer(layer);
            }}
            className={cn(
              "border-border hover:border-action flex items-center justify-between rounded-md border px-3 py-2 text-left text-xl",
              STUDIO_FONTS[key].className,
            )}
          >
            {STUDIO_FONTS[key].label}
            <Plus className="text-muted-foreground size-4" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

function NumbersPanel() {
  const addLayer = useStudio((s) => s.addLayer);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-sm">
        Nom et numéro au dos. Les jetons{" "}
        <code className="font-mono text-xs">{"{player.name}"}</code> seront remplacés par
        l&apos;effectif (phase 6).
      </p>
      {(Object.keys(NUMBER_STYLES) as (keyof typeof NUMBER_STYLES)[]).map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => {
            const name = createTextLayer("BODY_BACK", "NOM");
            name.text.font = NUMBER_STYLES[style].font;
            name.text.weight = STUDIO_FONTS[NUMBER_STYLES[style].font].weight;
            name.text.color = "#14243B";
            name.transform = { x: 0.5, y: 0.2, w: 0.6, rotation: 0 };
            const number = createNumberLayer("BODY_BACK", "10");
            number.number.style = style;
            number.number.color = "#14243B";
            number.transform = { x: 0.5, y: 0.45, w: 0.42, rotation: 0 };
            addLayer(name);
            addLayer(number);
          }}
          className="border-border hover:border-action flex items-center gap-3 rounded-md border px-3 py-2 text-left"
        >
          <span
            className={cn(
              "bg-brand-navy-900 flex size-12 items-center justify-center rounded-md text-2xl text-white",
              STUDIO_FONTS[NUMBER_STYLES[style].font].className,
            )}
          >
            10
          </span>
          <span className="text-sm font-medium">{NUMBER_STYLES[style].label}</span>
          <Hash className="text-muted-foreground ml-auto size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function ImagesPanel() {
  const addLayer = useStudio((s) => s.addLayer);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const asset = await importImage(file);
      const layer = createImageLayer(targetZone("image", "BODY_FRONT"), asset.id);
      layer.name = asset.name;
      addLayer(layer);
    } catch (e) {
      setError(e instanceof AssetImportError ? e.message : "Import impossible");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ZoneList capability="image" />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
        className="border-action/40 bg-action-soft/40 hover:bg-action-soft flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center"
      >
        {busy ? (
          <Loader2 className="text-action size-7 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="text-action size-7" aria-hidden />
        )}
        <span className="text-action text-sm font-semibold">Importer un logo</span>
        <span className="text-muted-foreground text-xs">PNG, JPG ou SVG — 20 Mo maximum</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => void onFiles(e.target.files)}
      />
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Type className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Glissez ensuite le logo directement sur le vêtement pour le placer.
      </p>
    </div>
  );
}
