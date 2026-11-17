import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Générateur IA" };

export default function Page() {
  return <PagePlaceholder title={"Générateur IA"} phase="Phase 7" />;
}
