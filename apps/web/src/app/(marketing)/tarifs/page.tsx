import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Tarifs" };

export default function Page() {
  return <PagePlaceholder title={"Tarifs"} phase="Phase 4" />;
}
