"use client";

import { CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { loadDesign, onRemoteSave, saveDesign } from "@/lib/studio/persistence";
import { useStudio } from "@/lib/studio/store";

function Bar({
  tone,
  icon,
  children,
}: {
  tone: "amber" | "red" | "blue";
  icon: ReactNode;
  children: ReactNode;
}) {
  const colors = {
    amber: "bg-amber-400/15 text-amber-200",
    red: "bg-red-500/20 text-red-200",
    blue: "bg-blue-500/20 text-blue-100",
  }[tone];
  return (
    <div role="status" className={`flex items-center gap-3 px-4 py-1.5 text-sm ${colors}`}>
      {icon}
      {children}
    </div>
  );
}

const btn =
  "rounded-md border border-current/40 px-2.5 py-0.5 text-xs font-semibold hover:bg-white/10";

/** États dégradés du studio : hors ligne, échec d'enregistrement, conflit entre onglets. */
export function StatusBanner() {
  const saveState = useStudio((s) => s.saveState);
  const conflict = useStudio((s) => s.conflict);
  const designId = useStudio((s) => s.designId);
  const [online, setOnline] = useState(true);

  const saveNow = async () => {
    const s = useStudio.getState();
    if (!s.designId || !s.doc) return;
    try {
      await saveDesign({
        id: s.designId,
        name: s.name,
        document: s.doc,
        updatedAt: new Date().toISOString(),
      });
      s.setSaveState("saved");
    } catch {
      s.setSaveState("error");
    }
  };

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => {
      setOnline(true);
      if (useStudio.getState().saveState === "offline" && !useStudio.getState().conflict)
        void saveNow();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!designId) return;
    return onRemoteSave(designId, () => useStudio.getState().setConflict(true));
  }, [designId]);

  const reloadTheirs = async () => {
    const s = useStudio.getState();
    if (!s.designId || !s.definition) return;
    const stored = await loadDesign(s.designId);
    if (stored)
      s.init({
        designId: s.designId,
        name: stored.name,
        definition: s.definition,
        doc: stored.document,
      });
  };
  const keepMine = async () => {
    useStudio.getState().setConflict(false);
    await saveNow();
  };

  if (conflict) {
    return (
      <Bar tone="blue" icon={<RefreshCw className="size-4 shrink-0" aria-hidden />}>
        <span className="flex-1">
          Ce design a été modifié dans un autre onglet. L&apos;enregistrement automatique est en
          pause.
        </span>
        <button type="button" className={btn} onClick={() => void reloadTheirs()}>
          Charger l&apos;autre version
        </button>
        <button type="button" className={btn} onClick={() => void keepMine()}>
          Garder cette version
        </button>
      </Bar>
    );
  }
  if (saveState === "error") {
    return (
      <Bar tone="red" icon={<TriangleAlert className="size-4 shrink-0" aria-hidden />}>
        <span className="flex-1">
          Enregistrement impossible (stockage du navigateur plein ou bloqué). Exportez votre travail
          pour ne rien perdre.
        </span>
        <button type="button" className={btn} onClick={() => void saveNow()}>
          Réessayer
        </button>
      </Bar>
    );
  }
  if (!online || saveState === "offline") {
    return (
      <Bar tone="amber" icon={<CloudOff className="size-4 shrink-0" aria-hidden />}>
        Vous êtes hors ligne : vos modifications restent enregistrées sur cet appareil.
      </Bar>
    );
  }
  return null;
}
