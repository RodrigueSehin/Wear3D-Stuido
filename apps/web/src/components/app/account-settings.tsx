"use client";

import { Button, Input } from "@wear3d/ui";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

const LOCALES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

/** Paramètres du compte : profil (nom, langue), mot de passe, déconnexion. */
export function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [locale, setLocale] = useState("fr");
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const sb = createClient();
      const { data } = await sb.auth.getUser();
      if (!data.user) return setLoading(false);
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");
      const { data: p } = await sb
        .from("profiles" as never)
        .select("display_name, locale")
        .eq("id", data.user.id)
        .maybeSingle();
      const profile = p as { display_name: string; locale: string } | null;
      setName(profile?.display_name ?? "");
      setLocale(profile?.locale ?? "fr");
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return setStatus({ error: "Le nom ne peut pas être vide." });
    setSaving(true);
    setStatus({});
    const { error } = await createClient()
      .from("profiles" as never)
      .update({ display_name: clean.slice(0, 80), locale } as never)
      .eq("id", userId);
    setSaving(false);
    setStatus(
      error ? { error: "Enregistrement impossible. Réessayez." } : { ok: "Profil enregistré." },
    );
  };

  const resetPassword = async () => {
    setStatus({});
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/app/parametres`,
    });
    setStatus(
      error
        ? { error: "Envoi impossible pour le moment." }
        : { ok: "Un lien de réinitialisation vient d'être envoyé à votre adresse e-mail." },
    );
  };

  if (loading)
    return (
      <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label="Chargement" />
    );

  return (
    <div className="max-w-2xl space-y-6">
      {status.ok && (
        <p role="status" className="bg-success-soft text-success rounded-lg px-3 py-2 text-sm">
          {status.ok}
        </p>
      )}
      {status.error && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {status.error}
        </p>
      )}

      <form
        onSubmit={save}
        className="border-border bg-surface shadow-card space-y-4 rounded-2xl border p-6"
      >
        <h2 className="text-xl font-extrabold">Profil</h2>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Adresse e-mail
          </label>
          <Input id="email" value={email} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nom affiché
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="locale" className="text-sm font-medium">
            Langue
          </label>
          <select
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="border-border bg-surface h-10 w-full rounded-lg border px-3 text-sm"
          >
            {LOCALES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} Enregistrer
        </Button>
      </form>

      <section className="border-border bg-surface shadow-card space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-extrabold">Sécurité</h2>
        <p className="text-muted-foreground text-sm">
          Pour changer de mot de passe, recevez un lien de réinitialisation par e-mail.
        </p>
        <Button type="button" variant="outline" onClick={() => void resetPassword()}>
          Changer le mot de passe
        </Button>
      </section>

      <section className="border-border bg-surface shadow-card space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-extrabold">Session</h2>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Se déconnecter
          </Button>
        </form>
        <p className="text-muted-foreground text-xs">
          Pour supprimer votre compte et vos données, écrivez-nous depuis la page{" "}
          <Link href="/ressources#contact" className="text-action underline">
            Ressources
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
