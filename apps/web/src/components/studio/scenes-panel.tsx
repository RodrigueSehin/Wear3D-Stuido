"use client";

import type { Ambiance, Scene } from "@wear3d/design-schema";
import { cn, Slider, Switch } from "@wear3d/ui";
import {
  Check,
  ChevronDown,
  CloudUpload,
  ImageOff,
  Loader2,
  Moon,
  Search,
  Sun,
  Sunset,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  deleteSceneImage,
  listSceneImages,
  saveSceneImage,
  type StoredSceneImage,
} from "@/lib/studio/persistence";
import { MAX_SCENE_BYTES, resolveBackdropUrl, useSceneBackdrop } from "@/lib/studio/scene-backdrop";
import {
  AMBIANCE_LIGHT,
  CUSTOM_SCENE_PREFIX,
  filterScenes,
  newScene,
  SCENE_CATEGORIES,
  sceneBackdrop,
  sceneById,
  SCENES,
  type SceneCategory,
} from "@/lib/studio/scenes";
import { draggable, type DragPayload } from "@/lib/studio/placement";
import { useStudio } from "@/lib/studio/store";
import { NumberBox, PercentSlider, SelectBox } from "./controls";

/** Choisit une scène : le vêtement est replacé aussitôt, les ajustements en cours sont gardés. */
function chooseScene(id: string, ambiance: Ambiance) {
  const s = useStudio.getState();
  s.setScene(newScene(id, ambiance, s.doc?.scene));
}

function sceneLabel(id: string, customs: readonly StoredSceneImage[]): string {
  const builtin = sceneById(id);
  if (builtin) return builtin.label;
  const custom = customs.find((c) => `${CUSTOM_SCENE_PREFIX}${c.id}` === id);
  return custom ? custom.name.replace(/\.[^.]+$/, "") : "Scène importée";
}

