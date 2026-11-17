import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Facturation" };

export default function Page() {
  return <PagePlaceholder title={"Facturation"} phase="Phase 8" />;
}
