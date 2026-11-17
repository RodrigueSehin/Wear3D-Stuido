import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Détail du projet" };

export default function Page() {
  return <PagePlaceholder title={"Détail du projet"} phase="Phase 4" />;
}
