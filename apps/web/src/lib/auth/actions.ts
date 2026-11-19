"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/env";
import { createClient } from "@/lib/supabase/server";
import {
  emailOnlySchema,
  fieldErrors,
  loginSchema,
  safeNext,
  signUpSchema,
  type FormState,
} from "./schemas";

const NOT_CONFIGURED: FormState = {
  error: "Le service d'authentification n'est pas configuré (variables Supabase manquantes).",
};

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Message neutre : ne révèle pas si l'adresse existe (CDC S-xx, énumération de comptes). */
const BAD_CREDENTIALS = "E-mail ou mot de passe incorrect.";

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirmez votre adresse e-mail avant de vous connecter."
          : BAD_CREDENTIALS,
    };
  }
  redirect(safeNext(form.get("suite")));
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { email, password, firstName, lastName, usage } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=/bienvenue`,
      // Lus par le déclencheur handle_new_user (profil + espace personnel).
      data: { first_name: firstName, last_name: lastName, usage_profile: usage, locale: "fr" },
    },
  });
  if (error) {
    return { error: "Création du compte impossible. Vérifiez vos informations et réessayez." };
  }
  redirect(`/verification?email=${encodeURIComponent(email)}`);
}

export async function sendMagicLink(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const next = safeNext(form.get("suite"));
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: "Envoi impossible pour le moment. Réessayez dans un instant." };
  return {
    ok: "Si un compte existe pour cette adresse, un lien de connexion vient d'être envoyé.",
  };
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await origin()}/auth/callback?next=/app/parametres`,
  });
  // Même réponse que l'adresse existe ou non.
  return {
    ok: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.",
  };
}

export async function signInWithProvider(
  provider: "google" | "azure" | "apple",
  next: string,
): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error || !data.url) return { error: "Ce fournisseur de connexion n'est pas disponible." };
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
