"use client";

import { createImageLayer } from "@wear3d/design-schema";
import { cn } from "@wear3d/ui";
import { Check, CloudUpload, ImageOff, Loader2, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACCEPTED_TYPES,
  AssetImportError,
  deleteImage,
  ensureImage,
  importImage,
  listAllAssets,
  MAX_UPLOAD_BYTES,
} from "@/lib/studio/assets";
import {
  filterLogos,
  LOGO_CATEGORIES,
  LOGO_PREFIX,
  logoDataUrl,
  type LogoCategory,
} from "@/lib/studio/logos";
import { MOCKUP_ASSET_PREFIX } from "@/lib/studio/mockups";
import { PATTERN_PREFIX } from "@/lib/studio/patterns";
import { type StoredAsset } from "@/lib/studio/persistence";
import { draggable, placementZone, revealZone, type DragPayload } from "@/lib/studio/placement";
import { useStudio } from "@/lib/studio/store";
import { SelectBox } from "./controls";

type Tab = "library" | "mine" | "imports";

const TABS: { id: Tab; label: string }[] = [
  { id: "library", label: "Bibliothèque" },
  { id: "mine", label: "Mes logos" },
  { id: "imports", label: "Imports" },
];

/** Ajoute le logo comme nouveau calque indépendant, sur le côté visible du vêtement. */
function placeLogo(assetId: string, name: string) {
  const zone = placementZone("image");
  const layer = createImageLayer(zone, assetId);
  layer.name = name.replace(/\.[^.]+$/, "");
  useStudio.getState().addLayer(layer);
  revealZone(zone);
}

