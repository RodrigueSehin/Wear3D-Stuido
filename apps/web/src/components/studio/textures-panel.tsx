"use client";

import { cn } from "@wear3d/ui";
import { Check, CircleOff, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PATTERN_PREFIX, patternPreview } from "@/lib/studio/patterns";
import { draggable, type DragPayload } from "@/lib/studio/placement";
import { useStudio } from "@/lib/studio/store";
import { fabricSwatch } from "@/lib/studio/swatches";
import {
  contrastColor,
  filterTextures,
  isTextureActive,
  TEXTURE_CATEGORIES,
  TEXTURE_TABS,
  withoutSurface,
  withTexture,
  type TextureCategory,
  type TextureDef,
  type TextureTab,
} from "@/lib/studio/textures";
import { SelectBox } from "./controls";

const PREVIEW_KEY = "texture-preview";

type Recipe = Parameters<ReturnType<typeof useStudio.getState>["update"]>[0];

/**
 * Panneau « Textures » : la texture choisie s'affiche aussitôt sur le vêtement (aperçu),
 * « Appliquer la texture » la valide comme une étape d'historique. Les calques, couleurs
 * et réglages de l'inspecteur ne sont jamais modifiés.
 */
export function TexturesPanel() {
  const doc = useStudio((s) => s.doc);
  const definition = useStudio((s) => s.definition);
  const [tab, setTab] = useState<TextureTab>("fabrics");
  const [category, setCategory] = useState<TextureCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [applied, setApplied] = useState(false);

  // Quitter le panneau valide l'aperçu en cours : rien n'est perdu et « Annuler » reste possible.
  useEffect(() => () => useStudio.getState().seal(), []);

  const base =
    doc?.zones[definition?.zones.find((z) => z.code.startsWith("BODY"))?.code ?? ""]?.color ??
    "#1D4ED8";
  const items = useMemo(() => filterTextures(tab, category, query), [tab, category, query]);
  const thumbs = useMemo(
    () =>
      Object.fromEntries(
        items.map((t) => [
          t.id,
          t.material
            ? fabricSwatch(t.material, base, 96)
            : patternPreview(`${PATTERN_PREFIX}${t.patternCode}`, contrastColor(base), base),
        ]),
      ),
    [items, base],
  );
  const surfaceActive = definition?.zones.some(
    (z) => z.code.startsWith("BODY") && doc?.zones[z.code]?.pattern,
  );

  const preview = (recipe: Recipe) => {
    const s = useStudio.getState();
    if (!pending) s.seal();
    s.update(recipe, PREVIEW_KEY);
    setPending(true);
    setApplied(false);
  };

  const choose = (tex: TextureDef) => preview((d) => withTexture(d, definition, tex));
  const clear = () => preview((d) => withoutSurface(d, definition));

  const apply = () => {
    useStudio.getState().seal();
    setPending(false);
    setApplied(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 [&>*]:shrink-0">
        <p className="text-muted-foreground text-sm leading-snug">
          Appliquez une texture de tissu ou un motif sur votre vêtement.
        </p>

        <label className="border-border focus-within:border-action flex h-11 items-center gap-2 rounded-full border bg-white px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une texture…"
            aria-label="Rechercher une texture"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7b86a0]"
          />
        </label>

        <div
          role="tablist"
          aria-label="Type de texture"
          className="bg-surface-muted grid grid-cols-3 rounded-full p-1"
        >
          {TEXTURE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full py-1.5 text-sm font-medium transition",
                tab === t.id ? "bg-action text-white shadow-sm" : "text-[#0b1530]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm">
          <span>Catégorie :</span>
          <SelectBox
            ariaLabel="Catégorie de texture"
            value={category}
            onChange={(v) => setCategory(v as TextureCategory | "all")}
            options={TEXTURE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-x-2 gap-y-3">
          {tab !== "fabrics" && !query && category === "all" && (
            <Tile
              label="Aucun"
              selected={!surfaceActive}
              onClick={clear}
              thumb={
                <span className="bg-surface-muted text-muted-foreground flex size-full items-center justify-center">
                  <CircleOff className="size-6" aria-hidden />
                </span>
              }
            />
          )}
          {items.map((t) => (
            <Tile
              key={t.id}
              label={t.label}
              selected={isTextureActive(doc, definition, t)}
              onClick={() => choose(t)}
              drag={{ kind: "texture", textureId: t.id }}
              thumb={
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[t.id]} alt="" className="size-full object-cover" />
              }
            />
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Aucune texture ne correspond à votre recherche.
          </p>
        )}
      </div>

      <div className="border-border border-t p-4">
        <button
          type="button"
          onClick={apply}
          disabled={!pending}
          className="bg-action hover:bg-action-hover disabled:hover:bg-action flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition disabled:cursor-default disabled:opacity-60"
        >
          <Check className="size-5" aria-hidden />
          {applied && !pending ? "Texture appliquée" : "Appliquer la texture"}
        </button>
      </div>
    </div>
  );
}

function Tile({
  label,
  selected,
  onClick,
  thumb,
  drag,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  thumb: React.ReactNode;
  /** Glisser la vignette sur une zone du vêtement n'applique la texture qu'à cette zone. */
  drag?: DragPayload;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(drag ? draggable(drag) : {})}
      aria-pressed={selected}
      className="group flex flex-col items-center gap-1 text-center"
    >
      <span
        className={cn(
          "relative block aspect-[1.15] w-full overflow-hidden rounded-xl border-2 transition",
          selected
            ? "border-action shadow-[0_0_0_3px_rgba(31,94,255,0.15)]"
            : "group-hover:border-action/50 border-transparent",
        )}
      >
        {thumb}
        {selected && (
          <span className="bg-action absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full text-white">
            <Check className="size-3.5" aria-hidden />
          </span>
        )}
      </span>
      <span className={cn("text-xs leading-tight", selected ? "text-action font-medium" : "")}>
        {label}
      </span>
    </button>
  );
}
