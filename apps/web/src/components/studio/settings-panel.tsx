"use client";

import { cn, Switch } from "@wear3d/ui";
import { GARMENTS, getGarmentByVersion, TSHIRT_CLASSIC } from "@wear3d/garment-engine";
import {
  Box,
  ChevronDown,
  Image as ImageIcon,
  Layers,
  Minus,
  Monitor,
  Moon,
  Palette,
  Plus,
  Rotate3d,
  RotateCcw,
  Ruler,
  Shirt,
  Sun,
  Keyboard,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ACCENTS,
  DEFAULT_SETTINGS,
  EXPORT_RESOLUTIONS,
  RENDER_SIZES,
  useSettings,
  type DefaultView,
  type StudioSettings,
} from "@/lib/studio/settings";
import { useStudio } from "@/lib/studio/store";
import { SelectBox } from "./controls";

/** Applique la vue par défaut au studio ouvert (et à chaque ouverture de design). */
export function applyDefaultView(view: DefaultView) {
  const s = useStudio.getState();
  s.setViewMode(view === "2d" ? "2d" : "3d");
  s.setAutoSpin(view === "360");
}

/** Réinitialisation annulable : l'état précédent reste disponible quelques secondes. */
function useResetWithUndo() {
  const [backup, setBackup] = useState<StudioSettings | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const reset = () => {
    const { set: _s, reset: doReset, ...current } = useSettings.getState();
    setBackup(current);
    doReset();
    applyDefaultView(DEFAULT_SETTINGS.defaultView);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setBackup(null), 8000);
  };
  const undo = () => {
    if (!backup) return;
    useSettings.setState(backup);
    applyDefaultView(backup.defaultView);
    setBackup(null);
  };
  return { reset, undo, canUndo: backup !== null };
}

function ResetBar({ variant }: { variant: "panel" | "inspector" }) {
  const { reset, undo, canUndo } = useResetWithUndo();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={reset}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition",
          variant === "inspector"
            ? "border-action text-action hover:bg-action-soft h-11 border-2"
            : "text-muted-foreground h-9 hover:text-[#0b1530]",
        )}
      >
        <RotateCcw className="size-4" aria-hidden /> Rétablir les paramètres par défaut
      </button>
      {canUndo && (
        <p role="status" className="text-muted-foreground text-center text-xs">
          Paramètres rétablis.{" "}
          <button type="button" onClick={undo} className="text-action font-semibold underline">
            Annuler
          </button>
        </p>
      )}
    </div>
  );
}

/* ---------- Briques ---------- */

function Category({
  icon: Icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: LucideIcon;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-border rounded-xl border bg-white/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <Icon className="size-5 text-[#0b1530]" strokeWidth={1.75} aria-hidden />
        <span className="flex-1 text-[15px] font-bold text-[#0b1530]">{title}</span>
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="flex flex-col gap-3 px-3 pb-3">{children}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-[#0b1530]">
      <span>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, k }: { label: string; k: BooleanKeys }) {
  const value = useSettings((s) => s[k]);
  const set = useSettings((s) => s.set);
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-[#0b1530]">
      {label}
      <Switch checked={value} onCheckedChange={(v) => set(k, v)} />
    </label>
  );
}

type BooleanKeys = {
  [K in keyof StudioSettings]: StudioSettings[K] extends boolean ? K : never;
}[keyof StudioSettings];

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon: LucideIcon }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map(({ id, label: l, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition",
            value === id
              ? "border-action bg-action text-white"
              : "border-border hover:bg-surface-muted bg-white text-[#0b1530]",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {l}
        </button>
      ))}
    </div>
  );
}

/* ---------- Panneau gauche ---------- */

const SHORTCUTS = [
  ["Ctrl + Z", "Annuler"],
  ["Ctrl + Y", "Rétablir"],
  ["Ctrl + D", "Dupliquer"],
  ["Suppr", "Supprimer"],
  ["Flèches", "Déplacer (Maj = ×4)"],
  ["Échap", "Désélectionner"],
] as const;

