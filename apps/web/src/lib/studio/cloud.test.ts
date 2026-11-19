import { createEmptyDocument } from "@wear3d/design-schema";
import { describe, expect, it } from "vitest";
import {
  purgeExpiredTrash,
  RevisionConflictError,
  saveCloudDesign,
  type CloudClient,
} from "./cloud";

const doc = createEmptyDocument("tshirt-classic@1", [
  { code: "BODY_FRONT", color: "#fff", material: "cotton" },
]);

const clientReturning = (result: {
  data: unknown;
  error: { code?: string; message: string } | null;
}) => ({ from: () => ({}), rpc: async () => result }) as CloudClient;

describe("sauvegarde en ligne", () => {
  it("renvoie la nouvelle révision", async () => {
    const n = await saveCloudDesign(clientReturning({ data: 4, error: null }), {
      id: "d",
      document: doc,
      expectedRevision: 3,
    });
    expect(n).toBe(4);
  });

  it("transforme l'erreur 40001 en conflit de révision", async () => {
    await expect(
      saveCloudDesign(
        clientReturning({ data: null, error: { code: "40001", message: "revision_conflict" } }),
        {
          id: "d",
          document: doc,
          expectedRevision: 1,
        },
      ),
    ).rejects.toBeInstanceOf(RevisionConflictError);
  });

  it("remonte les autres erreurs telles quelles", async () => {
    await expect(
      saveCloudDesign(
        clientReturning({ data: null, error: { code: "42501", message: "denied" } }),
        {
          id: "d",
          document: doc,
          expectedRevision: 1,
        },
      ),
    ).rejects.toThrow("denied");
  });
});

describe("corbeille", () => {
  it("purge seulement les designs plus vieux que la durée de conservation", async () => {
    const deleted: string[] = [];
    let cutoff = "";
    // Faux client chaînable : enregistre le seuil de date et les suppressions.
    const chain = (table: string, op: { kind: string }): unknown =>
      new Proxy(() => undefined, {
        get: (_t, prop) => {
          if (prop === "then") {
            const res =
              op.kind === "select-old"
                ? { data: [{ id: "old" }], error: null }
                : { data: null, error: null };
            return (resolve: (v: unknown) => void) => resolve(res);
          }
          return (...args: unknown[]) => {
            if (prop === "lt") cutoff = String(args[1]);
            if (prop === "delete") op.kind = "delete";
            if (prop === "eq" && op.kind === "delete" && table === "designs")
              deleted.push(String(args[1]));
            return chain(table, op);
          };
        },
      });
    const client = {
      from: (table: string) => ({
        select: () => chain(table, { kind: "select-old" }),
        delete: () => chain(table, { kind: "delete" }),
      }),
      rpc: async () => ({ data: null, error: null }),
    } as unknown as CloudClient;
    const now = new Date("2026-11-30T00:00:00Z");
    const n = await purgeExpiredTrash(client, now);
    expect(n).toBe(1);
    expect(cutoff).toBe("2026-10-31T00:00:00.000Z");
    expect(deleted).toContain("old");
  });
});