/** Décors importés : liste et URLs d'aperçu, rafraîchies après import ou suppression. */
function useCustomScenes() {
  const [items, setItems] = useState<StoredSceneImage[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const refresh = useCallback(async () => {
    const list = await listSceneImages().catch(() => []);
    const entries = await Promise.all(
      list.map(
        async (c) =>
          [c.id, (await resolveBackdropUrl(`${CUSTOM_SCENE_PREFIX}${c.id}`)) ?? ""] as const,
      ),
    );
    setItems(list);
    setUrls(Object.fromEntries(entries));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { items, urls, refresh };
}

/* ---------- Panneau gauche ---------- */

export function ScenesPanel() {
  const scene = useStudio((s) => s.doc?.scene);
  const [category, setCategory] = useState<SceneCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const customs = useCustomScenes();

  const items = useMemo(() => filterScenes(category, query), [category, query]);
  const thumbs = useMemo(
    () => Object.fromEntries(items.map((d) => [d.id, sceneBackdrop(d, 480, 300)])),
    [items],
  );
  const q = query.trim().toLowerCase();
  const mine = customs.items.filter((c) => !q || c.name.toLowerCase().includes(q));

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Format non pris en charge : JPG ou PNG (HDRI bientôt disponible).");
      return;
    }
    if (file.size > MAX_SCENE_BYTES) {
      setError("Fichier trop lourd (10 Mo maximum).");
      return;
    }
    setBusy(true);
    try {
      // Vérifie que l'image est lisible avant de l'enregistrer.
      (await createImageBitmap(file)).close();
      const id = crypto.randomUUID();
      await saveSceneImage({ id, name: file.name, blob: file });
      await customs.refresh();
      chooseScene(`${CUSTOM_SCENE_PREFIX}${id}`, "day");
    } catch {
      setError("Image illisible.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(c: StoredSceneImage) {
    if (scene?.id === `${CUSTOM_SCENE_PREFIX}${c.id}`) useStudio.getState().setScene(undefined);
    await deleteSceneImage(c.id);
    await customs.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 [&>*]:shrink-0">
        <p className="text-muted-foreground text-sm leading-snug">
          Choisissez un environnement de mise en situation pour votre création.
        </p>

        <label className="border-border focus-within:border-action flex h-11 items-center gap-2 rounded-full border bg-white px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une scène…"
            aria-label="Rechercher une scène"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7b86a0]"
          />
        </label>

        <div role="tablist" aria-label="Catégorie de scène" className="flex flex-wrap gap-0.5">
          {SCENE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium transition",
                category === c.id
                  ? "bg-action text-white"
                  : "hover:bg-surface-muted text-[#0b1530]",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {items.map((d) => (
            <SceneTile
              key={d.id}
              label={d.label}
              src={thumbs[d.id] ?? ""}
              selected={scene?.id === d.id}
              onClick={() => chooseScene(d.id, d.ambiance)}
              drag={{ kind: "scene", id: d.id, ambiance: d.ambiance }}
            />
          ))}
        </div>
        {items.length === 0 && mine.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center text-sm">
            <ImageOff className="size-6" aria-hidden />
            Aucune scène ne correspond à votre recherche.
          </div>
        )}

        {mine.length > 0 && category === "all" && (
          <>
            <p className="text-sm font-semibold text-[#0b1530]">Mes scènes</p>
            <div className="grid grid-cols-2 gap-3">
              {mine.map((c) => (
                <SceneTile
                  key={c.id}
                  label={c.name.replace(/\.[^.]+$/, "")}
                  src={customs.urls[c.id] ?? ""}
                  selected={scene?.id === `${CUSTOM_SCENE_PREFIX}${c.id}`}
                  onClick={() => chooseScene(`${CUSTOM_SCENE_PREFIX}${c.id}`, "day")}
                  onRemove={() => void remove(c)}
                />
              ))}
            </div>
          </>
        )}

        {scene && (
          <button
            type="button"
            onClick={() => useStudio.getState().setScene(undefined)}
            className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm hover:text-[#0b1530]"
          >
            <X className="size-4" aria-hidden /> Retirer la scène (fond neutre)
          </button>
        )}

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
          className="border-action/50 bg-action-soft/40 hover:bg-action-soft flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed py-3 transition"
        >
          {busy ? (
            <Loader2 className="text-action size-7 animate-spin" aria-hidden />
          ) : (
            <CloudUpload className="text-action size-7" strokeWidth={1.5} aria-hidden />
          )}
          <span className="text-left">
            <span className="text-action block text-[15px] font-semibold">Importer une scène</span>
            <span className="text-muted-foreground block text-xs">
              JPG, PNG — max. 10 Mo (HDRI bientôt)
            </span>
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          aria-label="Importer un décor de scène"
          onChange={(e) => void onFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

function SceneTile({
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
  drag?: DragPayload;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        {...(drag ? draggable(drag) : {})}
        aria-pressed={selected}
        aria-label={`Scène ${label}`}
        className={cn(
          "relative block aspect-[16/11] w-full overflow-hidden rounded-xl border-2 bg-[#0a1638] transition",
          selected
            ? "border-action shadow-[0_0_0_3px_rgba(31,94,255,0.2)]"
            : "hover:border-action/50 border-transparent",
        )}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="size-full object-cover" />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-left text-[13px] font-semibold text-white">
          {label}
        </span>
        {selected && (
          <span className="bg-action absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-white ring-2 ring-white">
            <Check className="size-4" aria-hidden />
          </span>
        )}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer la scène ${label}`}
          className="text-danger absolute left-2 top-2 hidden rounded-md bg-white/90 p-1 shadow focus:block group-hover:block"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* ---------- Inspecteur de scène ---------- */

const AMBIANCES: { id: Ambiance; icon: LucideIcon; bg: string }[] = [
  { id: "day", icon: Sun, bg: "linear-gradient(180deg,#5aa7f2,#cfe6fb 60%,#6fbf5a 61%)" },
  { id: "evening", icon: Sunset, bg: "linear-gradient(180deg,#3b2a7a,#f08a4b 58%,#2b2b3d 59%)" },
  { id: "night", icon: Moon, bg: "linear-gradient(180deg,#050b24,#18306e 60%,#0b1636 61%)" },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-border border-t px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[17px] font-bold text-[#0b1530]">{title}</span>
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="mt-3 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

export function SceneInspector() {
  const scene = useStudio((s) => s.doc?.scene);
  const showPodium = useStudio((s) => s.showPodium);
  const setShowPodium = useStudio((s) => s.setShowPodium);
  const backdrop = useSceneBackdrop(scene?.id);
  const customs = useCustomScenes();

  if (!scene) {
    return (
      <p className="text-muted-foreground px-5 text-sm">
        Choisissez une scène dans la bibliothèque pour mettre votre vêtement en situation, puis
        réglez ici l&apos;éclairage, l&apos;ambiance et les effets.
      </p>
    );
  }

  const patch = (p: Partial<Scene>, key?: string) => useStudio.getState().patchScene(p, key);
  const options = [
    ...SCENES.map((d) => ({ value: d.id, label: d.label })),
    ...customs.items.map((c) => ({
      value: `${CUSTOM_SCENE_PREFIX}${c.id}`,
      label: `${c.name.replace(/\.[^.]+$/, "")} (importée)`,
    })),
  ];
  if (!options.some((o) => o.value === scene.id)) {
    options.push({ value: scene.id, label: "Scène importée (absente de cet appareil)" });
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-5 pb-4">
        <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-[#0a1638]">
          {backdrop && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backdrop} alt="" className="size-full object-cover" />
          )}
        </span>
        <span className="truncate text-[17px] font-semibold text-[#0b1530]">
          Scène : {sceneLabel(scene.id, customs.items)}
        </span>
      </div>

      <Group title="Environnement">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 text-sm">
          <span>Type</span>
          <SelectBox
            ariaLabel="Type de scène"
            value={scene.id}
            onChange={(v) => chooseScene(v, sceneById(v)?.ambiance ?? scene.ambiance)}
            options={options}
          />
        </div>
        <PercentSlider
          onCommit={() => useStudio.getState().seal()}
          label="Intensité de l'éclairage"
          value={scene.intensity}
          min={0}
          max={1.5}
          onChange={(v, commit) => patch({ intensity: v }, commit ? undefined : "scene-intensity")}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm text-[#0b1530]">Angle de lumière</span>
          <div className="flex items-center gap-3">
            <Slider
              value={[scene.angle]}
              min={0}
              max={360}
              step={5}
              aria-label="Angle de lumière"
              onValueChange={([v]) => patch({ angle: v ?? scene.angle }, "scene-angle")}
              onValueCommit={() => useStudio.getState().seal()}
              className="flex-1"
            />
            {/* Cadran : direction d'où vient la lumière, vue de dessus. */}
            <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="currentColor"
                strokeOpacity=".3"
                strokeWidth="2"
              />
              <line
                x1="16"
                y1="16"
                x2={16 + 11 * Math.sin((scene.angle * Math.PI) / 180)}
                y2={16 + 11 * Math.cos((scene.angle * Math.PI) / 180)}
                stroke="var(--action)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="16" cy="16" r="2.5" fill="currentColor" />
            </svg>
            <NumberBox
              unit="°"
              value={Math.round(scene.angle)}
              min={0}
              max={360}
              onChange={(v) => patch({ angle: v % 360 })}
              className="w-[76px] shrink-0"
            />
          </div>
        </div>

        <span className="text-sm text-[#0b1530]">Ambiance</span>
        <div role="radiogroup" aria-label="Ambiance" className="grid grid-cols-3 gap-2">
          {AMBIANCES.map(({ id, icon: Icon, bg }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={scene.ambiance === id}
              onClick={() => patch({ ambiance: id })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 p-1 text-xs font-medium transition",
                scene.ambiance === id
                  ? "border-action"
                  : "hover:border-action/40 border-transparent",
              )}
            >
              <span
                className="flex h-12 w-full items-center justify-center rounded-lg text-white"
                style={{ background: bg }}
              >
                <Icon className="size-5 drop-shadow" aria-hidden />
              </span>
              {AMBIANCE_LIGHT[id].label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Ajustements">
        <PercentSlider
          onCommit={() => useStudio.getState().seal()}
          label="Luminosité"
          value={scene.brightness}
          min={-0.5}
          max={0.5}
          onChange={(v, commit) =>
            patch({ brightness: v }, commit ? undefined : "scene-brightness")
          }
        />
        <PercentSlider
          onCommit={() => useStudio.getState().seal()}
          label="Contraste"
          value={scene.contrast}
          min={-0.5}
          max={0.5}
          onChange={(v, commit) => patch({ contrast: v }, commit ? undefined : "scene-contrast")}
        />
        <PercentSlider
          onCommit={() => useStudio.getState().seal()}
          label="Saturation"
          value={scene.saturation}
          min={-0.5}
          max={0.5}
          onChange={(v, commit) =>
            patch({ saturation: v }, commit ? undefined : "scene-saturation")
          }
        />
      </Group>

      <Group title="Effets">
        {(
          [
            ["groundShadow", "Ombre au sol"],
            ["reflection", "Reflet (podium miroir)"],
            ["backgroundBlur", "Flou d'arrière-plan"],
            ["includeInExport", "Décor dans les exports"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 text-[15px] text-[#0b1530]"
          >
            {label}
            <Switch checked={scene[key]} onCheckedChange={(v) => patch({ [key]: v })} />
          </label>
        ))}
        <label className="flex items-center justify-between gap-3 text-[15px] text-[#0b1530]">
          Podium lumineux
          <Switch checked={showPodium} onCheckedChange={setShowPodium} />
        </label>
      </Group>

      <div className="px-5 pt-2">
        <button
          type="button"
          onClick={() => useStudio.getState().setScene(undefined)}
          className="text-danger hover:bg-danger/10 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold"
        >
          <X className="size-4" aria-hidden /> Retirer la scène
        </button>
      </div>
    </div>
  );
}
