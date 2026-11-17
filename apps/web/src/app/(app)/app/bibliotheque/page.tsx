import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Bibliothèque" };

export default function Page() {
  return <PagePlaceholder title={"Bibliothèque"} phase="Phase 4" />;
}
