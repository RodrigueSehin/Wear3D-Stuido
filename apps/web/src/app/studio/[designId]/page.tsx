import type { Metadata } from "next";
import { Studio } from "@/components/studio/studio";

export const metadata: Metadata = { title: "Studio 3D" };

/** Studio plein écran. `nouveau` crée un brouillon local ; `?modele=` choisit le vêtement. */
export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ modele?: string }>;
}) {
  const { designId } = await params;
  const { modele } = await searchParams;
  return <Studio designId={designId} modelReference={modele} />;
}
