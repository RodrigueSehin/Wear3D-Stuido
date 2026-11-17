import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "File de validation" };

export default function Page() {
  return <PagePlaceholder title={"File de validation"} phase="Phase 6" />;
}
