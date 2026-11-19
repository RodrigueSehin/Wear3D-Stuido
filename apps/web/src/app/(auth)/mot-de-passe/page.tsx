import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function Page() {
  return (
    <>
      <h1 className="font-display mb-1 text-3xl font-extrabold">Mot de passe oublié</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Saisissez votre adresse e-mail : nous vous envoyons un lien pour choisir un nouveau mot de
        passe.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
