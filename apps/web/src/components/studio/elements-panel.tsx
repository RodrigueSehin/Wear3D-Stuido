"use client";

import { createImageLayer, createNumberLayer, createTextLayer } from "@wear3d/design-schema";
import { cn } from "@wear3d/ui";
import { CloudUpload, ImageOff, Loader2, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  ACCEPTED_TYPES,
  AssetImportError,
  importImage,
  MAX_UPLOAD_BYTES,
} from "@/lib/studio/assets";
import {
  ELEMENT_PREFIX,
  ELEMENT_SECTIONS,
  elementDataUrl,
  filterElements,
  type ElementDef,
  type ElementTab,
} from "@/lib/studio/elements";
import { NUMBER_STYLES, STUDIO_FONTS } from "@/lib/studio/fonts";
import { draggable, placementZone, revealZone, type DragPayload } from "@/lib/studio/placement";
import { useStudio } from "@/lib/studio/store";
import { contrastColor } from "@/lib/studio/textures";

const TABS: { id: ElementTab; label: string }[] = [
  { id: "shapes", label: "Formes" },
  { id: "icons", label: "Icônes" },
  { id: "decorations", label: "Décorations" },
];

/** Glisser d'un élément : teinte automatique pour les éléments monochromes. */
function elementDrag(def: ElementDef): DragPayload {
  return {
    kind: "image",
    assetId: `${ELEMENT_PREFIX}${def.code}`,
    name: def.label,
    width: 0.22,
    ...(def.tintable ? { tint: "auto" as const } : {}),
  };
}

/** Ajoute l'élément comme nouveau calque indépendant, sur le côté visible du vêtement. */
function placeElement(def: ElementDef) {
  const s = useStudio.getState();
  const zone = placementZone("image");
  const layer = createImageLayer(zone, `${ELEMENT_PREFIX}${def.code}`);
  layer.name = def.label;
  layer.transform = { ...layer.transform, x: 0.5, y: 0.4, w: 0.22 };
  if (def.tintable) layer.tint = contrastColor(s.doc?.zones[zone]?.color ?? "#FFFFFF");
  s.addLayer(layer);
  revealZone(zone);
}

export function ElementsPanel() {
  const doc = useStudio((s) => s.doc);
  const [tab, setTab] = useState<ElementTab>("shapes");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const items = useMemo(() => filterElements(tab, query), [tab, query]);
  const used = useMemo(
    () => new Set(doc?.layers.flatMap((l) => (l.type === "image" ? [l.assetId] : [])) ?? []),
    [doc],
  );
  const sections = ELEMENT_SECTIONS.filter(
    (s) => s.tab === tab && items.some((e) => e.section === s.id),
  );

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const asset = await importImage(file);
      const zone = placementZone("image");
      const layer = createImageLayer(zone, asset.id);
      layer.name = asset.name.replace(/\.[^.]+$/, "");
      useStudio.getState().addLayer(layer);
      revealZone(zone);
    } catch (e) {
      setError(e instanceof AssetImportError ? e.message : "Import impossible");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 [&>*]:shrink-0">
        <p className="text-muted-foreground text-sm leading-snug">
          Ajoutez des éléments graphiques pour enrichir votre création.
        </p>

        <label className="border-border focus-within:border-action flex h-11 items-center gap-2 rounded-full border bg-white px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un élément…"
            aria-label="Rechercher un élément"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7b86a0]"
          />
        </label>

        <div role="tablist" aria-label="Catégorie d'éléments" className="flex gap-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                tab === t.id ? "bg-action text-white" : "hover:bg-surface-muted text-[#0b1530]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-[#0b1530]">{section.label}</p>
            <div className="grid grid-cols-4 gap-2">
              {items
                .filter((e) => e.section === section.id)
                .map((e) => (
                  <button
                    key={e.code}
                    type="button"
                    onClick={() => placeElement(e)}
                    {...draggable(elementDrag(e))}
                    title={`Ajouter « ${e.label} » (cliquer, ou glisser sur le vêtement)`}
                    aria-label={e.label}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg border-2 bg-[#e9eef8] p-2.5 transition hover:bg-[#dde6f6]",
                      used.has(`${ELEMENT_PREFIX}${e.code}`)
                        ? "border-action/60"
                        : "border-transparent",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={elementDataUrl(e, "#0B2A8F")}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center text-sm">
            <ImageOff className="size-6" aria-hidden />
            Aucun élément ne correspond à votre recherche.
          </div>
        )}

        {tab === "icons" && !query && <NumbersSection />}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="border-border border-t p-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFiles(e.dataTransfer.files);
          }}
          className="border-action/50 bg-action-soft/40 hover:bg-action-soft flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed py-4 text-center transition"
        >
          {busy ? (
            <Loader2 className="text-action size-7 animate-spin" aria-hidden />
          ) : (
            <CloudUpload className="text-action size-7" strokeWidth={1.5} aria-hidden />
          )}
          <span className="text-action text-[15px] font-semibold">Importer un élément</span>
          <span className="text-muted-foreground text-xs">
            PNG, SVG (max. {MAX_UPLOAD_BYTES / 1024 / 1024} Mo)
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          aria-label="Importer un fichier élément"
          onChange={(e) => void onFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

/** Numéros sportifs (et nom du joueur) : conservés de l'ancien panneau. */
function NumbersSection() {
  const addLayer = useStudio((s) => s.addLayer);
  const addNumber = (style: keyof typeof NUMBER_STYLES, withName: boolean) => {
    const font = NUMBER_STYLES[style].font;
    // Côté visible (devant ou dos) ; une manche ou le col renvoient au devant.
    const facing = placementZone("text");
    const zone = facing.startsWith("BODY") ? facing : "BODY_FRONT";
    // Couleur lisible sur le tissu (blanc sur foncé, bleu nuit sur clair).
    const ink = contrastColor(useStudio.getState().doc?.zones[zone]?.color ?? "#FFFFFF");
    if (withName) {
      const name = createTextLayer(zone, "{player.name}");
      name.name = "Nom du joueur";
      name.text.font = font;
      name.text.weight = STUDIO_FONTS[font].weight;
      name.text.color = ink;
      name.transform = { ...name.transform, x: 0.5, y: 0.18, w: 0.6 };
      addLayer(name);
    }
    const number = createNumberLayer(zone, "10");
    number.number.style = style;
    number.number.color = ink;
    number.transform = { ...number.transform, x: 0.5, y: 0.45, w: 0.42 };
    addLayer(number);
    revealZone(zone);
  };
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-[#0b1530]">Numéros sportifs</p>
      {(Object.keys(NUMBER_STYLES) as (keyof typeof NUMBER_STYLES)[]).map((style) => (
        <div
          key={style}
          className="border-border flex items-center gap-3 rounded-xl border bg-white p-2"
        >
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-lg bg-[#0a1638] text-2xl text-white",
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
    </div>
  );
}
