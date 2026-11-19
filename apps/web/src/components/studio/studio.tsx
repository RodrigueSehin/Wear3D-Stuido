"use client";

import { createEmptyDocument, type DesignDocument } from "@wear3d/design-schema";
import {
  getGarmentByReference,
  getGarmentByVersion,
  TSHIRT_CLASSIC,
  type GarmentDefinition,
} from "@wear3d/garment-engine";
import { cn } from "@wear3d/ui";
import { ChevronsLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STUDIO_FONTS } from "@/lib/studio/fonts";
import {
  cloud,
  createOnline,
  currentUserId,
  importDraft,
  isCloudId,
  openOnline,
  pushToCloud,
} from "@/lib/studio/cloud-session";
import { loadDesign, saveDesign } from "@/lib/studio/persistence";
import { accentVars, useSettings } from "@/lib/studio/settings";
import { selectedLayerId, useStudio } from "@/lib/studio/store";
import { AtlasComposer } from "./atlas-composer";
import { BottomBar } from "./bottom-bar";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { LeftPanel } from "./left-panel";
import { LeftRail } from "./left-rail";
import { applyDefaultView } from "./settings-panel";
import { Stage } from "./stage";
import { StatusBanner } from "./status-banner";
import { TopBar } from "./top-bar";

/** Délai d'autosave : bien en dessous des 5 s exigées (CDC F-16, REC-08). */
const AUTOSAVE_DELAY_MS = 800;
const CLOUD_SAVE_DELAY_MS = 3000;

