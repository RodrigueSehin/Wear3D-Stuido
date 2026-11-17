import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Se connecter" };

export default function Page() {
  return <PagePlaceholder title={"Se connecter"} phase="Phase 3" />;
}
