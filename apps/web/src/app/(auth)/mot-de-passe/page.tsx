import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function Page() {
  return <PagePlaceholder title={"Mot de passe oublié"} phase="Phase 3" />;
}
