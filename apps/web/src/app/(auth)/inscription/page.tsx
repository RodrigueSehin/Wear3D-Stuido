import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Créer un compte" };

export default function Page() {
  return <PagePlaceholder title={"Créer un compte"} phase="Phase 3" />;
}
