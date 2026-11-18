"use client";

import {
  createImageLayer,
  createNumberLayer,
  createTextLayer,
  MATERIAL_CODES,
  type MaterialCode,
} from "@wear3d/design-schema";
import { FABRIC_NAMES, LIGHTING_LABELS, type LightingPreset } from "@wear3d/garment-engine";
import { cn, Switch } from "@wear3d/ui";
import { ArrowRight, Check, ChevronsLeft, ImagePlus, Loader2, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ACCEPTED_TYPES, AssetImportError, ensureImage, importImage } from "@/lib/studio/assets";
import { NUMBER_STYLES, STUDIO_FONTS } from "@/lib/studio/fonts";
import { PATTERNS, patternPreview, PATTERN_PREFIX } from "@/lib/studio/patterns";
import { listAssets, type StoredAsset } from "@/lib/studio/persistence";
import {
  DESIGN_PRESETS,
  PRESET_STYLES,
  presetZoneColor,
  type DesignPreset,
  type PresetStyle,
} from "@/lib/studio/presets";
import { useStudio, type LibraryTab, type RailItem } from "@/lib/studio/store";
import { fabricSwatch } from "@/lib/studio/swatches";
import { ColorPickerPanel, PanelCard, PanelTitle, SelectBox } from "./controls";
import { JerseyThumb } from "./jersey-thumb";

const TITLES: Record<RailItem, string> = {
  design: "Bibliothèque",
  textures: "Bibliothèque",
  logos: "Logos",
  texts: "Textes",
  elements: "Éléments",
  mockups: "Maquettes",
  scenes: "Scènes",
  settings: "Paramètres",
};

export function LeftPanel() {
  const rail = useStudio((s) => s.rail);
  const setOpen = useStudio((s) => s.setLibraryOpen);
  const library = rail === "design" || rail === "textures";
  return (
    <PanelCard className="w-[300px] shrink-0">
      <PanelTitle
        action={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hover:bg-surface-muted rounded-md p-1"
            aria-label="Replier le panneau"
          >
            <ChevronsLeft className="size-5" aria-hidden />
          </button>
        }
      >
        {TITLES[rail]}
      </PanelTitle>
      {library ? (
        <Library />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {rail === "logos" && <LogosPanel />}
          {rail === "texts" && <TextsPanel />}
          {rail === "elements" && <ElementsPanel />}
          {rail === "mockups" && <MockupsPanel />}
          {rail === "scenes" && <ScenesPanel />}
          {rail === "settings" && <SettingsPanel />}
        </div>
      )}
    </PanelCard>
  );
}

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "models", label: "Modèles" },
  { id: "colors", label: "Couleurs" },
  { id: "patterns", label: "Motifs" },
  { id: "fabrics", label: "Tissus" },
];

function Library() {
  const tab = useStudio((s) => s.libraryTab);
  const setTab = useStudio((s) => s.setLibraryTab);
  return (
    <>
      <div className="flex gap-1 px-5 pb-3" role="tablist" aria-label="Bibliothèque">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-sm transition",
              tab === t.id ? "bg-action text-white" : "hover:bg-surface-muted text-[#0b1530]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="border-border mx-5 border-t" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {tab === "models" && <ModelsTab />}
        {tab === "colors" && <ColorsTab />}
        {tab === "patterns" && <PatternsTab />}
        {tab === "fabrics" && <FabricsTab />}
      </div>
    </>
  );
}

/* ---------- Modèles ---------- */

function isApplied(preset: DesignPreset): boolean {
  const s = useStudio.getState();
  const doc = s.doc;
  if (!doc || !s.definition) return false;
  return s.definition.zones.every((z) => {
    const st = doc.zones[z.code];
    if (!st || st.color.toUpperCase() !== presetZoneColor(preset, z.code).toUpperCase())
      return false;
    if (!z.code.startsWith("BODY")) return true;
    return (st.pattern?.assetId ?? null) === (preset.pattern?.assetId ?? null);
  });
}

function applyPreset(preset: DesignPreset) {
  const s = useStudio.getState();
  if (!s.definition) return;
  s.seal();
  s.update((doc) => {
    const zones = { ...doc.zones };
    for (const z of s.definition!.zones) {
      const style = zones[z.code];
      if (!style) continue;
      const body = z.code.startsWith("BODY");
      const next = {
        ...style,
        color: presetZoneColor(preset, z.code),
        material: z.allows.includes("material") ? preset.material : style.material,
      };
      if (body && preset.pattern) {
        zones[z.code] = { ...next, pattern: { offsetX: 0, offsetY: 0, ...preset.pattern } };
      } else {
        const { pattern: _p, ...rest } = next;
        zones[z.code] = body
          ? rest
          : { ...rest, ...(style.pattern ? { pattern: style.pattern } : {}) };
      }
    }
    return { ...doc, zones };
  });
  s.seal();
}