export function SettingsPanel() {
  const st = useSettings();
  const definition = useStudio((s) => s.definition);
  const front = definition?.zones.find((z) => z.code === "BODY_FRONT")?.printAreaMm;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 [&>*]:shrink-0">
        <p className="text-muted-foreground text-sm leading-snug">
          Configurez les options de rendu, d&apos;affichage et d&apos;exportation de votre création.
        </p>

        <Category icon={Shirt} title="Modèle & Vue">
          <Row label="Type de vêtement">
            <SelectBox
              ariaLabel="Type de vêtement"
              value={definition?.versionId ?? TSHIRT_CLASSIC.versionId}
              onChange={(v) => {
                const next = getGarmentByVersion(v);
                if (next) useStudio.getState().changeModel(next);
              }}
              options={[
                ...GARMENTS.map((g) => ({ value: g.versionId, label: g.name })),
                { value: "polo", label: "Polo — bientôt", disabled: true },
              ]}
            />
          </Row>
          <span className="text-sm text-[#0b1530]">Vue par défaut</span>
          <Segmented<DefaultView>
            label="Vue par défaut"
            value={st.defaultView}
            onChange={(v) => {
              st.set("defaultView", v);
              applyDefaultView(v);
            }}
            options={[
              { id: "3d", label: "3D", icon: Box },
              { id: "2d", label: "2D", icon: Layers },
              { id: "360", label: "360°", icon: Rotate3d },
            ]}
          />
        </Category>

        <Category icon={ImageIcon} title="Qualité de rendu">
          <Row label="Résolution">
            <SelectBox
              ariaLabel="Résolution d'affichage"
              value={st.resolution}
              onChange={(v) => st.set("resolution", v as StudioSettings["resolution"])}
              options={[
                { value: "high", label: "Haute (HD – 4K)" },
                { value: "standard", label: "Standard (économie)" },
              ]}
            />
          </Row>
          <Toggle label="Anticrénelage" k="antialias" />
          <Toggle label="Textures haute définition" k="hdTextures" />
        </Category>

        <Category icon={Box} title="Affichage 3D">
          <Toggle label="Grille de repère" k="showGrid" />
          <Toggle label="Axe de rotation" k="showAxes" />
          <Toggle label="Infos sur l'objet" k="showInfo" />
        </Category>

        <Category icon={Ruler} title="Unités & Dimensions">
          <Row label="Unité">
            <SelectBox
              ariaLabel="Unité"
              value={st.unit}
              onChange={(v) => st.set("unit", v as StudioSettings["unit"])}
              options={[
                { value: "px", label: "Pixels (px)" },
                { value: "mm", label: "Millimètres (mm)" },
                { value: "cm", label: "Centimètres (cm)" },
              ]}
            />
          </Row>
          <Row label="Échelle du modèle">
            <div className="border-border flex h-10 items-center rounded-lg border bg-white">
              <button
                type="button"
                aria-label="Réduire l'échelle"
                disabled={st.modelScale <= 50}
                onClick={() => st.set("modelScale", Math.max(50, st.modelScale - 10))}
                className="flex h-full w-9 items-center justify-center disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="flex-1 text-center text-sm font-medium">{st.modelScale} %</span>
              <button
                type="button"
                aria-label="Agrandir l'échelle"
                disabled={st.modelScale >= 150}
                onClick={() => st.set("modelScale", Math.min(150, st.modelScale + 10))}
                className="flex h-full w-9 items-center justify-center disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </Row>
          {front && (
            <p className="text-muted-foreground text-xs">
              Zone imprimable (devant) : {front.w} × {front.h} mm. L&apos;échelle ne modifie que
              l&apos;affichage, pas les dimensions exportées.
            </p>
          )}
        </Category>

        <Category icon={Palette} title="Couleurs & Thème">
          <span className="text-sm text-[#0b1530]">Thème du studio</span>
          <Segmented
            label="Thème du studio"
            value={st.theme}
            onChange={(v) => st.set("theme", v)}
            options={[
              { id: "light", label: "Clair", icon: Sun },
              { id: "dark", label: "Sombre", icon: Moon },
              { id: "auto", label: "Auto", icon: Monitor },
            ]}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-[#0b1530]">Couleur d&apos;accent</span>
            <div className="flex items-center gap-1.5">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Accent ${c}`}
                  aria-pressed={st.accent.toUpperCase() === c}
                  onClick={() => st.set("accent", c)}
                  className={cn(
                    "size-6 rounded-full border border-black/10",
                    st.accent.toUpperCase() === c && "ring-2 ring-[#0b1530]/40 ring-offset-1",
                  )}
                  style={{ background: c }}
                />
              ))}
              <label
                className="relative size-6 cursor-pointer overflow-hidden rounded-full border border-black/10"
                style={{ background: "conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
                title="Couleur personnalisée"
              >
                <input
                  type="color"
                  value={st.accent}
                  aria-label="Couleur d'accent personnalisée"
                  onChange={(e) => st.set("accent", e.target.value.toUpperCase())}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </Category>

        <Category icon={Keyboard} title="Raccourcis clavier" defaultOpen={false}>
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
        </Category>
      </div>
      <div className="border-border border-t px-5 py-2">
        <ResetBar variant="panel" />
        <p className="text-muted-foreground text-center text-[11px]">
          Vos préférences sont enregistrées automatiquement sur cet appareil.
        </p>
      </div>
    </div>
  );
}

/* ---------- Inspecteur : paramètres avancés ---------- */

function InspectorGroup({ title, children }: { title: string; children: ReactNode }) {
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-[#0b1530]">{label}</span>
      {children}
    </div>
  );
}

export function SettingsInspector() {
  const st = useSettings();
  const name = useStudio((s) => s.name);
  const rename = useStudio((s) => s.rename);
  return (
    <div>
      <InspectorGroup title="Paramètres généraux">
        <Field label="Nom du projet">
          <input
            value={name}
            maxLength={80}
            aria-label="Nom du projet"
            onChange={(e) => rename(e.target.value)}
            className="border-border focus:border-action h-10 rounded-lg border bg-white px-3 text-sm outline-none"
          />
        </Field>
        <Field label="Format du projet">
          <SelectBox
            ariaLabel="Format du projet"
            value="custom3d"
            onChange={() => undefined}
            options={[
              { value: "custom3d", label: "Personnalisé (3D)" },
              { value: "team", label: "Collection d'équipe — phase 6", disabled: true },
            ]}
          />
        </Field>
        <Field label="Taille de rendu">
          <SelectBox
            ariaLabel="Taille de rendu"
            value={st.renderSize}
            onChange={(v) => st.set("renderSize", v)}
            options={RENDER_SIZES.map((r) => ({ value: r.id, label: r.label }))}
          />
        </Field>
        <Field label="Qualité">
          <SelectBox
            ariaLabel="Qualité du rendu"
            value={st.quality}
            onChange={(v) => st.set("quality", v as StudioSettings["quality"])}
            options={[
              { value: "high", label: "Haute" },
              { value: "medium", label: "Moyenne" },
              { value: "low", label: "Basse (fichiers légers)" },
            ]}
          />
        </Field>
      </InspectorGroup>

      <InspectorGroup title="Options de rendu">
        <Toggle label="Ombres réalistes" k="shadows" />
        <Toggle label="Reflets du tissu" k="fabricSheen" />
        <Toggle label="Détails et reliefs" k="fabricRelief" />
        <Toggle label="Anticrénelage" k="antialias" />
      </InspectorGroup>

      <InspectorGroup title="Exportation par défaut">
        <Field label="Format">
          <SelectBox
            ariaLabel="Format d'export par défaut"
            value={st.exportFormat}
            onChange={(v) => st.set("exportFormat", v as StudioSettings["exportFormat"])}
            options={[
              { value: "png", label: "PNG (fond transparent)" },
              { value: "jpg", label: "JPG" },
              { value: "pdf", label: "PDF — phase 5", disabled: true },
              { value: "glb", label: "GLB (3D) — V1.1", disabled: true },
            ]}
          />
        </Field>
        <Field label="Résolution">
          <SelectBox
            ariaLabel="Résolution d'export"
            value={String(st.exportWidth)}
            onChange={(v) => st.set("exportWidth", Number(v))}
            options={EXPORT_RESOLUTIONS.map((r) => ({ value: String(r.width), label: r.label }))}
          />
        </Field>
        <p className="text-muted-foreground text-xs">
          Utilisés par « Exporter → Export rapide ». « Rendu HD » utilise la taille de rendu.
        </p>
      </InspectorGroup>

      <div className="px-5 pt-2">
        <ResetBar variant="inspector" />
      </div>
    </div>
  );
}
