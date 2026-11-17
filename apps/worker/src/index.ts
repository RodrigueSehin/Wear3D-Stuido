/**
 * Worker WEAR3D : consomme les files pgmq (export, ai, image).
 * Phase 0 : boucle de démarrage et arrêt propre. Lecture pgmq en phase 5.
 */
import { loadEnv } from "./env";
import type { JobHandler, JobKind } from "./jobs";

const env = loadEnv();

const handlers: Record<JobKind, JobHandler> = {
  export: async (msg) => console.info("[export] à implémenter (phase 5)", msg.jobId),
  ai: async (msg) => console.info("[ai] à implémenter (phase 7)", msg.jobId),
  image: async (msg) => console.info("[image] à implémenter (phase 5)", msg.jobId),
};

let running = true;

async function poll(): Promise<void> {
  // Phase 5 : pgmq.read() sur chaque file, puis handlers[kind](msg).
  void handlers;
}

async function main(): Promise<void> {
  const configured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  console.info(
    `[worker] démarré — files : ${env.WORKER_QUEUES} — Supabase ${configured ? "configuré" : "non configuré"}`,
  );
  while (running) {
    await poll();
    await new Promise((r) => setTimeout(r, env.WORKER_POLL_INTERVAL_MS));
  }
  console.info("[worker] arrêté");
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    running = false;
  });
}

main().catch((err) => {
  console.error("[worker] erreur fatale", err);
  process.exit(1);
});
