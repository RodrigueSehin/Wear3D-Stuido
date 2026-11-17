import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Produit" };

export default function Page() {
  return <PagePlaceholder title={"Produit"} phase="Phase 4" />;
}
