import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Bienvenue" };

export default function Page() {
  return <PagePlaceholder title={"Bienvenue"} phase="Phase 4" />;
}
