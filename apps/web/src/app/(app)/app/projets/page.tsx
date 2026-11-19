import type { Metadata } from "next";
import { ProjectsList } from "@/components/app/projects-list";

export const metadata: Metadata = { title: "Mes créations" };

export default function Page() {
  return <ProjectsList />;
}
