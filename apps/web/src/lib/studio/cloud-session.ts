"use client";

/**
 * État de la synchronisation en ligne du design ouvert : actif seulement pour un utilisateur
 * connecté dont le design existe dans Supabase. Sinon le studio fonctionne en local (IndexedDB).
 */
import type { GarmentDefinition } from "@wear3d/garment-engine";
import { createEmptyDocument } from "@wear3d/design-schema";
import { isSupabaseConfigured } from "@/env";
import { createClient } from "@/lib/supabase/client";
import {
  createCloudDesign,
  loadCloudDesign,
  personalWorkspaceId,
  saveCloudDesign,
  snapshotCloudDesign,
  RevisionConflictError,
  type CloudClient,
  type CloudDesign,
} from "./cloud";
import { deleteDesign, type StoredDesign } from "./persistence";
import { useStudio } from "./store";

/** Identifiant Supabase (uuid) ou brouillon local (`d_<uuid>`). */
export const isCloudId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const cloud = { active: false, revision: 0, versionKey: "" };

/** Instantané automatique toutes les N sauvegardes en ligne. */
const SNAPSHOT_EVERY = 25;

export const db = () => createClient() as unknown as CloudClient;

export async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await createClient().auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Crée le design en ligne (projet inclus) dans l'espace personnel. */
export async function createOnline(
  userId: string,
  name: string,
  definition: GarmentDefinition,
  doc = createEmptyDocument(
    definition.versionId,
    definition.zones.map((z) => ({ code: z.code, ...z.defaults })),
  ),
): Promise<CloudDesign> {
  const workspaceId = await personalWorkspace(userId);
  return createCloudDesign(db(), {
    userId,
    workspaceId,
    name,
    versionKey: definition.versionId,
    document: doc,
  });
}

/** Reprise du brouillon local à la connexion : envoyé en ligne, puis retiré du navigateur. */
export async function importDraft(
  userId: string,
  draft: StoredDesign,
  definition: GarmentDefinition,
) {
  const created = await createOnline(userId, draft.name, definition, draft.document);
  await deleteDesign(draft.id);
  return created;
}

let workspaceCache: { userId: string; id: string } | null = null;

/** Espace personnel de l'utilisateur (mis en cache pour la session de l'onglet). */
export async function personalWorkspace(userId: string): Promise<string> {
  if (workspaceCache?.userId !== userId) {
    workspaceCache = { userId, id: await personalWorkspaceId(db(), userId) };
  }
  return workspaceCache.id;
}

export async function openOnline(id: string): Promise<CloudDesign | null> {
  const row = await loadCloudDesign(db(), id);
  if (row) {
    cloud.active = true;
    cloud.revision = row.revision;
    cloud.versionKey = row.document.model.versionId;
  }
  return row;
}

export type CloudSaveResult = "saved" | "conflict" | "offline" | "error";

/** Enregistre le design courant en ligne. */
export async function pushToCloud(): Promise<CloudSaveResult> {
  const s = useStudio.getState();
  if (!cloud.active || !s.designId || !s.doc) return "saved";
  try {
    cloud.revision = await saveCloudDesign(db(), {
      id: s.designId,
      document: s.doc,
      expectedRevision: cloud.revision,
      name: s.name,
    });
    // Changement de vêtement : la colonne model_version_id suit le document.
    if (cloud.versionKey && s.doc.model.versionId !== cloud.versionKey) {
      const v = await db()
        .from("garment_model_versions")
        .select("id")
        .eq("version_key", s.doc.model.versionId)
        .maybeSingle();
      const versionId = (v.data as { id: string } | null)?.id;
      if (versionId) {
        await db().from("designs").update({ model_version_id: versionId }).eq("id", s.designId);
        cloud.versionKey = s.doc.model.versionId;
      }
    }
    if (cloud.revision % SNAPSHOT_EVERY === 0) {
      await snapshotCloudDesign(db(), s.designId, "Sauvegarde automatique").catch(() => undefined);
    }
    return "saved";
  } catch (e) {
    if (e instanceof RevisionConflictError) return "conflict";
    return typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error";
  }
}

/** Conflit : « Garder cette version » reprend la révision courante puis écrase. */
export async function overwriteCloud(): Promise<CloudSaveResult> {
  const s = useStudio.getState();
  if (!s.designId) return "error";
  const latest = await loadCloudDesign(db(), s.designId);
  if (latest) cloud.revision = latest.revision;
  return pushToCloud();
}
