import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Créer un compte" };

export default function Page() {
  return (
    <>
      <h1 className="font-display mb-1 text-3xl font-extrabold">Créer un compte</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Gratuit, sans carte bancaire. Votre espace personnel est créé à l&apos;inscription.
      </p>
      <SignUpForm />
    </>
  );
}
