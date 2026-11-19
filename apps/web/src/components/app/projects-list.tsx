"use client";

import { Button } from "@wear3d/ui";
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteCloudDesign,
  listCloudDesigns,
  purgeExpiredTrash,
  restoreCloudDesign,
  TRASH_RETENTION_DAYS,
  trashCloudDesign,
  type DesignSummary,
} from "@/lib/studio/cloud";
import { db } from "@/lib/studio/cloud-session";

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Mes créations : designs en ligne de l'espace personnel, avec corbeille et restauration. */
export function ProjectsList() {
  const [trash, setTrash] = useState(false);
  const [items, setItems] = useState<DesignSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      if (trash) await purgeExpiredTrash(db());
      setItems(await listCloudDesigns(db(), { trash }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
      setItems([]);
    }
  }, [trash]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible");
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold">Mes créations</h1>
        <div className="flex items-center gap-2">
          <Button variant={trash ? "outline" : "primary"} onClick={() => setTrash(false)}>
            Actives
          </Button>
          <Button variant={trash ? "primary" : "outline"} onClick={() => setTrash(true)}>
            <Trash2 className="size-4" aria-hidden /> Corbeille
          </Button>
          {!trash && (
            <Button asChild>
              <Link href="/studio/nouveau">
                <Plus className="size-4" aria-hidden /> Nouveau design
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {items === null ? (
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label="Chargement" />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {trash
            ? `La corbeille est vide. Les créations y sont conservées ${TRASH_RETENTION_DAYS} jours.`
            : "Aucune création pour l'instant. Lancez le studio !"}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((d) => (
            <li key={d.id} className="border-border bg-surface shadow-card rounded-xl border p-4">
              <p className="truncate font-semibold">{d.name}</p>
              <p className="text-muted-foreground mb-3 text-xs">
                Modifié le {fmt.format(new Date(d.updatedAt))}
              </p>
              <div className="flex gap-2">
                {trash ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => void act(() => restoreCloudDesign(db(), d.id))}
                    >
                      <RotateCcw className="size-4" aria-hidden /> Restaurer
                    </Button>
                    <Button
                      variant="outline"
                      aria-label={`Supprimer définitivement ${d.name}`}
                      onClick={() => {
                        const ok = window.confirm(
                          `Supprimer définitivement « ${d.name} » ? Cette action est irréversible.`,
                        );
                        if (ok) void act(() => deleteCloudDesign(db(), d.id));
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild>
                      <Link href={`/studio/${d.id}`}>Ouvrir</Link>
                    </Button>
                    <Button
                      variant="outline"
                      aria-label={`Mettre ${d.name} à la corbeille`}
                      onClick={() => void act(() => trashCloudDesign(db(), d.id))}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
