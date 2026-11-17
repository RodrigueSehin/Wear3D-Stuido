import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Équipes" };

export default function Page() {
  return <PagePlaceholder title={"Équipes"} phase="Phase 6" />;
}
