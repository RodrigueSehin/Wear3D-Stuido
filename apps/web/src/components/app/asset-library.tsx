"use client";

import { Button } from "@wear3d/ui";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { removeCloudAsset } from "@/lib/studio/cloud-assets";
import { createClient } from "@/lib/supabase/client";

interface Item {
  id: string;
  name: string;
  localId: string;
  size: number;
  url: string | null;
}

const fmtSize = (n: number) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`;

/** Bibliothèque : images importées du compte (bucket privé, liens signés de courte durée). */
export function AssetLibrary() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error: err } = await sb
        .from("assets" as never)
        .select("id, name, size_bytes, storage_path")
        .order("created_at", { ascending: false });
      if (err) throw err;
      const rows =
        (data as { id: string; name: string; size_bytes: number; storage_path: string }[]) ?? [];
      const signed = rows.length
        ? await sb.storage.from("assets").createSignedUrls(
            rows.map((r) => r.storage_path),
            3600,
          )
        : { data: [] as { signedUrl: string }[] };
      setItems(
        rows.map((r, i) => ({
          id: r.id,
          name: r.name,
          size: r.size_bytes,
          localId: r.storage_path.split("/").pop()!,
          url: signed.data?.[i]?.signedUrl ?? null,
        })),
      );
    } catch {
      setError("Chargement impossible.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (items === null)
    return (
      <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label="Chargement" />
    );

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {items.length === 0 ? (
        <div className="border-border bg-surface shadow-card flex items-center gap-4 rounded-xl border p-6">
          <ImageIcon className="text-muted-foreground size-8 shrink-0" aria-hidden />
          <div className="text-sm">
            <p className="text-muted-foreground">
              Aucune image importée. Ajoutez vos logos depuis le panneau « Logos » du studio : ils
              apparaissent ici et sur tous vos appareils.
            </p>
            <Button asChild className="mt-3" size="sm">
              <Link href="/studio/nouveau">Ouvrir le studio</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((a) => (
            <li
              key={a.id}
              className="border-border bg-surface shadow-card overflow-hidden rounded-xl border"
            >
              <div className="bg-surface-muted grid h-32 place-items-center">
                {a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.name} className="max-h-28 max-w-full object-contain" />
                ) : (
                  <ImageIcon className="text-muted-foreground size-8" aria-hidden />
                )}
              </div>
              <div className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-muted-foreground text-xs">{fmtSize(a.size)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Supprimer ${a.name}`}
                  className="hover:bg-surface-muted rounded p-1.5"
                  onClick={async () => {
                    if (!window.confirm(`Supprimer « ${a.name} » ?`)) return;
                    await removeCloudAsset(a.localId);
                    void load();
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
