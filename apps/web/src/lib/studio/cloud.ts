/**
 * Sauvegarde en ligne des designs (Supabase). Le brouillon local (IndexedDB) reste la source
 * hors ligne ; ce module synchronise avec `designs` quand l'utilisateur est connecté.
 *
 * Concurrence : `save_design` n'écrit que si la révision attendue est encore la courante ;
 * sinon la base lève 40001 et on remonte un `RevisionConflictError` (le studio propose alors
 * de charger l'autre version ou de garder la sienne).
 */
import { parseDesignDocument, type DesignDocument } from "@wear3d/design-schema";

/** Sous-ensemble du client Supabase utilisé ici (facilite les tests). */
export interface CloudClient {
  from(table: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{
    data: unknown;
    error: { code?: string; message: string } | null;
  }>;
}

export class RevisionConflictError extends Error {
  constructor() {
    super("Le design a été modifié ailleurs");
    this.name = "RevisionConflictError";
  }
}

export interface CloudDesign {
  id: string;
  name: string;
  document: DesignDocument;
  revision: number;
  updatedAt: string;
}

export interface DesignSummary {
  id: string;
  name: string;
  projectId: string;
  updatedAt: string;
  thumbnailPath: string | null;
  deletedAt: string | null;
  reviewStatus: string;
  /** Document brut : sert à l'aperçu (couleurs) et à la famille de vêtement. */
  document: unknown;
}

interface Row {
  id: string;
  name: string;
  document: unknown;
  revision: number;
  updated_at: string;
}

const toDesign = (r: Row): CloudDesign => ({
  id: r.id,
  name: r.name,
  // Valide et migre : un document ancien ou corrompu ne casse pas le studio.
  document: parseDesignDocument(r.document),
  revision: r.revision,
  updatedAt: r.updated_at,
});

/** Espace personnel de l'utilisateur (créé à l'inscription par le déclencheur). */
export async function personalWorkspaceId(db: CloudClient, userId: string): Promise<string> {
  const { data, error } = await db
    .from("workspace_members")
    .select("workspace_id, workspaces!inner(kind)")
    .eq("user_id", userId)
    .eq("workspaces.kind", "personal")
    .limit(1)
    .single();
  if (error || !data) throw new Error("Espace personnel introuvable");
  return (data as { workspace_id: string }).workspace_id;
}

/** Crée un design (et son projet) à partir d'un brouillon local. */
export async function createCloudDesign(
  db: CloudClient,
  input: {
    userId: string;
    workspaceId: string;
    name: string;
    versionKey: string;
    document: DesignDocument;
  },
): Promise<CloudDesign> {
  const version = await db
    .from("garment_model_versions")
    .select("id")
    .eq("version_key", input.versionKey)
    .single();
  if (version.error || !version.data) throw new Error("Modèle 3D inconnu du catalogue");

  const project = await db
    .from("projects")
    .insert({ workspace_id: input.workspaceId, name: input.name, created_by: input.userId })
    .select("id")
    .single();
  if (project.error) throw new Error(project.error.message);

  const design = await db
    .from("designs")
    .insert({
      workspace_id: input.workspaceId,
      project_id: project.data.id,
      model_version_id: version.data.id,
      name: input.name,
      document: input.document,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("id, name, document, revision, updated_at")
    .single();
  if (design.error) throw new Error(design.error.message);
  return toDesign(design.data as Row);
}

export async function loadCloudDesign(db: CloudClient, id: string): Promise<CloudDesign | null> {
  const { data, error } = await db
    .from("designs")
    .select("id, name, document, revision, updated_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toDesign(data as Row) : null;
}

/** Enregistre ; renvoie la nouvelle révision. Lève `RevisionConflictError` si périmée. */
export async function saveCloudDesign(
  db: CloudClient,
  input: { id: string; document: DesignDocument; expectedRevision: number; name?: string },
): Promise<number> {
  const { data, error } = await db.rpc("save_design", {
    p_id: input.id,
    p_document: input.document,
    p_expected_revision: input.expectedRevision,
    p_name: input.name ?? null,
  });
  if (error) {
    if (error.code === "40001" || error.message.includes("revision_conflict")) {
      throw new RevisionConflictError();
    }
    throw new Error(error.message);
  }
  return data as number;
}

export async function listCloudDesigns(
  db: CloudClient,
  opts: { trash?: boolean } = {},
): Promise<DesignSummary[]> {
  let q = db
    .from("designs")
    .select("id, name, project_id, updated_at, thumbnail_path, deleted_at, review_status, document")
    .order("updated_at", { ascending: false });
  q = opts.trash ? q.not("deleted_at", "is", null) : q.is("deleted_at", null);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    projectId: String(r.project_id),
    updatedAt: String(r.updated_at),
    thumbnailPath: (r.thumbnail_path as string | null) ?? null,
    deletedAt: (r.deleted_at as string | null) ?? null,
    reviewStatus: String(r.review_status ?? "draft"),
    document: r.document,
  }));
}

/** Corbeille : suppression logique, récupérable. */
export async function trashCloudDesign(db: CloudClient, id: string): Promise<void> {
  const { error } = await db
    .from("designs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function restoreCloudDesign(db: CloudClient, id: string): Promise<void> {
  const { error } = await db.from("designs").update({ deleted_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function snapshotCloudDesign(
  db: CloudClient,
  id: string,
  label?: string,
): Promise<void> {
  const { error } = await db.rpc("snapshot_design", { p_id: id, p_label: label ?? null });
  if (error) throw new Error(error.message);
}

/** Durée de conservation en corbeille avant suppression définitive. */
export const TRASH_RETENTION_DAYS = 30;

/** Suppression définitive (le projet vide est supprimé avec le design). */
export async function deleteCloudDesign(db: CloudClient, id: string): Promise<void> {
  const found = await db.from("designs").select("project_id").eq("id", id).maybeSingle();
  const { error } = await db.from("designs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  const projectId = (found.data as { project_id?: string } | null)?.project_id;
  if (projectId) {
    const left = await db.from("designs").select("id").eq("project_id", projectId).limit(1);
    if (!(left.data as unknown[] | null)?.length)
      await db.from("projects").delete().eq("id", projectId);
  }
}

/** Purge les designs en corbeille depuis plus de `TRASH_RETENTION_DAYS` ; renvoie leur nombre. */
export async function purgeExpiredTrash(db: CloudClient, now = new Date()): Promise<number> {
  const limit = new Date(now.getTime() - TRASH_RETENTION_DAYS * 86_400_000).toISOString();
  const { data, error } = await db
    .from("designs")
    .select("id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", limit);
  if (error) throw new Error(error.message);
  const ids = ((data as { id: string }[] | null) ?? []).map((r) => r.id);
  for (const id of ids) await deleteCloudDesign(db, id);
  return ids.length;
}
