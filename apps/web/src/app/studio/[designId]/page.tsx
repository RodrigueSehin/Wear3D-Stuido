import type { Metadata } from "next";
import { Studio } from "@/components/studio/studio";

export const metadata: Metadata = { title: "Studio 3D" };

/** Studio plein écran. `nouveau` crée un brouillon local ; `?modele=` choisit le vêtement, `?maquette=` part d'une maquette. */
export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ modele?: string; maquette?: string }>;
}) {
  const { designId } = await params;
  const { modele, maquette } = await searchParams;
  return <Studio designId={designId} modelReference={modele} mockupId={maquette} />;
}
