import { Button } from "@wear3d/ui";
import { ArrowRight, Briefcase, Gem, Shirt, Trophy, Users2, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bienvenue" };

const BY_PROFILE: Record<string, { icon: LucideIcon; text: string; href: string; cta: string }> = {
  individual: {
    icon: Shirt,
    text: "Partez d'un modèle du catalogue et personnalisez-le à votre image.",
    href: "/catalogue",
    cta: "Explorer le catalogue",
  },
  club: {
    icon: Trophy,
    text: "Créez les maillots de votre club : couleurs, noms, numéros et patron de couture.",
    href: "/catalogue?famille=football",
    cta: "Créer un maillot",
  },
  company: {
    icon: Briefcase,
    text: "Concevez des uniformes aux couleurs de votre entreprise.",
    href: "/galerie?categorie=business",
    cta: "Voir les maquettes entreprise",
  },
  brand: {
    icon: Gem,
    text: "Testez vos idées de collection en 3D avant la production.",
    href: "/studio/nouveau",
    cta: "Ouvrir le studio",
  },
};

export default async function Page() {
  if (!isSupabaseConfigured) redirect("/connexion?suite=/bienvenue");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/connexion?suite=/bienvenue");

  const meta = data.user.user_metadata as { first_name?: string; usage_profile?: string };
  const profile = BY_PROFILE[meta.usage_profile ?? ""] ?? BY_PROFILE.individual!;
  const Icon = profile.icon;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 text-center">
      <h1 className="text-4xl font-extrabold">
        Bienvenue{meta.first_name ? `, ${meta.first_name}` : ""} <span aria-hidden>👋</span>
      </h1>
      <p className="text-muted-foreground">
        Votre espace personnel est prêt. Voici comment démarrer en quelques minutes.
      </p>
      <div className="border-border bg-surface shadow-card flex flex-col items-center gap-4 rounded-2xl border p-8">
        <span className="bg-action-soft text-action grid size-14 place-items-center rounded-2xl">
          <Icon className="size-7" aria-hidden />
        </span>
        <p>{profile.text}</p>
        <Button asChild size="lg">
          <Link href={profile.href}>
            {profile.cta} <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="flex justify-center gap-4 text-sm">
        <Link href="/app" className="text-action font-medium hover:underline">
          Aller au tableau de bord
        </Link>
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <Users2 className="size-4" aria-hidden /> Besoin d&apos;aide ? Voir les ressources
        </span>
      </div>
    </div>
  );
}