function ModelsTab() {
  const definition = useStudio((s) => s.definition);
  useStudio((s) => s.doc); // re-rendu quand le document change (coche « appliqué »)
  const [style, setStyle] = useState<PresetStyle | "all">("sport");
  const category = definition?.family ?? "tshirts";
  const presets = DESIGN_PRESETS.filter((p) => style === "all" || p.style === style);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[80px_1fr] items-center gap-x-2 gap-y-3 whitespace-nowrap text-sm">
        <span>Catégorie :</span>
        <SelectBox
          ariaLabel="Catégorie"
          value={category}
          onChange={() => undefined}
          options={[
            { value: "football", label: "Maillots", disabled: true },
            { value: "tshirts", label: "T-shirts" },
            { value: "hoodies", label: "Hoodies", disabled: true },
          ]}
        />
        <span>Style :</span>
        <SelectBox
          ariaLabel="Style"
          value={style}
          onChange={(v) => setStyle(v as PresetStyle | "all")}
          options={[
            { value: "all", label: "Tous" },
            ...Object.entries(PRESET_STYLES).map(([value, label]) => ({ value, label })),
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {presets.map((p) => {
          const applied = isApplied(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              aria-pressed={applied}
              title={p.label}
              className={cn(
                "hover:border-action/50 relative aspect-[9/10] overflow-hidden rounded-xl border-2 bg-gradient-to-b from-[#eef2fa] to-[#dfe6f3] transition",
                applied
                  ? "border-action shadow-[0_0_0_3px_rgba(31,94,255,0.15)]"
                  : "border-transparent",
              )}
            >
              <JerseyThumb
                body={p.body}
                sleeves={p.sleeves}
                collar={p.collar}
                pattern={p.pattern}
                className="size-full p-1.5 drop-shadow-md"
              />
              {applied && (
                <span className="bg-action absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-white">
                  <Check className="size-4" aria-hidden />
                </span>
              )}
              <span className="sr-only">{p.label}</span>
            </button>
          );
        })}
      </div>
      <Link
        href="/catalogue"
        className="border-border text-action hover:bg-action-soft flex h-11 items-center justify-center gap-2 rounded-xl border bg-white text-[15px] font-semibold"
      >
        Voir plus de modèles <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/* ---------- Couleurs ---------- */

function ZoneChips() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const selectedZone = useStudio((s) => s.selectedZone);
  const selectZone = useStudio((s) => s.selectZone);
  return (
    <div className="flex flex-col gap-1.5">
      {definition?.zones.map((z) => (
        <button
          key={z.code}
          type="button"
          onClick={() => selectZone(z.code)}
          onMouseEnter={() => useStudio.getState().setHoveredZone(z.code)}
          onMouseLeave={() => useStudio.getState().setHoveredZone(null)}
          aria-pressed={selectedZone === z.code}
          className={cn(
            "flex h-10 items-center justify-between rounded-lg border px-3 text-sm",
            selectedZone === z.code
              ? "border-action bg-action-soft"
              : "border-border hover:bg-surface-muted bg-white",
          )}
        >
          {z.label}
          <span
            className="size-5 rounded-md border border-black/10"
            style={{ background: doc?.zones[z.code]?.color }}
          />
        </button>
      ))}
    </div>
  );
}

function ColorsTab() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const selectedZone = useStudio((s) => s.selectedZone);
  const recent = useStudio((s) => s.recentColors);
  const zone = selectedZone ?? definition?.zones[0]?.code;
  const color = (zone && doc?.zones[zone]?.color) || "#FFFFFF";
  const { setZoneColor, setZonesColor, pushRecentColor, seal } = useStudio.getState();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs font-medium">Zones du vêtement</p>
      <ZoneChips />
      {zone && (
        <ColorPickerPanel
          value={color}
          recent={recent}
          onChange={(c) => setZoneColor(zone, c)}
          onCommit={(c) => {
            pushRecentColor(c);
            seal();
          }}
        />
      )}
      <button
        type="button"
        onClick={() =>
          definition &&
          setZonesColor(
            definition.zones.map((z) => z.code),
            color,
          )
        }
        className="border-border hover:bg-surface-muted h-10 rounded-lg border bg-white text-sm font-semibold"
      >
        Appliquer à toutes les zones
      </button>
    </div>
  );
}