export function LogosPanel() {
  const doc = useStudio((s) => s.doc);
  const [tab, setTab] = useState<Tab>("library");
  const [category, setCategory] = useState<LogoCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const list = (await listAllAssets()).filter(
      (a) => !a.id.startsWith(PATTERN_PREFIX) && !a.id.startsWith(MOCKUP_ASSET_PREFIX),
    );
    const entries = await Promise.all(
      list.map(async (a) => {
        const img = await ensureImage(a.id);
        return [a.id, img ? (img.image as HTMLImageElement).src : ""] as const;
      }),
    );
    setAssets(list);
    setUrls(Object.fromEntries(entries));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const used = useMemo(
    () => new Set(doc?.layers.flatMap((l) => (l.type === "image" ? [l.assetId] : [])) ?? []),
    [doc],
  );

  const logos = useMemo(() => filterLogos(category, query), [category, query]);
  const mine = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => !q || a.name.toLowerCase().includes(q));
  }, [assets, query]);

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const asset = await importImage(file);
      placeLogo(asset.id, asset.name);
      await refresh();
      setTab("mine");
    } catch (e) {
      setError(e instanceof AssetImportError ? e.message : "Import impossible");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(a: StoredAsset) {
    await deleteImage(a.id);
    await refresh();
  }

  const dropzone = (large: boolean) => (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "border-action/50 bg-action-soft/40 hover:bg-action-soft flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 text-center transition",
        large ? "py-12" : "py-4",
      )}
    >
      {busy ? (
        <Loader2 className="text-action size-7 animate-spin" aria-hidden />
      ) : (
        <CloudUpload className="text-action size-7" strokeWidth={1.5} aria-hidden />
      )}
      <span className="text-action text-[15px] font-semibold">Importer un logo</span>
      <span className="text-muted-foreground text-xs">
        PNG, SVG, JPG (max. {MAX_UPLOAD_BYTES / 1024 / 1024} Mo)
      </span>
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 [&>*]:shrink-0">
        <p className="text-muted-foreground text-sm leading-snug">
          Ajoutez un logo à votre création (club, marque, sponsor, etc.).
        </p>

        <label className="border-border focus-within:border-action flex h-11 items-center gap-2 rounded-full border bg-white px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un logo…"
            aria-label="Rechercher un logo"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7b86a0]"
          />
        </label>

        <div role="tablist" aria-label="Source des logos" className="flex gap-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium transition",
                tab === t.id ? "bg-action text-white" : "hover:bg-surface-muted text-[#0b1530]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "library" && (
          <>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm">
              <span>Catégorie :</span>
              <SelectBox
                ariaLabel="Catégorie de logo"
                value={category}
                onChange={(v) => setCategory(v as LogoCategory | "all")}
                options={LOGO_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {logos.map((l) => {
                const id = `${LOGO_PREFIX}${l.code}`;
                return (
                  <LogoTile
                    key={l.code}
                    label={l.label}
                    src={logoDataUrl(l)}
                    selected={used.has(id)}
                    onClick={() => placeLogo(id, l.label)}
                    drag={{ kind: "image", assetId: id, name: l.label }}
                  />
                );
              })}
            </div>
            {logos.length === 0 && <Empty text="Aucun logo ne correspond à votre recherche." />}
          </>
        )}

        {tab === "mine" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {mine.map((a) => (
                <LogoTile
                  key={a.id}
                  label={a.name.replace(/\.[^.]+$/, "")}
                  src={urls[a.id] ?? ""}
                  selected={used.has(a.id)}
                  onClick={() => placeLogo(a.id, a.name)}
                  drag={{ kind: "image", assetId: a.id, name: a.name.replace(/\.[^.]+$/, "") }}
                  onRemove={used.has(a.id) ? undefined : () => void remove(a)}
                />
              ))}
            </div>
            {mine.length === 0 && (
              <Empty
                text={
                  assets.length === 0
                    ? "Vous n'avez pas encore de logo. Importez le premier ci-dessous."
                    : "Aucun logo ne correspond à votre recherche."
                }
              />
            )}
          </>
        )}

        {tab === "imports" && (
          <div className="flex flex-col gap-3">
            {dropzone(true)}
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
              <li>Formats acceptés : PNG, SVG et JPG.</li>
              <li>Taille maximale : {MAX_UPLOAD_BYTES / 1024 / 1024} Mo.</li>
              <li>Le logo importé est placé sur le vêtement et rangé dans « Mes logos ».</li>
              <li>Un PNG ou un SVG à fond transparent donne le meilleur rendu.</li>
            </ul>
          </div>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
      </div>

      {tab !== "imports" && <div className="border-border border-t p-4">{dropzone(false)}</div>}
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        aria-label="Importer un fichier logo"
        onChange={(e) => void onFiles(e.target.files)}
      />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center text-sm">
      <ImageOff className="size-6" aria-hidden />
      {text}
    </div>
  );
}

function LogoTile({
  label,
  src,
  selected,
  onClick,
  onRemove,
  drag,
}: {
  label: string;
  src: string;
  selected: boolean;
  onClick: () => void;
  onRemove?: () => void;
  /** Glisser la vignette sur le vêtement la dépose à cet endroit. */
  drag?: DragPayload;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        {...(drag ? draggable(drag) : {})}
        title={`Ajouter « ${label} » (cliquer, ou glisser sur le vêtement)`}
        aria-label={label}
        className={cn(
          "relative flex aspect-square w-full items-center justify-center rounded-xl border-2 bg-gradient-to-b from-[#eef2fa] to-[#dfe6f3] p-3 transition",
          selected
            ? "border-action shadow-[0_0_0_3px_rgba(31,94,255,0.15)]"
            : "hover:border-action/50 border-transparent",
        )}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="max-h-full max-w-full object-contain" />
        )}
        {selected && (
          <span className="bg-action absolute right-2 top-2 flex size-5 items-center justify-center rounded-full text-white">
            <Check className="size-3.5" aria-hidden />
          </span>
        )}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer ${label} de mes logos`}
          className="text-danger absolute bottom-2 right-2 hidden rounded-md bg-white/90 p-1 shadow focus:block group-hover:block"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
