import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/lib/auth/schemas";

export const metadata: Metadata = { title: "Se connecter" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const { suite, erreur } = await searchParams;
  return (
    <AuthShell
      variant="login"
      title="Se connecter"
      subtitle="Ravi de vous revoir ! Connectez-vous à votre compte."
    >
      <LoginForm next={safeNext(suite)} linkError={erreur === "lien"} />
    </AuthShell>
  );
}
