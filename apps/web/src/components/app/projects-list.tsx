"use client";

import { getGarmentByVersion } from "@wear3d/garment-engine";
import { Badge, Button, cn } from "@wear3d/ui";
import { ChevronLeft, ChevronRight, Loader2, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { JerseyThumb } from "@/components/studio/jersey-thumb";
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
import { previewColors } from "@/lib/app/preview";

const PAGE_SIZE = 8;
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

const STATUS: Record<string, { label: string; variant: "blue" | "success" | "violet" | "amber" }> =
  {
    draft: { label: "Brouillon", variant: "blue" },
    submitted: { label: "En cours", variant: "violet" },
    approved: { label: "Validée", variant: "success" },
    changes_requested: { label: "À modifier", variant: "amber" },
  };

const FAMILY_LABELS: Record<string, string> = {
  tshirts: "T-shirts",
  football: "Maillots",
  hoodies: "Hoodies",
};

const familyOf = (d: DesignSummary) => {
  const key = (d.document as { model?: { versionId?: string } } | null)?.model?.versionId;
  return (key && getGarmentByVersion(key)?.family) || "autres";
};

type Sort = "recent" | "oldest" | "name";

/** Mes créations : designs en ligne de l'espace personnel (filtres, recherche, tri, pagination, corbeille). */
export function ProjectsList() {
  const [trash, setTrash] = useState(false);
  const [items, setItems] = useState<DesignSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(1);

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

  const families = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of items ?? []) counts.set(familyOf(d), (counts.get(familyOf(d)) ?? 0) + 1);
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (items ?? []).filter(
      (d) =>
        (family === "all" || familyOf(d) === family) && (!q || d.name.toLowerCase().includes(q)),
    );
    return list.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "fr")
        : sort === "oldest"
          ? a.updatedAt.localeCompare(b.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
  }, [items, family, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-4 py-1.5 text-sm font-semibold transition",
      active ? "bg-action text-white" : "hover:bg-surface-muted",
    );

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{trash ? "Corbeille" : "Mes créations"}</h1>
          <p className="text-muted-foreground text-sm">
            {trash
              ? `Les créations y sont conservées ${TRASH_RETENTION_DAYS} jours.`
              : "Retrouvez toutes vos créations, modifiez-les, visualisez-les en 3D et partagez-les."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setTrash((t) => !t);
              setPage(1);
              setFamily("all");
            }}
          >
            <Trash2 className="size-4" aria-hidden /> {trash ? "Retour aux créations" : "Corbeille"}
          </Button>
          {!trash && (
            <Button asChild>
              <Link href="/studio/nouveau">
                <Plus className="size-4" aria-hidden /> Nouvelle création
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Familles"
          className="border-border bg-surface flex flex-wrap gap-1 rounded-full border p-1"
        >
          <button
            type="button"
            className={chip(family === "all")}
            aria-pressed={family === "all"}
            onClick={() => {
              setFamily("all");
              setPage(1);
            }}
          >
            Toutes ({items?.length ?? 0})
          </button>
          {[...families].map(([id, n]) => (
            <button
              key={id}
              type="button"
              className={chip(family === id)}
              aria-pressed={family === id}
              onClick={() => {
                setFamily(id);
                setPage(1);
              }}
            >
              {FAMILY_LABELS[id] ?? "Autres"} ({n})
            </button>
          ))}
        </div>
        <label className="border-border bg-surface relative ml-auto flex items-center rounded-full border">
          <Search className="text-muted-foreground absolute left-3 size-4" aria-hidden />
          <span className="sr-only">Rechercher une création</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher…"
            className="h-9 w-48 rounded-full bg-transparent pl-9 pr-3 text-sm outline-none"
          />
        </label>
        <label className="text-sm">
          <span className="sr-only">Trier</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="border-border bg-surface h-9 rounded-full border px-3 text-sm"
          >
            <option value="recent">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="name">Nom (A-Z)</option>
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {items === null ? (
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label="Chargement" />
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {trash
            ? "La corbeille est vide."
            : items.length === 0
              ? "Aucune création pour l'instant. Lancez le studio !"
              : "Aucune création ne correspond à votre recherche."}
        </p>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map((d) => {
              const c = previewColors(d.document);
              const status = STATUS[d.reviewStatus] ?? STATUS.draft!;
              return (
                <li
                  key={d.id}
                  className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
                >
                  <Link
                    href={trash ? "#" : `/studio/${d.id}`}
                    aria-label={`Ouvrir ${d.name}`}
                    className="relative block bg-gradient-to-b from-[#dbe6fb] to-[#f4f7fe] p-4"
                  >
                    <JerseyThumb
                      body={c.body}
                      sleeves={c.sleeves}
                      collar={c.collar}
                      className="mx-auto h-44 w-full"
                    />
                    <Badge variant="outline" className="bg-surface/90 absolute right-3 top-3">
                      3D
                    </Badge>
                  </Link>
                  <div className="space-y-2 p-4">
                    <p className="truncate font-semibold">{d.name}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs">
                        {fmt.format(new Date(d.updatedAt))}
                      </span>
                      {!trash && <Badge variant={status.variant}>{status.label}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {trash ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void act(() => restoreCloudDesign(db(), d.id))}
                          >
                            <RotateCcw className="size-4" aria-hidden /> Restaurer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Supprimer définitivement ${d.name}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Supprimer définitivement « ${d.name} » ? Cette action est irréversible.`,
                                )
                              )
                                void act(() => deleteCloudDesign(db(), d.id));
                            }}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/studio/${d.id}`}>Ouvrir</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Mettre ${d.name} à la corbeille`}
                            onClick={() => void act(() => trashCloudDesign(db(), d.id))}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              Affichage de {(current - 1) * PAGE_SIZE + 1} à{" "}
              {Math.min(current * PAGE_SIZE, filtered.length)} sur {filtered.length} création
              {filtered.length > 1 ? "s" : ""}
            </p>
            {pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={n === current ? "primary" : "outline"}
                    aria-current={n === current ? "page" : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  );
}
