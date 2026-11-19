import { z } from "zod";

/** Règles de mot de passe affichées sur la maquette d'inscription. */
export const PASSWORD_RULES = [
  { id: "length", label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
  { id: "letter", label: "Au moins 1 lettre", test: (v: string) => /\p{L}/u.test(v) },
  { id: "digit", label: "Au moins 1 chiffre", test: (v: string) => /\d/.test(v) },
] as const;

export const USAGE_PROFILES = [
  { value: "individual", label: "Particulier" },
  { value: "club", label: "Club ou association sportive" },
  { value: "company", label: "Entreprise" },
  { value: "brand", label: "Marque ou créateur" },
] as const;

const email = z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide"));

const password = z
  .string()
  .refine(
    (v) => PASSWORD_RULES.every((r) => r.test(v)),
    "Le mot de passe ne respecte pas les règles",
  );

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe"),
});

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(60),
  lastName: z.string().trim().min(1, "Nom requis").max(60),
  email,
  password,
  usage: z.enum(["individual", "club", "company", "brand"]),
  terms: z.literal("on", "Acceptez les conditions d'utilisation"),
});

export const emailOnlySchema = z.object({ email });

export type FormState = { error?: string; ok?: string; fieldErrors?: Record<string, string> };

/** Première erreur de chaque champ, pour l'affichage sous les champs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** N'autorise que des chemins internes pour la redirection après connexion. */
export function safeNext(value: FormDataEntryValue | string | null | undefined): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : "/app";
}
