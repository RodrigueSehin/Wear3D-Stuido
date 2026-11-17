import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Vérification de l'adresse e-mail" };

export default function Page() {
  return <PagePlaceholder title={"Vérification de l'adresse e-mail"} phase="Phase 3" />;
}
