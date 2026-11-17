import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Ressources" };

export default function Page() {
  return <PagePlaceholder title={"Ressources"} phase="Phase 4" />;
}
