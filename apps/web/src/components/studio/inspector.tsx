"use client";

import {
  BLEND_MODES,
  layerLabel,
  MATERIAL_CODES,
  type BlendMode,
  type Layer,
} from "@wear3d/design-schema";
import { effectiveDpi, layerSizePx, MIN_PRINT_DPI, zoneRectPx } from "@wear3d/editor-2d";
import { ATLAS_SIZE, FABRIC_NAMES } from "@wear3d/garment-engine";
import { cn, Slider, Switch } from "@wear3d/ui";
import {
  ChevronsRight,
  Contrast,
  FlipHorizontal2,
  FlipVertical2,
  Link2,
  Lock,
  LockOpen,
  RotateCw,
  Trash2,
  TriangleAlert,
  Unlink2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getCachedImage } from "@/lib/studio/assets";
import { useAtlas } from "@/lib/studio/atlas";
import { NUMBER_STYLES, STUDIO_FONTS } from "@/lib/studio/fonts";
import { PATTERNS, patternPreview, PATTERN_PREFIX } from "@/lib/studio/patterns";
import { patternZones, useSelectedLayer, useStudio } from "@/lib/studio/store";
import { ColorField, NumberBox, PanelCard, PanelTitle, Section, SelectBox } from "./controls";

const BLEND_LABELS: Record<BlendMode, string> = {
  normal: "Normal",
  multiply: "Produit",
  screen: "Superposition claire",
  overlay: "Incrustation",
  darken: "Assombrir",
  lighten: "Éclaircir",
};

const EXPORT = ATLAS_SIZE.export;

export function Inspector() {
  useAtlas((s) => s.version); // vignettes et dpi à jour une fois les images chargées
  const setOpen = useStudio((s) => s.setInspectorOpen);
  const selection = useStudio((s) => s.selection);
  const layer = useSelectedLayer();
  return (
    <PanelCard className="w-[300px] shrink-0">
      <PanelTitle
        action={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hover:bg-surface-muted rounded-md p-1"
            aria-label="Replier l'inspecteur"
          >
            <ChevronsRight className="size-5" aria-hidden />
          </button>
        }
      >
        Inspecteur
      </PanelTitle>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {layer && <LayerInspector key={layer.id} layer={layer} />}
        {selection?.kind === "base" && <BaseInspector />}
        {selection?.kind === "pattern" && <PatternInspector />}
        {!selection && (
          <p className="text-muted-foreground px-5 text-sm">
            Sélectionnez un calque, un élément sur le vêtement ou la couleur de base.
          </p>
        )}
      </div>
    </PanelCard>
  );
}

/* ---------- Calque ---------- */

function useLayerUpdate(layer: Layer) {
  const { updateLayer } = useStudio.getState();
  return (patch: (l: Layer) => Layer, key: string) =>
    updateLayer(layer.id, patch, `${key}:${layer.id}`);
}

