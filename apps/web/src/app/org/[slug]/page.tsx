import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Organisation" };

export default function Page() {
  return <PagePlaceholder title={"Organisation"} phase="Phase 6" />;
}
