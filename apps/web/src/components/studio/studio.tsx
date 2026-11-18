"use client";

import { createEmptyDocument } from "@wear3d/design-schema";
import { getGarmentByReference, getGarmentByVersion, TSHIRT_CLASSIC } from "@wear3d/garment-engine";
import type { GarmentViewerHandle } from "@wear3d/garment-engine/react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STUDIO_FONTS } from "@/lib/studio/fonts";
import { loadDesign, saveDesign } from "@/lib/studio/persistence";
import { useStudio } from "@/lib/studio/store";
import { Inspector } from "./inspector";
import { ToolPanel } from "./tool-panel";
import { ToolRail } from "./tool-rail";
import { TopBar } from "./top-bar";

const Viewport = dynamic(() => import("./viewport").then((m) => m.Viewport), {
  ssr: false,
  loading: () => (
    <div className="bg-viewport flex flex-1 items-center justify-center">
      <div className="bg-brand-navy-900/10 h-64 w-48 animate-pulse rounded-[40%_40%_12%_12%]" />
    </div>
  ),
});

/** Délai d'autosave : bien en dessous des 5 s exigées (CDC F-16, REC-08). */
const AUTOSAVE_DELAY_MS = 800;

export function Studio({
  designId,
  modelReference,
}: {
  designId: string;
  modelReference?: string;
}) {
  const router = useRouter();
  const viewerRef = useRef<GarmentViewerHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedId = useStudio((s) => s.designId);
  const ready = loadedId === designId && useStudio.getState().doc !== null;

  // Chargement ou création du brouillon local.
  useEffect(() => {
    if (designId === "nouveau") {
      const id = `d_${crypto.randomUUID()}`;
      const query = modelReference ? `?modele=${encodeURIComponent(modelReference)}` : "";
      router.replace(`/studio/${id}${query}`);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const stored = await loadDesign(designId);
        if (cancelled) return;
        if (stored) {
          const definition = getGarmentByVersion(stored.document.model.versionId);
          if (!definition) throw new Error("Modèle 3D introuvable pour ce design");
          useStudio
            .getState()
            .init({ designId, name: stored.name, definition, doc: stored.document });
          return;
        }
        const definition =
          (modelReference && getGarmentByReference(modelReference)) || TSHIRT_CLASSIC;
        const doc = createEmptyDocument(
          definition.versionId,
          definition.zones.map((z) => ({ code: z.code, ...z.defaults })),
        );
        useStudio.getState().init({ designId, name: definition.name, definition, doc });
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
      if (!s.designId || !s.doc) return;
      try {
        await saveDesign({
          id: s.designId,
          name: s.name,
          document: s.doc,
          updatedAt: new Date().toISOString(),
        });
        s.setSaveState(navigator.onLine ? "saved" : "offline");
      } catch {
        s.setSaveState("error");
      }
    };
    const unsubscribe = useStudio.subscribe((state, prev) => {
      if (state.revision === prev.revision || state.revision === 0) return;
      state.setSaveState("saving");
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    });
    const onHide = () => {
      if (document.visibilityState === "hidden" && useStudio.getState().saveState === "saving") {
        clearTimeout(timer);
        void flush();
      }
    };
    const onOffline = () => useStudio.getState().setSaveState("offline");
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("offline", onOffline);
    return () => {
      unsubscribe();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Raccourcis clavier (CDC F-26).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      const s = useStudio.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        s.redo();
      } else if (mod && key === "d" && s.selectedLayerId) {
        e.preventDefault();
        s.duplicateLayer(s.selectedLayerId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && s.selectedLayerId) {
        e.preventDefault();
        s.removeLayer(s.selectedLayerId);
      } else if (e.key === "Escape") {
        s.selectLayer(null);
      } else if (e.key.startsWith("Arrow") && s.selectedLayerId) {
        e.preventDefault();
        const step = e.shiftKey ? 0.02 : 0.005;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        s.updateLayer(
          s.selectedLayerId,
          (l) => ({
            ...l,
            transform: { ...l.transform, x: l.transform.x + dx, y: l.transform.y + dy },
          }),
          `nudge:${s.selectedLayerId}`,
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
    <div className="flex h-full flex-col">
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
          <TopBar viewerRef={viewerRef} />
          <div className="relative flex min-h-0 flex-1">
            <ToolRail />
            <ToolPanel />
            <Viewport viewerRef={viewerRef} />
            <Inspector />
          </div>
        </>
      ) : (
        <div className="bg-viewport flex h-full items-center justify-center gap-2">
          <Loader2 className="text-action size-5 animate-spin" aria-hidden />
          <span className="text-muted-foreground text-sm">Ouverture du studio…</span>
        </div>
      )}
    </div>
  );
}
