import { describe, expect, it } from "vitest";
import { emailOnlySchema, loginSchema, PASSWORD_RULES, safeNext, signUpSchema } from "./schemas";

const base = {
  firstName: "Awa",
  lastName: "Diallo",
  email: "Awa@Example.com ",
  password: "motdepasse1",
  usage: "club",
  terms: "on",
};

describe("inscription", () => {
  it("accepte une inscription valide et normalise l'e-mail", () => {
    const r = signUpSchema.parse(base);
    expect(r.email).toBe("awa@example.com");
  });

  it("refuse un mot de passe sans chiffre ou trop court", () => {
    expect(signUpSchema.safeParse({ ...base, password: "motdepasse" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: "a1" }).success).toBe(false);
  });

  it("exige les conditions d'utilisation, un profil connu et un e-mail valide", () => {
    expect(signUpSchema.safeParse({ ...base, terms: undefined }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, usage: "autre" }).success).toBe(false);
    expect(emailOnlySchema.safeParse({ email: "pas-un-email" }).success).toBe(false);
  });

  it("les règles affichées couvrent longueur, lettre et chiffre", () => {
    const ok = (v: string) => PASSWORD_RULES.map((r) => r.test(v));
    expect(ok("abcdefg1")).toEqual([true, true, true]);
    expect(ok("12345678")).toEqual([true, false, true]);
  });
});

describe("connexion", () => {
  it("demande un mot de passe", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("redirection après connexion", () => {
  it("n'accepte que des chemins internes", () => {
    expect(safeNext("/studio/abc")).toBe("/studio/abc");
    expect(safeNext("https://evil.test")).toBe("/app");
    expect(safeNext("//evil.test")).toBe("/app");
    expect(safeNext("/\\evil")).toBe("/app");
    expect(safeNext(null)).toBe("/app");
  });
});
