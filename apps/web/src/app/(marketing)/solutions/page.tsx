import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Solutions" };

export default function Page() {
  return <PagePlaceholder title={"Solutions"} phase="Phase 4" />;
}
