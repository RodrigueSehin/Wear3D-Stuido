import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Statistiques" };

export default function Page() {
  return <PagePlaceholder title={"Statistiques"} phase="Phase 6" />;
}