function LayerInspector({ layer }: { layer: Layer }) {
  const definition = useStudio((s) => s.definition);
  const recent = useStudio((s) => s.recentColors);
  const { seal, removeLayer, pushRecentColor } = useStudio.getState();
  const set = useLayerUpdate(layer);
  const zone = definition?.zones.find((z) => z.code === layer.zone);
  const zonePx = zone
    ? zoneRectPx({ code: zone.code, ...zone.uvRect }, EXPORT)
    : { x: 0, y: 0, w: 1, h: 1 };
  const aspect = (id: string) => {
    const img = getCachedImage(id);
    return img ? img.width / img.height : undefined;
  };
  const size = layerSizePx(layer, zonePx, aspect);
  const [linked, setLinked] = useState(true);
  const t = layer.transform;
  const commitColor = (c: string) => {
    pushRecentColor(c);
    seal();
  };

  let dpiWarning: number | null = null;
  if (layer.type === "image" && zone?.printAreaMm) {
    const src = getCachedImage(layer.assetId);
    if (src) {
      const dpi = effectiveDpi(src.width, t.w, zone.printAreaMm.w);
      if (dpi < MIN_PRINT_DPI) dpiWarning = Math.round(dpi);
    }
  }

  const setW = (px: number) =>
    set((l) => {
      const w = Math.max(1, px) / zonePx.w;
      const ratio = w / l.transform.w;
      return {
        ...l,
        transform: {
          ...l.transform,
          w,
          ...(linked && l.transform.h !== undefined ? { h: l.transform.h * ratio } : {}),
        },
      };
    }, "w");

  const setH = (px: number) =>
    set((l) => {
      const h = Math.max(1, px) / zonePx.h;
      if (linked) {
        const ratio = Math.max(1, px) / Math.max(1, size.h);
        return {
          ...l,
          transform: {
            ...l.transform,
            w: l.transform.w * ratio,
            ...(l.transform.h !== undefined ? { h } : {}),
          },
        };
      }
      return { ...l, transform: { ...l.transform, h } };
    }, "h");

  return (
    <div onPointerUp={seal}>
      <div className="flex items-center gap-3 px-5 pb-4">
        <LayerIcon layer={layer} />
        <input
          value={layer.name ?? layerLabel(layer)}
          onChange={(e) => set((l) => ({ ...l, name: e.target.value.slice(0, 80) }), "name")}
          onBlur={seal}
          aria-label="Nom du calque"
          className="focus:border-action min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[17px] font-semibold text-[#0b1530] outline-none"
        />
        <button
          type="button"
          aria-label={layer.locked ? "Déverrouiller" : "Verrouiller"}
          aria-pressed={layer.locked}
          onClick={() => {
            seal();
            set((l) => ({ ...l, locked: !l.locked }), "lock");
            seal();
          }}
          className="hover:bg-surface-muted rounded-md p-1 text-[#0b1530]"
        >
          {layer.locked ? (
            <Lock className="size-5" aria-hidden />
          ) : (
            <LockOpen className="size-5" aria-hidden />
          )}
        </button>
      </div>

      {dpiWarning !== null && (
        <p
          role="alert"
          className="bg-accent-amber-soft mx-5 mb-3 flex gap-2 rounded-lg p-2 text-xs"
        >
          <TriangleAlert className="text-warning size-4 shrink-0" aria-hidden />
          Résolution insuffisante pour l&apos;impression : {dpiWarning} dpi (minimum {MIN_PRINT_DPI}
          ).
        </p>
      )}

      {layer.type === "text" && (
        <Section title="Texte">
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
            onBlur={seal}
            aria-label="Contenu du texte"
            className="border-border focus:border-action h-10 rounded-lg border bg-white px-3 text-sm outline-none"
          />
          <SelectBox
            ariaLabel="Police"
            value={layer.text.font}
            onChange={(v) => {
              const k = v as keyof typeof STUDIO_FONTS;
              seal();
              set(
                (l) =>
                  l.type === "text"
                    ? { ...l, text: { ...l.text, font: k, weight: STUDIO_FONTS[k].weight } }
                    : l,
                "font",
              );
              seal();
            }}
            options={Object.entries(STUDIO_FONTS).map(([value, f]) => ({ value, label: f.label }))}
          />
          <LabeledSlider
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
          <LabeledSlider
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
        </Section>
      )}

      {layer.type === "number" && (
        <Section title="Numéro">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={layer.number.value}
              inputMode="numeric"
              maxLength={3}
              aria-label="Numéro"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                set(
                  (l) => (l.type === "number" ? { ...l, number: { ...l.number, value: v } } : l),
                  "value",
                );
              }}
              onBlur={seal}
              className="border-border focus:border-action h-10 rounded-lg border bg-white px-3 text-sm outline-none"
            />
            <SelectBox
              ariaLabel="Style de numéro"
              value={layer.number.style}
              onChange={(v) => {
                seal();
                set(
                  (l) => (l.type === "number" ? { ...l, number: { ...l.number, style: v } } : l),
                  "style",
                );
                seal();
              }}
              options={Object.entries(NUMBER_STYLES).map(([value, s]) => ({
                value,
                label: s.label,
              }))}
            />
          </div>
        </Section>
      )}

      <Section title="Transformation">
        <div className="grid grid-cols-2 gap-3">
          <NumberBox
            label="X"
            unit="px"
            value={Math.round(t.x * zonePx.w)}
            onChange={(v) =>
              set((l) => ({ ...l, transform: { ...l.transform, x: v / zonePx.w } }), "x")
            }
          />
          <NumberBox
            label="Y"
            unit="px"
            value={Math.round(t.y * zonePx.h)}
            onChange={(v) =>
              set((l) => ({ ...l, transform: { ...l.transform, y: v / zonePx.h } }), "y")
            }
          />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumberBox label="W" unit="px" value={Math.round(size.w)} min={1} onChange={setW} />
          <button
            type="button"
            onClick={() => setLinked(!linked)}
            aria-pressed={linked}
            aria-label={linked ? "Délier largeur et hauteur" : "Lier largeur et hauteur"}
            className={cn("rounded-md p-1", linked ? "text-action" : "text-muted-foreground")}
          >
            {linked ? (
              <Link2 className="size-5" aria-hidden />
            ) : (
              <Unlink2 className="size-5" aria-hidden />
            )}
          </button>
          <NumberBox label="H" unit="px" value={Math.round(size.h)} min={1} onChange={setH} />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-sm text-[#0b1530]">Rotation</span>
          <NumberBox
            label={<RotateCw className="size-4" aria-hidden />}
            unit="°"
            value={Math.round(t.rotation)}
            min={-360}
            max={360}
            onChange={(v) =>
              set((l) => ({ ...l, transform: { ...l.transform, rotation: v } }), "rotation")
            }
            className="flex-1"
          />
          <button
            type="button"
            aria-label="Symétrie horizontale"
            aria-pressed={t.flipX}
            onClick={() => {
              seal();
              set(
                (l) => ({ ...l, transform: { ...l.transform, flipX: !l.transform.flipX } }),
                "flipX",
              );
              seal();
            }}
            className={cn(
              "border-border flex size-10 items-center justify-center rounded-lg border bg-white",
              t.flipX && "border-action text-action",
            )}
          >
            <FlipHorizontal2 className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Symétrie verticale"
            aria-pressed={t.flipY}
            onClick={() => {
              seal();
              set(
                (l) => ({ ...l, transform: { ...l.transform, flipY: !l.transform.flipY } }),
                "flipY",
              );
              seal();
            }}
            className={cn(
              "border-border flex size-10 items-center justify-center rounded-lg border bg-white",
              t.flipY && "border-action text-action",
            )}
          >
            <FlipVertical2 className="size-5" aria-hidden />
          </button>
        </div>
      </Section>

      <Section title="Apparence">
        <span className="text-sm text-[#0b1530]">Opacité</span>
        <div className="flex items-center gap-3">
          <Slider
            value={[Math.round(layer.opacity * 100)]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => set((l) => ({ ...l, opacity: (v ?? 100) / 100 }), "opacity")}
            onValueCommit={() => seal()}
            aria-label="Opacité"
          />
          <NumberBox
            value={Math.round(layer.opacity * 100)}
            unit="%"
            min={0}
            max={100}
            onChange={(v) => set((l) => ({ ...l, opacity: v / 100 }), "opacity")}
            className="w-[74px] shrink-0"
          />
        </div>
        <span className="text-sm text-[#0b1530]">Mode de fusion</span>
        <SelectBox
          ariaLabel="Mode de fusion"
          value={layer.blendMode}
          onChange={(v) => {
            seal();
            set((l) => ({ ...l, blendMode: v as BlendMode }), "blend");
            seal();
          }}
          options={BLEND_MODES.map((m) => ({ value: m, label: BLEND_LABELS[m] }))}
        />
      </Section>

      <Section title="Effets">
        {(
          [
            ["shadow", "Ombre portée"],
            ["outline", "Contour"],
            ["glow", "Lueur"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-[15px] text-[#0b1530]">
            <Contrast className="size-5" aria-hidden />
            <span className="flex-1">{label}</span>
            <Switch
              checked={layer.effects[key].enabled}
              onCheckedChange={(enabled) => {
                seal();
                set(
                  (l) => ({
                    ...l,
                    effects: { ...l.effects, [key]: { ...l.effects[key], enabled } },
                  }),
                  `fx-${key}`,
                );
                seal();
              }}
            />
          </label>
        ))}
      </Section>

      <Section title="Couleur" defaultOpen={false}>
        {(layer.type === "text" || layer.type === "number") && (
          <ColorField
            label="Remplissage"
            value={layer.type === "text" ? layer.text.color : layer.number.color}
            recent={recent}
            onChange={(c) =>
              set(
                (l) =>
                  l.type === "text"
                    ? { ...l, text: { ...l.text, color: c } }
                    : l.type === "number"
                      ? { ...l, number: { ...l.number, color: c } }
                      : l,
                "fill",
              )
            }
            onCommit={commitColor}
          />
        )}
        <ColorField
          label="Contour"
          value={layer.effects.outline.color}
          recent={recent}
          onChange={(c) =>
            set(
              (l) => ({
                ...l,
                effects: { ...l.effects, outline: { ...l.effects.outline, color: c } },
              }),
              "outline-color",
            )
          }
          onCommit={commitColor}
        />
        <ColorField
          label="Lueur"
          value={layer.effects.glow.color}
          recent={recent}
          onChange={(c) =>
            set(
              (l) => ({ ...l, effects: { ...l.effects, glow: { ...l.effects.glow, color: c } } }),
              "glow-color",
            )
          }
          onCommit={commitColor}
        />
        <ColorField
          label="Ombre"
          value={layer.effects.shadow.color}
          recent={recent}
          onChange={(c) =>
            set(
              (l) => ({
                ...l,
                effects: { ...l.effects, shadow: { ...l.effects.shadow, color: c } },
              }),
              "shadow-color",
            )
          }
          onCommit={commitColor}
        />
      </Section>

      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={() => removeLayer(layer.id)}
          className="text-danger hover:bg-danger/10 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold"
        >
          <Trash2 className="size-4" aria-hidden /> Supprimer le calque
        </button>
      </div>
    </div>
  );
}

function LayerIcon({ layer }: { layer: Layer }) {
  if (layer.type === "image") {
    const src = getCachedImage(layer.assetId);
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(src.image as HTMLImageElement).src}
            alt=""
            className="max-h-9 max-w-9 object-contain"
          />
        )}
      </span>
    );
  }
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#0a1638] text-lg font-bold text-white">
      {layer.type === "number" ? layer.number.value || "#" : "T"}
    </span>
  );
}

