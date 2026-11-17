import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Projets partagés" };

export default function Page() {
  return <PagePlaceholder title={"Projets partagés"} phase="Phase 5" />;
}
