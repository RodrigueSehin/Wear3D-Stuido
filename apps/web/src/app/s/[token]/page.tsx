import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Design partagé" };

export default function Page() {
  return <PagePlaceholder title={"Design partagé"} phase="Phase 5" />;
}
