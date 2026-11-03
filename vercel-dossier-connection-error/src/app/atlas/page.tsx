import type { Metadata } from "next";
import { AtlasExperience } from "@/components/atlas-experience";

export const metadata: Metadata = { title: "Lunar Atlas & Router" };

export default function AtlasPage() {
  return <AtlasExperience />;
}
