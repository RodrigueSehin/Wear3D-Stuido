"use client";

import { BLEND_MODES, type BlendMode, type Mockup } from "@wear3d/design-schema";
import { cn, Slider, Switch } from "@wear3d/ui";
import {
  Check,
  ChevronDown,
  CloudUpload,
  ImageOff,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Unlink,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AssetImportError, ensureImage, importImage, MAX_UPLOAD_BYTES } from "@/lib/studio/assets";
import {
  effectiveColors,
  filterMockups,
  isImportedMockup,
  MOCKUP_ASSET_PREFIX,
  MOCKUP_CATEGORIES,
  MOCKUPS,
  newMockup,
  templateOf,
  withMockup,
  type MockupCategory,
  type MockupTemplate,
} from "@/lib/studio/mockups";
import { deleteAsset, listAssets, type StoredAsset } from "@/lib/studio/persistence";
import { draggable, type DragPayload } from "@/lib/studio/placement";
import { useStudio } from "@/lib/studio/store";
import { ColorField, NumberBox, PercentSlider, SelectBox } from "./controls";
import { JerseyThumb } from "./jersey-thumb";

const PREVIEW_KEY = "mockup-preview";

const BLEND_LABELS: Record<BlendMode, string> = {
  normal: "Normal",
  multiply: "Produit",
  screen: "Superposition claire",
  overlay: "Incrustation",
  darken: "Assombrir",
  lighten: "Éclaircir",
};

