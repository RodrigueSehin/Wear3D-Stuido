"use client";

import { MATERIAL_CODES, type MaterialCode } from "@wear3d/design-schema";
import { FABRIC_NAMES } from "@wear3d/garment-engine";
import { cn, Switch } from "@wear3d/ui";
import { ArrowRight, Check, ChevronsLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PATTERNS, patternPreview, PATTERN_PREFIX } from "@/lib/studio/patterns";
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
import { ElementsPanel } from "./elements-panel";
import { LogosPanel } from "./logos-panel";
import { MockupsPanel } from "./mockups-panel";
import { ScenesPanel } from "./scenes-panel";
import { SettingsPanel } from "./settings-panel";
import { TexturesPanel } from "./textures-panel";
import { TextsPanel } from "./texts-panel";

const TITLES: Record<RailItem, string> = {
  design: "Bibliothèque",
  textures: "Textures",
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
  const library = rail === "design";
  const viewMode = useStudio((s) => s.viewMode);
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
        {rail === "design" && viewMode === "2d" ? "Design 2D" : TITLES[rail]}
      </PanelTitle>
      {library && viewMode === "2d" && (
        <p className="text-muted-foreground -mt-2 px-5 pb-3 text-sm leading-snug">
          Personnalisez le design en vue 2D (pour impression, sublimation ou coupe).
        </p>
      )}
      {library ? (
        <Library />
      ) : rail === "textures" ? (
        <TexturesPanel />
      ) : rail === "logos" ? (
        <LogosPanel />
      ) : rail === "texts" ? (
        <TextsPanel />
      ) : rail === "elements" ? (
        <ElementsPanel />
      ) : rail === "settings" ? (
        <SettingsPanel />
      ) : rail === "scenes" ? (
        <ScenesPanel />
      ) : rail === "mockups" ? (
        <MockupsPanel />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5"></div>
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
        zones[z.code] = {
          ...next,
          pattern: { offsetX: 0, offsetY: 0, blendMode: "normal", ...preset.pattern },
        };
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

function ZoneChips({ onPick }: { onPick?: () => void }) {
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
          onClick={() => {
            selectZone(z.code);
            onPick?.();
          }}
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

/** Groupes de couleur du vêtement (maquette « Design 2D ») : corps, manches, col. */
const COLOR_GROUPS = [
  { id: "primary", label: "Principale", match: (c: string) => c.startsWith("BODY") },
  { id: "secondary", label: "Secondaire", match: (c: string) => c.startsWith("SLEEVE") },
  { id: "tertiary", label: "Tertiaire", match: (c: string) => c === "COLLAR" },
] as const;
type ColorGroup = (typeof COLOR_GROUPS)[number]["id"];

function ColorsTab() {
  const definition = useStudio((s) => s.definition);
  const doc = useStudio((s) => s.doc);
  const selectedZone = useStudio((s) => s.selectedZone);
  const recent = useStudio((s) => s.recentColors);
  const [group, setGroup] = useState<ColorGroup | null>("primary");
  const groupZones = (g: ColorGroup) =>
    definition?.zones
      .filter((z) => COLOR_GROUPS.find((x) => x.id === g)!.match(z.code))
      .map((z) => z.code) ?? [];
  const zone = selectedZone ?? definition?.zones[0]?.code;
  const targets = group ? groupZones(group) : zone ? [zone] : [];
  const color = (targets[0] && doc?.zones[targets[0]]?.color) || "#FFFFFF";
  const { setZonesColor, pushRecentColor, seal, update } = useStudio.getState();
  /** Couleur d'un groupe de zones : un geste continu = une étape d'historique. */
  const paint = (c: string) =>
    update(
      (d) => {
        const zones = { ...d.zones };
        for (const code of targets) if (zones[code]) zones[code] = { ...zones[code], color: c };
        return { ...d, zones };
      },
      `color:${targets.join(",")}`,
    );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-[#0b1530]">Couleur du vêtement</p>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_GROUPS.map((g) => {
          const codes = groupZones(g.id);
          const c = (codes[0] && doc?.zones[codes[0]]?.color) || "#FFFFFF";
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              disabled={codes.length === 0}
              onClick={() => setGroup(g.id)}
              className="flex flex-col items-start gap-1 text-xs text-[#0b1530] disabled:opacity-40"
            >
              {g.label}
              <span
                className={cn(
                  "relative block h-12 w-full rounded-xl border-2 shadow-sm",
                  group === g.id ? "border-action" : "border-black/10",
                )}
                style={{ background: c }}
              >
                {group === g.id && (
                  <span className="bg-action absolute right-1 top-1 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-white">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs font-medium">Zones du vêtement</p>
      <ZoneChips onPick={() => setGroup(null)} />
      {targets.length > 0 && (
        <ColorPickerPanel
          value={color}
          recent={recent}
          onChange={paint}
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
                  blendMode: current?.blendMode ?? "normal",
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
