import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Fiche modèle" };

export default function Page() {
  return <PagePlaceholder title={"Fiche modèle"} phase="Phase 4" />;
}
