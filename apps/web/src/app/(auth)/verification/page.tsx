import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Vérifiez votre e-mail" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <AuthShell
      variant="signup"
      title="Vérifiez votre e-mail"
      subtitle={`Un lien de confirmation a été envoyé${email ? ` à ${email}` : ""}. Cliquez dessus pour activer votre compte, puis revenez ici.`}
    >
      <div className="space-y-4 text-center">
        <MailCheck className="text-action mx-auto size-14" aria-hidden />
        <Link href="/connexion" className="text-action font-semibold hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </AuthShell>
  );
}
