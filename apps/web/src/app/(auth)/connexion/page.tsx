import type { Metadata } from "next";
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
    <>
      <h1 className="font-display mb-1 text-3xl font-extrabold">Se connecter</h1>
      <p className="text-muted-foreground mb-6 text-sm">Retrouvez vos projets et vos créations.</p>
      <LoginForm next={safeNext(suite)} linkError={erreur === "lien"} />
    </>
  );
}