/** Maquettes importées (images stockées localement, préfixe « mockup_ »). */
function useImportedMockups() {
  const [items, setItems] = useState<StoredAsset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const refresh = useCallback(async () => {
    const list = (await listAssets().catch(() => [])).filter((a) =>
      a.id.startsWith(MOCKUP_ASSET_PREFIX),
    );
    const entries = await Promise.all(
      list.map(async (a) => {
        const img = await ensureImage(a.id);
        return [a.id, img ? (img.image as HTMLImageElement).src : ""] as const;
      }),
    );
    setItems(list);
    setUrls(Object.fromEntries(entries));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { items, urls, refresh };
}

function mockupLabel(id: string, imported: readonly StoredAsset[]): string {
  const builtin = MOCKUPS.find((m) => m.id === id);
  if (builtin) return builtin.label;
  return imported.find((a) => a.id === id)?.name.replace(/\.[^.]+$/, "") ?? "Importée";
}

/** Vignette de maillot aux couleurs d'une maquette. */
function MockupThumb({
  t,
  colors,
  className,
}: {
  t: MockupTemplate;
  colors: readonly [string, string, string];
  className?: string;
}) {
  const [c1, c2, c3] = colors;
  const pattern = useMemo(
    () =>
      t.pattern && !isImportedMockup(t.id)
        ? { assetId: t.pattern.assetId, color: c2, opacity: t.pattern.opacity }
        : undefined,
    [t, c2],
  );
  return (
    <JerseyThumb
      body={c1}
      sleeves={t.sleeves === 3 ? c3 : c1}
      collar={c3}
      pattern={pattern}
      className={className}
    />
  );
}

/* ---------- Panneau gauche ---------- */

export function MockupsPanel() {
  const current = useStudio((s) => s.doc?.mockup);
  const [category, setCategory] = useState<MockupCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const imported = useImportedMockups();

  // Quitter le panneau valide l'aperçu en cours (annulable avec Ctrl+Z).
  useEffect(() => () => useStudio.getState().seal(), []);

  const items = useMemo(() => filterMockups(category, query), [category, query]);
  const q = query.trim().toLowerCase();
  const mine = imported.items.filter((a) => !q || a.name.toLowerCase().includes(q));

  /** Aperçu immédiat sur le vêtement ; « Appliquer » en fait une étape d'historique. */
  const preview = (m: Mockup) => {
    const s = useStudio.getState();
    if (!pending) s.seal();
    s.update((d) => withMockup(d, s.definition, m), PREVIEW_KEY);
    setPending(true);
    setApplied(false);
  };

  const apply = () => {
    useStudio.getState().seal();
    setPending(false);
    setApplied(true);
  };

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (/\.psd$/i.test(file.name)) {
      setError("Le format PSD n'est pas encore pris en charge : exportez en PNG ou JPG.");
      return;
    }
    setBusy(true);
    try {
      const asset = await importImage(file, MOCKUP_ASSET_PREFIX);
      await imported.refresh();
      const doc = useStudio.getState().doc;
      const body = doc?.zones.BODY_FRONT?.color ?? "#FFFFFF";
      const trim = doc?.zones.COLLAR?.color ?? body;
      preview(newMockup(templateOf(asset.id, [body, "#FFFFFF", trim])));
    } catch (e) {
      setError(e instanceof AssetImportError ? e.message : "Import impossible");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(a: StoredAsset) {
    await deleteAsset(a.id);
    await imported.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 [&>*]:shrink-0">
        <p className="text-muted-foreground text-sm leading-snug">
          Utilisez une maquette prête à l&apos;emploi et personnalisez-la selon vos besoins.
        </p>

        <label className="border-border focus-within:border-action flex h-11 items-center gap-2 rounded-full border bg-white px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une maquette…"
            aria-label="Rechercher une maquette"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7b86a0]"
          />
        </label>

        <div role="tablist" aria-label="Catégorie de maquette" className="flex flex-wrap gap-0.5">
          {MOCKUP_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                category === c.id
                  ? "bg-action text-white"
                  : "hover:bg-surface-muted text-[#0b1530]",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {items.map((t) => (
            <Tile
              key={t.id}
              label={t.label}
              selected={current?.id === t.id}
              onClick={() => preview(newMockup(t))}
              drag={{ kind: "mockup", mockup: newMockup(t) }}
            >
              <MockupThumb t={t} colors={t.colors} className="size-full p-1 drop-shadow-md" />
            </Tile>
          ))}
        </div>
        {items.length === 0 && mine.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center text-sm">
            <ImageOff className="size-6" aria-hidden />
            Aucune maquette ne correspond à votre recherche.
          </div>
        )}

        {mine.length > 0 && category === "all" && (
          <>
            <p className="text-sm font-semibold text-[#0b1530]">Mes maquettes</p>
            <div className="grid grid-cols-3 gap-2">
              {mine.map((a) => (
                <Tile
                  key={a.id}
                  label={a.name.replace(/\.[^.]+$/, "")}
                  selected={current?.id === a.id}
                  onClick={() => {
                    const doc = useStudio.getState().doc;
                    const body = doc?.zones.BODY_FRONT?.color ?? "#FFFFFF";
                    const trim = doc?.zones.COLLAR?.color ?? body;
                    preview(newMockup(templateOf(a.id, [body, "#FFFFFF", trim])));
                  }}
                  onRemove={current?.id === a.id ? undefined : () => void remove(a)}
                >
                  {imported.urls[a.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imported.urls[a.id]} alt="" className="size-full object-cover" />
                  )}
                </Tile>
              ))}
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="border-border flex flex-col gap-3 border-t p-4">
        <button
          type="button"
          onClick={apply}
          disabled={!pending}
          className="bg-action hover:bg-action-hover disabled:hover:bg-action flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition disabled:cursor-default disabled:opacity-60"
        >
          {applied && !pending ? (
            <Check className="size-5" aria-hidden />
          ) : (
            <Sparkles className="size-5" aria-hidden />
          )}
          {applied && !pending ? "Maquette appliquée" : "Appliquer la maquette"}
        </button>
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFiles(e.dataTransfer.files);
          }}
          className="border-action/50 bg-action-soft/40 hover:bg-action-soft flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed py-2.5 transition"
        >
          {busy ? (
            <Loader2 className="text-action size-6 animate-spin" aria-hidden />
          ) : (
            <CloudUpload className="text-action size-6" strokeWidth={1.5} aria-hidden />
          )}
          <span className="text-left">
            <span className="text-action block text-[15px] font-semibold">
              Importer une maquette
            </span>
            <span className="text-muted-foreground block text-xs">
              PNG, JPG — max. {MAX_UPLOAD_BYTES / 1024 / 1024} Mo (PSD bientôt)
            </span>
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,.psd"
          className="sr-only"
          aria-label="Importer une maquette"
          onChange={(e) => void onFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

function Tile({
  label,
  selected,
  onClick,
  onRemove,
  children,
  drag,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  onRemove?: () => void;
  children: ReactNode;
  drag?: DragPayload;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        {...(drag ? draggable(drag) : {})}
        aria-pressed={selected}
        aria-label={`Maquette ${label}`}
        title={label}
        className={cn(
          "relative flex aspect-[9/10] w-full items-center justify-center overflow-hidden rounded-xl border-2 bg-gradient-to-b from-[#eef2fa] to-[#dfe6f3] transition",
          selected
            ? "border-action shadow-[0_0_0_3px_rgba(31,94,255,0.15)]"
            : "hover:border-action/50 border-transparent",
        )}
      >
        {children}
        {selected && (
          <span className="bg-action absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-white">
            <Check className="size-3.5" aria-hidden />
          </span>
        )}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer la maquette ${label}`}
          className="text-danger absolute bottom-1.5 left-1.5 hidden rounded-md bg-white/90 p-1 shadow focus:block group-hover:block"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* ---------- Inspecteur de maquette ---------- */

function Group({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-border border-t px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex flex-1 items-center justify-between text-left"
        >
          <span className="text-[17px] font-bold text-[#0b1530]">{title}</span>
          {!action && (
            <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
          )}
        </button>
        {action}
      </div>
      {open && <div className="mt-3 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

export function MockupInspector() {
  const mockup = useStudio((s) => s.doc?.mockup);
  const size = useStudio((s) => s.doc?.model.size);
  const definition = useStudio((s) => s.definition);
  const recent = useStudio((s) => s.recentColors);
  const imported = useImportedMockups();

  if (!mockup) {
    return (
      <p className="text-muted-foreground px-5 text-sm">
        Choisissez une maquette dans la bibliothèque : elle habille tout le vêtement, et vous
        pourrez ensuite la recolorer et l&apos;ajuster ici.
      </p>
    );
  }

  const t = templateOf(mockup.id, mockup.colors);
  const seal = () => useStudio.getState().seal();
  const patch = (p: Partial<Mockup>, key?: string) => useStudio.getState().patchMockup(p, key);
  const commitColor = (c: string) => {
    useStudio.getState().pushRecentColor(c);
    seal();
  };

  return (
    <div>
      <div className="flex items-center gap-3 px-5 pb-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#e9eef8]">
          <MockupThumb t={t} colors={effectiveColors(mockup)} className="size-10" />
        </span>
        <span className="truncate text-[17px] font-semibold text-[#0b1530]">
          Maquette ({mockupLabel(mockup.id, imported.items)})
        </span>
      </div>

      <Group title="Maquette">
        <PercentSlider
          label="Intensité du motif"
          value={mockup.intensity}
          min={0}
          max={1}
          onChange={(v, commit) => patch({ intensity: v }, commit ? undefined : "mockup-intensity")}
          onCommit={seal}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-[#0b1530]">Mode de fusion</span>
          <SelectBox
            ariaLabel="Mode de fusion du motif"
            value={mockup.blendMode}
            onChange={(v) => patch({ blendMode: v as BlendMode })}
            options={BLEND_MODES.map((m) => ({ value: m, label: BLEND_LABELS[m] }))}
          />
        </div>
        <PercentSlider
          label="Échelle du motif"
          value={mockup.scale}
          min={0.25}
          max={2}
          onChange={(v, commit) => patch({ scale: v }, commit ? undefined : "mockup-scale")}
          onCommit={seal}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm text-[#0b1530]">Rotation du motif</span>
          <div className="flex items-center gap-3">
            <Slider
              value={[mockup.rotation]}
              min={-180}
              max={180}
              step={5}
              aria-label="Rotation du motif"
              onValueChange={([v]) => patch({ rotation: v ?? mockup.rotation }, "mockup-rotation")}
              onValueCommit={seal}
              className="flex-1"
            />
            <NumberBox
              unit="°"
              value={Math.round(mockup.rotation)}
              min={-180}
              max={180}
              onChange={(v) => patch({ rotation: v })}
              className="w-[84px] shrink-0"
            />
          </div>
        </div>
      </Group>

      <Group title="Ajustements">
        {(
          [
            ["brightness", "Luminosité"],
            ["contrast", "Contraste"],
            ["saturation", "Saturation"],
          ] as const
        ).map(([key, label]) => (
          <PercentSlider
            key={key}
            label={label}
            value={mockup[key]}
            min={-0.5}
            max={0.5}
            onChange={(v, commit) => patch({ [key]: v }, commit ? undefined : `mockup-${key}`)}
            onCommit={seal}
          />
        ))}
      </Group>

      <Group
        title="Recoloration"
        action={
          <Switch
            checked={mockup.recolor}
            aria-label="Recoloration"
            onCheckedChange={(recolor) => patch({ recolor })}
          />
        }
      >
        {(["Couleur 1", "Couleur 2", "Couleur 3"] as const).map((label, i) => (
          <div key={label} className={cn(!mockup.recolor && "pointer-events-none opacity-50")}>
            <ColorField
              label={label}
              value={mockup.recolor ? mockup.colors[i]! : t.colors[i]!}
              recent={recent}
              onChange={(c) => {
                const colors = [...mockup.colors] as Mockup["colors"];
                colors[i] = c;
                patch({ colors }, `mockup-color-${i}`);
              }}
              onCommit={commitColor}
            />
          </div>
        ))}
        <p className="text-muted-foreground text-xs">
          1 : corps · 2 : motif · 3 : col et finitions.
        </p>
        {!mockup.recolor && (
          <p className="text-muted-foreground text-xs">
            Couleurs d&apos;origine de la maquette. Activez la recoloration pour les modifier.
          </p>
        )}
      </Group>

      <Group title="Taille du vêtement">
        <div className="flex flex-wrap gap-1.5">
          {definition?.sizes.map((sz) => (
            <button
              key={sz}
              type="button"
              aria-pressed={size === sz}
              onClick={() => {
                const s = useStudio.getState();
                s.seal();
                s.update((d) => ({ ...d, model: { ...d.model, size: sz } }));
                s.seal();
              }}
              className={cn(
                "min-w-10 rounded-lg border px-2 py-1.5 text-sm",
                size === sz
                  ? "border-action bg-action-soft text-action"
                  : "border-border bg-white text-[#0b1530]",
              )}
            >
              {sz}
            </button>
          ))}
        </div>
      </Group>

      <div className="px-5 pt-2">
        <button
          type="button"
          title="Les couleurs et le motif restent sur le vêtement"
          onClick={() => {
            const s = useStudio.getState();
            s.seal();
            s.update((d) => {
              const { mockup: _removed, ...rest } = d;
              return rest;
            });
            s.seal();
          }}
          className="text-muted-foreground hover:bg-surface-muted flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold"
        >
          <Unlink className="size-4" aria-hidden /> Détacher la maquette
        </button>
      </div>
    </div>
  );
}
