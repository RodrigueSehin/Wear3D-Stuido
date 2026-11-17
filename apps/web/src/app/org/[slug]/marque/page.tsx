import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Kit de marque" };

export default function Page() {
  return <PagePlaceholder title={"Kit de marque"} phase="Phase 6" />;
}
