import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Vérifiez votre e-mail" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <div className="space-y-4 text-center">
      <MailCheck className="text-action mx-auto size-12" aria-hidden />
      <h1 className="font-display text-3xl font-extrabold">Vérifiez votre e-mail</h1>
      <p className="text-muted-foreground text-sm">
        Un lien de confirmation a été envoyé{email ? ` à ${email}` : ""}. Cliquez dessus pour
        activer votre compte, puis revenez ici.
      </p>
      <Link href="/connexion" className="text-action text-sm font-medium hover:underline">
        Retour à la connexion
      </Link>
    </div>
  );
}
