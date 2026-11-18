/**
 * Migrations du format de document (CDC §5.4) : toute évolution incrémente
 * `schemaVersion` et ajoute une fonction `n -> n+1` ici.
 */
import { designDocumentV1Schema, type DesignDocumentV1 } from "./v1";

export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Document courant (alias de la dernière version). */
export type DesignDocument = DesignDocumentV1;
export const designDocumentSchema = designDocumentV1Schema;

type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] transforme un document de version n en version n+1. */
const migrations: Record<number, Migration> = {};

export class DesignMigrationError extends Error {
  override name = "DesignMigrationError";
}

/**
 * Parse un document de n'importe quelle version connue, le migre jusqu'à la version
 * courante et le valide. Lève une erreur si la version est inconnue ou future.
 */
export function parseDesignDocument(input: unknown): DesignDocument {
  if (typeof input !== "object" || input === null) {
    throw new DesignMigrationError("Document de design invalide");
  }
  let doc = input as Record<string, unknown>;
  let version = doc.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    throw new DesignMigrationError("schemaVersion manquant ou invalide");
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new DesignMigrationError(
      `Version ${version} plus récente que celle supportée (${CURRENT_SCHEMA_VERSION})`,
    );
  }
  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new DesignMigrationError(`Migration ${version} → ${version + 1} absente`);
    doc = migrate(doc);
    version += 1;
  }
  return designDocumentSchema.parse(doc);
}

export function safeParseDesignDocument(
  input: unknown,
): { success: true; data: DesignDocument } | { success: false; error: Error } {
  try {
    return { success: true, data: parseDesignDocument(input) };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
