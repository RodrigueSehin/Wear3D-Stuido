import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Mes créations" };

export default function Page() {
  return <PagePlaceholder title={"Mes créations"} phase="Phase 4" />;
}
