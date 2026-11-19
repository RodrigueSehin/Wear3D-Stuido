"use client";

/**
 * Images importées : copie privée dans le bucket Supabase `assets` (<espace>/<id>) et ligne dans
 * `assets`. Le navigateur garde son cache (IndexedDB) ; la copie en ligne sert à retrouver ses
 * logos sur un autre appareil. Tout est « au mieux » : un échec réseau ne bloque jamais l'import.
 */
import { createClient } from "@/lib/supabase/client";
import { currentUserId, personalWorkspace } from "./cloud-session";
import { type StoredAsset } from "./persistence";

const BUCKET = "assets";
const UUID_TAIL = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identifiant de la ligne `assets` : la partie uuid de l'identifiant local. */
export const cloudAssetId = (localId: string) => UUID_TAIL.exec(localId)?.[0] ?? null;

export async function uploadAsset(asset: StoredAsset): Promise<boolean> {
  try {
    const userId = await currentUserId();
    const id = cloudAssetId(asset.id);
    if (!userId || !id) return false;
    const ws = await personalWorkspace(userId);
    const sb = createClient();
    const path = `${ws}/${asset.id}`;
    const up = await sb.storage.from(BUCKET).upload(path, asset.blob, {
      contentType: asset.type,
      upsert: true,
    });
    if (up.error) return false;
    const { error } = await sb.from("assets" as never).upsert({
      id,
      workspace_id: ws,
      name: asset.name,
      kind: "image",
      mime_type: asset.type,
      size_bytes: asset.blob.size,
      width: asset.width,
      height: asset.height,
      storage_path: path,
      created_by: userId,
    } as never);
    return !error;
  } catch {
    return false;
  }
}

export async function downloadAsset(localId: string): Promise<StoredAsset | undefined> {
  try {
    const userId = await currentUserId();
    const id = cloudAssetId(localId);
    if (!userId || !id) return undefined;
    const sb = createClient();
    const { data: row } = await sb
      .from("assets" as never)
      .select("name, mime_type, width, height, storage_path")
      .eq("id", id)
      .maybeSingle();
    const meta = row as {
      name: string;
      mime_type: string;
      width: number | null;
      height: number | null;
      storage_path: string;
    } | null;
    if (!meta) return undefined;
    const dl = await sb.storage.from(BUCKET).download(meta.storage_path);
    if (dl.error || !dl.data) return undefined;
    return {
      id: localId,
      name: meta.name,
      type: meta.mime_type,
      blob: dl.data,
      width: meta.width ?? 1024,
      height: meta.height ?? 1024,
    };
  } catch {
    return undefined;
  }
}

/** Images de l'utilisateur en ligne : [identifiant local, nom]. */
export async function listCloudAssets(): Promise<{ id: string; storagePath: string }[]> {
  try {
    if (!(await currentUserId())) return [];
    const { data } = await createClient()
      .from("assets" as never)
      .select("storage_path")
      .order("created_at", { ascending: false });
    return ((data as { storage_path: string }[] | null) ?? []).map((r) => ({
      id: r.storage_path.split("/").pop()!,
      storagePath: r.storage_path,
    }));
  } catch {
    return [];
  }
}

export async function removeCloudAsset(localId: string): Promise<void> {
  try {
    const userId = await currentUserId();
    const id = cloudAssetId(localId);
    if (!userId || !id) return;
    const ws = await personalWorkspace(userId);
    const sb = createClient();
    await sb.storage.from(BUCKET).remove([`${ws}/${localId}`]);
    await sb
      .from("assets" as never)
      .delete()
      .eq("id", id);
  } catch {
    // Au mieux : l'image locale est déjà supprimée.
  }
}
