import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Membres" };

export default function Page() {
  return <PagePlaceholder title={"Membres"} phase="Phase 6" />;
}
