import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  WORKER_QUEUES: z.string().default("export,ai,image"),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
});

export type WorkerEnv = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): WorkerEnv {
  return schema.parse(source);
}
