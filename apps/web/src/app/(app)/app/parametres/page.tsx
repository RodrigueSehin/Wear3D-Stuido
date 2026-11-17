import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return <PagePlaceholder title={"Paramètres"} phase="Phase 4" />;
}
