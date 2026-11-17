import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function Page() {
  return <PagePlaceholder title={"Tableau de bord"} phase="Phase 4" />;
}
