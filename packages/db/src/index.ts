/**
 * @wear3d/db — types générés Supabase et requêtes partagées.
 * Regénérer les types : `pnpm db:types` (une fois le projet lié).
 */
export type { Database, Json } from "./database.types";

export const STORAGE_BUCKETS = {
  assets: "assets",
  exports: "exports",
  garments: "garments",
} as const;

/** Les chemins privés sont préfixés par workspace_id (CDC S-03). */
export function workspacePath(workspaceId: string, ...segments: string[]): string {
  return [workspaceId, ...segments].join("/");
}