/* ---------- Motifs ---------- */

function PatternsTab() {
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const selectedZone = useStudio((s) => s.selectedZone);
  const [target, setTarget] = useState<"body" | "zone">("body");
  const bodyZones =
    definition?.zones
      .filter((z) => z.code.startsWith("BODY") && z.allows.includes("pattern"))
      .map((z) => z.code) ?? [];
  const zones = target === "body" || !selectedZone ? bodyZones : [selectedZone];
  const base = doc?.zones[zones[0] ?? ""]?.color ?? "#1D4ED8";
  const current = doc?.zones[zones[0] ?? ""]?.pattern;
  const previews = useMemo(
    () =>
      Object.fromEntries(
        PATTERNS.map((p) => [
          p.code,
          patternPreview(`${PATTERN_PREFIX}${p.code}`, "#FFFFFF", base),
        ]),
      ),
    [base],
  );
  const { setZonesPattern } = useStudio.getState();
  return (
    <div className="flex flex-col gap-4">
      <SelectBox
        ariaLabel="Zones concernées"
        value={target}
        onChange={(v) => setTarget(v as "body" | "zone")}
        options={[
          { value: "body", label: "Corps (devant + dos)" },
          { value: "zone", label: "Zone sélectionnée" },
        ]}
      />
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setZonesPattern(zones, undefined)}
          aria-pressed={!current}
          className={cn(
            "flex aspect-square items-center justify-center rounded-xl border-2 bg-white text-xs",
            !current ? "border-action" : "border-border",
          )}
        >
          Aucun
        </button>
        {PATTERNS.map((p) => {
          const id = `${PATTERN_PREFIX}${p.code}`;
          const active = current?.assetId === id;
          return (
            <button
              key={p.code}
              type="button"
              title={p.label}
              aria-pressed={active}
              onClick={() =>
                setZonesPattern(zones, {
                  assetId: id,
                  mode: p.mode,
                  color: current?.color ?? "#FFFFFF",
                  scale: 1,
                  rotation: 0,
                  offsetX: 0,
                  offsetY: 0,
                  opacity: current?.opacity ?? 0.85,
                })
              }
              className={cn(
                "aspect-square overflow-hidden rounded-xl border-2",
                active ? "border-action" : "border-transparent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[p.code]} alt={p.label} className="size-full object-cover" />
            </button>
          );
        })}
      </div>
      {current && (
        <p className="text-muted-foreground text-xs">
          Réglez la couleur, l&apos;échelle et l&apos;opacité du motif dans l&apos;inspecteur
          (calque « Motif graphique »).
        </p>
      )}
    </div>
  );
}

/* ---------- Tissus ---------- */

function FabricsTab() {
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const selectedZone = useStudio((s) => s.selectedZone);
  const [all, setAll] = useState(true);
  const zone = selectedZone ?? definition?.zones[0]?.code ?? "";
  const current = doc?.zones[zone]?.material;
  const color = doc?.zones[zone]?.color ?? "#1D4ED8";
  const allowed = MATERIAL_CODES.filter((m) => definition?.materials.includes(m));
  const apply = (m: MaterialCode) => {
    const zones = all
      ? (definition?.zones.filter((z) => z.allows.includes("material")).map((z) => z.code) ?? [])
      : [zone];
    useStudio.getState().setZonesMaterial(zones, m);
  };
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-between text-sm">
        Appliquer à tout le vêtement
        <Switch checked={all} onCheckedChange={setAll} />
      </label>
      {!all && <ZoneChips />}
      {allowed.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => apply(m)}
          aria-pressed={current === m}
          className={cn(
            "flex items-center gap-3 rounded-xl border-2 bg-white p-2 text-left",
            current === m ? "border-action" : "hover:border-border border-transparent",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fabricSwatch(m, color)} alt="" className="size-12 rounded-lg" />
          <span>
            <span className="block text-sm font-semibold">{FABRIC_NAMES[m].name}</span>
            <span className="text-muted-foreground block text-xs">{FABRIC_NAMES[m].subtitle}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Autres panneaux du rail ---------- */

function targetZone(capability: "text" | "image", fallback: string): string {
  const s = useStudio.getState();
  const zone = s.definition?.zones.find((z) => z.code === s.selectedZone);
  return zone?.allows.includes(capability) ? zone.code : fallback;
}

function LogosPanel() {
  const addLayer = useStudio((s) => s.addLayer);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const refresh = async () => {
    const list = (await listAssets()).filter((a) => !a.id.startsWith(PATTERN_PREFIX));
    setAssets(list);
    const entries = await Promise.all(
      list.map(async (a) => {
        const img = await ensureImage(a.id);
        return [a.id, img ? (img.image as HTMLImageElement).src : ""] as const;
      }),
    );
    setUrls(Object.fromEntries(entries));
  };
  useEffect(() => {
    void refresh();
  }, []);

  const place = (asset: StoredAsset) => {
    const layer = createImageLayer(targetZone("image", "BODY_FRONT"), asset.id);
    layer.name = asset.name.replace(/\.[^.]+$/, "");
    addLayer(layer);
  };

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const asset = await importImage(file);
      place(asset);
      await refresh();
    } catch (e) {
      setError(e instanceof AssetImportError ? e.message : "Import impossible");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
        className="border-action/40 bg-action-soft/50 hover:bg-action-soft flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center"
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
      {assets.length > 0 && (
        <>
          <p className="text-muted-foreground text-xs font-medium">
            Vos logos — cliquez pour placer
          </p>
          <div className="grid grid-cols-3 gap-2">
            {assets.map((a) => (
              <button
                key={a.id}
                type="button"
                title={a.name}
                onClick={() => place(a)}
                className="border-border hover:border-action flex aspect-square items-center justify-center rounded-xl border bg-white p-2"
              >
                {urls[a.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urls[a.id]}
                    alt={a.name}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TEXT_PRESETS = [
  { label: "Titre", value: "WEAR3D", size: 0.09, font: "anton" },
  { label: "Sous-titre", value: "STUDIO", size: 0.05, font: "montserrat" },
  { label: "Slogan", value: "Since 2026", size: 0.04, font: "oswald" },
] as const;

function TextsPanel() {
  const addLayer = useStudio((s) => s.addLayer);
  const add = (font: keyof typeof STUDIO_FONTS, value = "WEAR3D", size = 0.08) => {
    const layer = createTextLayer(targetZone("text", "BODY_FRONT"), value);
    layer.text.font = font;
    layer.text.weight = STUDIO_FONTS[font].weight;
    layer.text.size = size;
    layer.text.color = "#FFFFFF";
    addLayer(layer);
  };
  return (
    <div className="flex flex-col gap-3">
      {TEXT_PRESETS.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => add(p.font, p.value, p.size)}
          className="border-border hover:border-action flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-left"
        >
          <span>
            <span className="text-muted-foreground block text-xs">{p.label}</span>
            <span className={cn("block text-xl", STUDIO_FONTS[p.font].className)}>{p.value}</span>
          </span>
          <Plus className="text-muted-foreground size-4" aria-hidden />
        </button>
      ))}
      <p className="text-muted-foreground mt-2 text-xs font-medium">Polices</p>
      {(Object.keys(STUDIO_FONTS) as (keyof typeof STUDIO_FONTS)[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => add(k)}
          className={cn(
            "border-border hover:border-action flex items-center justify-between rounded-xl border bg-white px-4 py-2 text-lg",
            STUDIO_FONTS[k].className,
          )}
        >
          {STUDIO_FONTS[k].label}
          <Plus className="text-muted-foreground size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function ElementsPanel() {
  const addLayer = useStudio((s) => s.addLayer);
  const addNumber = (style: keyof typeof NUMBER_STYLES, withName: boolean) => {
    const font = NUMBER_STYLES[style].font;
    if (withName) {
      const name = createTextLayer("BODY_BACK", "{player.name}");
      name.name = "Nom du joueur";
      name.text.font = font;
      name.text.weight = STUDIO_FONTS[font].weight;
      name.transform = { ...name.transform, x: 0.5, y: 0.18, w: 0.6 };
      addLayer(name);
    }
    const number = createNumberLayer("BODY_BACK", "10");
    number.number.style = style;
    number.transform = { ...number.transform, x: 0.5, y: 0.45, w: 0.42 };
    addLayer(number);
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs font-medium">Numéros sportifs</p>
      {(Object.keys(NUMBER_STYLES) as (keyof typeof NUMBER_STYLES)[]).map((style) => (
        <div
          key={style}
          className="border-border flex items-center gap-3 rounded-xl border bg-white p-2"
        >
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-lg bg-[#0a1638] text-2xl text-white",
              STUDIO_FONTS[NUMBER_STYLES[style].font].className,
            )}
          >
            10
          </span>
          <span className="flex-1 text-sm font-medium">{NUMBER_STYLES[style].label}</span>
          <button
            type="button"
            onClick={() => addNumber(style, false)}
            className="text-action hover:bg-action-soft rounded-md px-2 py-1 text-xs font-semibold"
          >
            Numéro
          </button>
          <button
            type="button"
            onClick={() => addNumber(style, true)}
            className="text-action hover:bg-action-soft rounded-md px-2 py-1 text-xs font-semibold"
          >
            + Nom
          </button>
        </div>
      ))}
      <p className="text-muted-foreground text-xs">
        Le nom utilise le jeton <code className="font-mono">{"{player.name}"}</code>, remplacé par
        l&apos;effectif à l&apos;export groupé (phase 6).
      </p>
    </div>
  );
}

function MockupsPanel() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const update = useStudio((s) => s.update);
  const models = [
    { name: "T-shirt col rond", ref: "TS-CLASSIC", available: true },
    { name: "Maillot de football", ref: "FB-HOME", available: false },
    { name: "Hoodie", ref: "HD-CLASSIC", available: false },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {models.map((m) => (
          <div
            key={m.ref}
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 bg-white p-2",
              definition?.reference === m.ref ? "border-action" : "border-transparent",
              !m.available && "opacity-60",
            )}
          >
            <JerseyThumb body="#E8EDF4" sleeves="#E8EDF4" collar="#94A3B8" className="size-12" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{m.name}</span>
              <span className="text-muted-foreground block font-mono text-[11px]">{m.ref}</span>
            </span>
            {!m.available && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Lock className="size-3" aria-hidden /> Phase 2
              </span>
            )}
          </div>
        ))}
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">Taille</p>
        <div className="flex flex-wrap gap-1.5">
          {definition?.sizes.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={doc?.model.size === size}
              onClick={() => update((d) => ({ ...d, model: { ...d.model, size } }))}
              className={cn(
                "min-w-10 rounded-lg border px-2 py-1.5 text-sm",
                doc?.model.size === size
                  ? "border-action bg-action-soft text-action"
                  : "border-border bg-white",
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const SCENE_BG: Record<LightingPreset, string> = {
  studio: "from-[#f3f6fc] to-[#d9e3f5]",
  outdoor: "from-[#bcd3f2] to-[#f5ead7]",
  showroom: "from-[#1a2752] to-[#070d1f]",
};

function ScenesPanel() {
  const lighting = useStudio((s) => s.lighting);
  const setLighting = useStudio((s) => s.setLighting);
  const showPodium = useStudio((s) => s.showPodium);
  const setShowPodium = useStudio((s) => s.setShowPodium);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(LIGHTING_LABELS) as LightingPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={lighting === p}
            onClick={() => setLighting(p)}
            className={cn(
              "flex h-16 items-end rounded-xl border-2 bg-gradient-to-br p-3 text-left text-sm font-semibold",
              SCENE_BG[p],
              p === "showroom" ? "text-white" : "text-[#0b1530]",
              lighting === p ? "border-action" : "border-transparent",
            )}
          >
            {LIGHTING_LABELS[p]}
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between text-sm">
        Podium lumineux
        <Switch checked={showPodium} onCheckedChange={setShowPodium} />
      </label>
    </div>
  );
}

const SHORTCUTS = [
  ["Ctrl + Z", "Annuler"],
  ["Ctrl + Y", "Rétablir"],
  ["Ctrl + D", "Dupliquer"],
  ["Suppr", "Supprimer"],
  ["Flèches", "Déplacer (Maj = ×4)"],
  ["Échap", "Désélectionner"],
] as const;

function SettingsPanel() {
  return (
    <div className="flex flex-col gap-4">
      <MockupsPanelSizes />
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">Raccourcis clavier</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>
                <kbd className="border-border rounded border bg-white px-1.5 py-0.5 font-mono text-xs">
                  {k}
                </kbd>
              </dt>
              <dd className="text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function MockupsPanelSizes() {
  const definition = useStudio((s) => s.definition);
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-medium">Zones du modèle</p>
      <ul className="flex flex-col gap-1 text-sm">
        {definition?.zones.map((z) => (
          <li key={z.code} className="flex justify-between">
            {z.label}
            <span className="text-muted-foreground font-mono text-xs">{z.code}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