function LabeledSlider({
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
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-[#0b1530]">{label}</span>
        <span className="font-mono text-xs">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={([v]) => onChange(v ?? value)}
        onValueCommit={() => useStudio.getState().seal()}
      />
    </div>
  );
}

/* ---------- Couleur de base ---------- */

function BaseInspector() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const selectedZone = useStudio((s) => s.selectedZone);
  const recent = useStudio((s) => s.recentColors);
  const { selectZone, setZoneColor, setZonesColor, setZoneMaterial, pushRecentColor, seal } =
    useStudio.getState();
  const zone = selectedZone ?? definition?.zones[0]?.code ?? "";
  const style = doc?.zones[zone];
  if (!definition || !style) return null;
  return (
    <div>
      <div className="flex items-center gap-3 px-5 pb-4">
        <span
          className="size-11 rounded-lg border border-black/5 shadow-sm"
          style={{ background: style.color }}
        />
        <span className="text-[17px] font-semibold text-[#0b1530]">Couleur de base</span>
      </div>
      <Section title="Zone">
        <SelectBox
          ariaLabel="Zone du vêtement"
          value={zone}
          onChange={selectZone}
          options={definition.zones.map((z) => ({ value: z.code, label: z.label }))}
        />
      </Section>
      <Section title="Couleur">
        <ColorField
          label="Couleur de la zone"
          value={style.color}
          recent={recent}
          onChange={(c) => setZoneColor(zone, c)}
          onCommit={(c) => {
            pushRecentColor(c);
            seal();
          }}
        />
        <button
          type="button"
          onClick={() =>
            setZonesColor(
              definition.zones.map((z) => z.code),
              style.color,
            )
          }
          className="border-border hover:bg-surface-muted h-10 rounded-lg border bg-white text-sm font-semibold"
        >
          Appliquer à toutes les zones
        </button>
      </Section>
      <Section title="Tissu">
        <SelectBox
          ariaLabel="Tissu de la zone"
          value={style.material}
          onChange={(v) => setZoneMaterial(zone, v as (typeof MATERIAL_CODES)[number])}
          options={MATERIAL_CODES.filter((m) => definition.materials.includes(m)).map((m) => ({
            value: m,
            label: `${FABRIC_NAMES[m].name} — ${FABRIC_NAMES[m].subtitle}`,
          }))}
        />
      </Section>
    </div>
  );
}

