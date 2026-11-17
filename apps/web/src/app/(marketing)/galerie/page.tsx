import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Galerie" };

export default function Page() {
  return <PagePlaceholder title={"Galerie"} phase="Phase 4" />;
}
