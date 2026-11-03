import type { Metadata } from "next";
import { CoreExperience } from "@/components/core-experience";

export const metadata: Metadata = { title: "The Zero Core" };

export default function CorePage() {
  return <CoreExperience />;
}
