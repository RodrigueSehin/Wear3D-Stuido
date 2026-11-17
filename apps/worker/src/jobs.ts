/** Types de jobs et statuts (CDC §4.5, table `jobs`). */
export type JobKind = "export" | "ai" | "image";
export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface JobMessage {
  jobId: string;
  kind: JobKind;
  attempt: number;
}

export type JobHandler = (msg: JobMessage) => Promise<void>;

/**
 * Décide du statut suivant après un échec : nouvelle tentative tant que
 * `attempt < maxAttempts`, puis `failed` (les crédits sont alors remboursés).
 */
export function nextStatusAfterFailure(attempt: number, maxAttempts: number): JobStatus {
  return attempt < maxAttempts ? "pending" : "failed";
}
