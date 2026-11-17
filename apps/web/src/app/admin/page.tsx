import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Administration" };

export default function Page() {
  return <PagePlaceholder title={"Administration"} phase="Phase 8" />;
}
