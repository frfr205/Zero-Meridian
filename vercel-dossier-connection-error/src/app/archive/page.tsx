import type { Metadata } from "next";
import { ArchiveExperience } from "@/components/archive-experience";

export const metadata: Metadata = { title: "Archive 17" };

export default function ArchivePage() {
  return <ArchiveExperience />;
}