/* ---------- Motif graphique ---------- */

function PatternInspector() {
  const doc = useStudio((s) => s.doc);
  const recent = useStudio((s) => s.recentColors);
  const zones = patternZones(doc);
  const pattern = zones[0] ? doc?.zones[zones[0]]?.pattern : undefined;
  const base = zones[0] ? (doc?.zones[zones[0]]?.color ?? "#1D4ED8") : "#1D4ED8";
  const { setZonesPattern, seal, pushRecentColor } = useStudio.getState();
  const preview = useMemo(
    () => (pattern ? patternPreview(pattern.assetId, pattern.color, base) : ""),
    [pattern, base],
  );
  if (!pattern) {
    return <p className="text-muted-foreground px-5 text-sm">Aucun motif appliqué.</p>;
  }
  const patch = (p: Partial<typeof pattern>, key: string) =>
    setZonesPattern(zones, { ...pattern, ...p }, `pattern-${key}`);
  return (
    <div onPointerUp={seal}>
      <div className="flex items-center gap-3 px-5 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="size-11 rounded-lg shadow-sm" />
        <span className="text-[17px] font-semibold text-[#0b1530]">Motif graphique</span>
      </div>
      <Section title="Motif">
        <SelectBox
          ariaLabel="Motif"
          value={pattern.assetId}
          onChange={(v) => {
            const def = PATTERNS.find((p) => `${PATTERN_PREFIX}${p.code}` === v);
            seal();
            patch({ assetId: v, mode: def?.mode ?? pattern.mode }, "asset");
            seal();
          }}
          options={PATTERNS.map((p) => ({ value: `${PATTERN_PREFIX}${p.code}`, label: p.label }))}
        />
        <SelectBox
          ariaLabel="Disposition"
          value={pattern.mode}
          onChange={(v) => {
            seal();
            patch({ mode: v as "placed" | "repeat" }, "mode");
            seal();
          }}
          options={[
            { value: "placed", label: "Placé (une fois)" },
            { value: "repeat", label: "Répété" },
          ]}
        />
        <ColorField
          label="Couleur du motif"
          value={pattern.color}
          recent={recent}
          onChange={(c) => patch({ color: c }, "color")}
          onCommit={(c) => {
            pushRecentColor(c);
            seal();
          }}
        />
      </Section>
      <Section title="Transformation">
        <LabeledSlider
          label="Échelle"
          value={pattern.scale}
          min={0.2}
          max={3}
          step={0.05}
          format={(v) => `${Math.round(v * 100)} %`}
          onChange={(v) => patch({ scale: v }, "scale")}
        />
        <LabeledSlider
          label="Rotation"
          value={pattern.rotation}
          min={-180}
          max={180}
          step={1}
          format={(v) => `${Math.round(v)}°`}
          onChange={(v) => patch({ rotation: v }, "rotation")}
        />
        <LabeledSlider
          label="Décalage horizontal"
          value={pattern.offsetX}
          min={-0.5}
          max={0.5}
          step={0.01}
          format={(v) => `${Math.round(v * 100)} %`}
          onChange={(v) => patch({ offsetX: v }, "ox")}
        />
        <LabeledSlider
          label="Décalage vertical"
          value={pattern.offsetY}
          min={-0.5}
          max={0.5}
          step={0.01}
          format={(v) => `${Math.round(v * 100)} %`}
          onChange={(v) => patch({ offsetY: v }, "oy")}
        />
      </Section>
      <Section title="Apparence">
        <LabeledSlider
          label="Opacité"
          value={pattern.opacity}
          min={0}
          max={1}
          step={0.01}
          format={(v) => `${Math.round(v * 100)} %`}
          onChange={(v) => patch({ opacity: v }, "opacity")}
        />
      </Section>
      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={() => {
            setZonesPattern(zones, undefined);
            useStudio.getState().select({ kind: "base" });
          }}
          className="text-danger hover:bg-danger/10 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold"
        >
          <Trash2 className="size-4" aria-hidden /> Retirer le motif
        </button>
      </div>
    </div>
  );
}