export function Studio({
  designId,
  modelReference,
}: {
  designId: string;
  modelReference?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const loadedId = useStudio((s) => s.designId);
  const hasDoc = useStudio((s) => s.doc !== null);
  const libraryOpen = useStudio((s) => s.libraryOpen);
  const inspectorOpen = useStudio((s) => s.inspectorOpen);
  const preview = useStudio((s) => s.preview);
  const viewMode = useStudio((s) => s.viewMode);
  const ready = loadedId === designId && hasDoc;
  const theme = useSettings((st) => st.theme);
  const accent = useSettings((st) => st.accent);
  const [systemDark, setSystemDark] = useState(false);

  // Thème « Auto » : suit le réglage clair / sombre du système.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const resolvedTheme = theme === "auto" ? (systemDark ? "dark" : "light") : theme;

  // Vue par défaut (3D, 2D ou 360°) appliquée à l'ouverture de chaque design.
  useEffect(() => {
    if (ready) applyDefaultView(useSettings.getState().defaultView);
  }, [ready, designId]);

  // Chargement : en ligne pour un utilisateur connecté, sinon brouillon local.
  useEffect(() => {
    let cancelled = false;
    const query = modelReference ? `?modele=${encodeURIComponent(modelReference)}` : "";
    const newDefinition = () =>
      (modelReference && getGarmentByReference(modelReference)) || TSHIRT_CLASSIC;
    const initLocal = (definition: GarmentDefinition, doc: DesignDocument, name: string) => {
      cloud.active = false;
      useStudio.getState().init({ designId, name, definition, doc });
    };
    void (async () => {
      try {
        const userId = await currentUserId();
        if (cancelled) return;

        if (designId === "nouveau") {
          if (userId) {
            try {
              const created = await createOnline(userId, "Mon design", newDefinition());
              if (!cancelled) router.replace(`/studio/${created.id}${query}`);
              return;
            } catch {
              // Catalogue ou espace indisponible : on retombe sur un brouillon local.
            }
          }
          if (!cancelled) router.replace(`/studio/d_${crypto.randomUUID()}${query}`);
          return;
        }

        // Design en ligne ; copie locale en secours si le réseau est coupé.
        if (isCloudId(designId)) {
          let row = null;
          try {
            row = await openOnline(designId);
          } catch {
            const local = await loadDesign(designId);
            const definition = local && getGarmentByVersion(local.document.model.versionId);
            if (local && definition && !cancelled) {
              cloud.active = true;
              initLocal(definition, local.document, local.name);
              cloud.active = true;
              useStudio.getState().setSaveState("offline");
              return;
            }
            throw new Error("Impossible de charger ce design (hors ligne ?)");
          }
          if (cancelled) return;
          if (!row) throw new Error("Design introuvable ou supprimé");
          const definition = getGarmentByVersion(row.document.model.versionId);
          if (!definition) throw new Error("Modèle 3D introuvable pour ce design");
          cloud.active = true;
          useStudio.getState().init({ designId, name: row.name, definition, doc: row.document });
          return;
        }

        // Brouillon local ; connecté, il est repris en ligne.
        const stored = await loadDesign(designId);
        if (cancelled) return;
        if (stored) {
          const definition = getGarmentByVersion(stored.document.model.versionId);
          if (!definition) throw new Error("Modèle 3D introuvable pour ce design");
          if (userId) {
            try {
              const created = await importDraft(userId, stored, definition);
              if (!cancelled) router.replace(`/studio/${created.id}`);
              return;
            } catch {
              // Reste en local : rien n'est perdu.
            }
          }
          initLocal(definition, stored.document, stored.name);
          return;
        }
        const definition = newDefinition();
        initLocal(
          definition,
          createEmptyDocument(
            definition.versionId,
            definition.zones.map((z) => ({ code: z.code, ...z.defaults })),
          ),
          "Mon design",
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Chargement impossible");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designId, modelReference, router]);

  // Sauvegarde automatique après modification.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = async () => {
      const s = useStudio.getState();
      if (!s.designId || !s.doc || s.conflict) return;
      try {
        await saveDesign({
          id: s.designId,
          name: s.name,
          document: s.doc,
          updatedAt: new Date().toISOString(),
        });
        if (cloud.active) scheduleCloud();
        else s.setSaveState(navigator.onLine ? "saved" : "offline");
      } catch {
        s.setSaveState("error");
      }
    };
    // En ligne : au plus une écriture serveur toutes les 3 s (la copie locale reste immédiate).
    let cloudTimer: ReturnType<typeof setTimeout> | undefined;
    const cloudFlush = async () => {
      cloudTimer = undefined;
      const s = useStudio.getState();
      if (!cloud.active || s.conflict) return;
      const r = await pushToCloud();
      if (r === "conflict") s.setConflict(true);
      else s.setSaveState(r);
    };
    const scheduleCloud = () => {
      cloudTimer ??= setTimeout(() => void cloudFlush(), CLOUD_SAVE_DELAY_MS);
    };
    const unsubscribe = useStudio.subscribe((state, prev) => {
      if (state.revision === prev.revision || state.revision === 0) return;
      if (state.saveState !== "saving") state.setSaveState("saving");
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    });
    const onHide = () => {
      if (document.visibilityState === "hidden" && useStudio.getState().saveState === "saving") {
        clearTimeout(timer);
        void flush().then(() => {
          clearTimeout(cloudTimer);
          if (cloud.active) void cloudFlush();
        });
      }
    };
    const onOffline = () => useStudio.getState().setSaveState("offline");
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("offline", onOffline);
    return () => {
      unsubscribe();
      clearTimeout(timer);
      clearTimeout(cloudTimer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Raccourcis clavier (CDC F-26).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=slider]")) return;
      const s = useStudio.getState();
      const id = selectedLayerId();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        s.redo();
      } else if (mod && key === "d" && id) {
        e.preventDefault();
        s.duplicateLayer(id);
      } else if ((e.key === "Delete" || e.key === "Backspace") && id) {
        e.preventDefault();
        s.removeLayer(id);
      } else if (e.key === "Escape") {
        if (s.preview) s.setPreview(false);
        else s.select(null);
      } else if (e.key.startsWith("Arrow") && id) {
        e.preventDefault();
        const step = e.shiftKey ? 0.02 : 0.005;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        s.updateLayer(
          id,
          (l) => ({
            ...l,
            transform: { ...l.transform, x: l.transform.x + dx, y: l.transform.y + dy },
          }),
          `nudge:${id}`,
        );
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.startsWith("Arrow")) useStudio.getState().seal();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p role="alert" className="text-danger">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col bg-[#0a1638]"
      data-studio-theme={resolvedTheme}
      style={accentVars(accent) as React.CSSProperties}
    >
      {/* Force le chargement des polices du studio pour la composition Canvas. */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] opacity-0">
        {Object.values(STUDIO_FONTS).map((f) => (
          <span key={f.label} className={f.className}>
            WEAR3D 0123456789
          </span>
        ))}
      </div>

      {ready ? (
        <>
          <AtlasComposer />
          <TopBar />
          <StatusBanner />
          <div className="flex min-h-0 flex-1">
            {!preview && <LeftRail />}
            <main
              className={cn(
                "studio-stage flex min-w-0 flex-1 gap-3 p-3",
                "bg-[radial-gradient(ellipse_at_45%_40%,#ffffff_0%,#eef3fb_45%,#dfe7f5_100%)]",
                !preview && "rounded-tl-2xl",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex min-h-0 flex-1 gap-3">
                  {libraryOpen && !preview && viewMode !== "pattern" && <LeftPanel />}
                  <Stage />
                  {!preview && (
                    <div className="hidden 2xl:flex">
                      <LayersPanel />
                    </div>
                  )}
                </div>
                {!preview && viewMode !== "pattern" && <BottomBar />}
              </div>
              {!preview &&
                (inspectorOpen ? (
                  <div className="flex w-[300px] shrink-0 flex-col gap-3">
                    <div className="flex max-h-[42%] min-h-0 2xl:hidden [&>section]:w-full">
                      <LayersPanel />
                    </div>
                    <div className="flex min-h-0 flex-1 [&>section]:w-full">
                      <Inspector />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => useStudio.getState().setInspectorOpen(true)}
                    className="flex w-10 shrink-0 flex-col items-center gap-3 rounded-2xl border border-white/70 bg-white/85 py-4 text-sm font-semibold text-[#0b1530] shadow-sm"
                    aria-label="Ouvrir l'inspecteur"
                  >
                    <ChevronsLeft className="size-5" aria-hidden />
                    <span className="[writing-mode:vertical-rl]">Inspecteur</span>
                  </button>
                ))}
            </main>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center gap-2 bg-[#eef3fb]">
          <Loader2 className="text-action size-5 animate-spin" aria-hidden />
          <span className="text-muted-foreground text-sm">Ouverture du studio…</span>
        </div>
      )}
    </div>
  );
}
