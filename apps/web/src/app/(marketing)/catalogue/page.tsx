import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Catalogue de vêtements" };

export default function Page() {
  return <PagePlaceholder title={"Catalogue de vêtements"} phase="Phase 4" />;
}
