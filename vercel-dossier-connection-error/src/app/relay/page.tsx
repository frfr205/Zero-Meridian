import type { Metadata } from "next";
import { RelayExperience } from "@/components/relay-experience";

export const metadata: Metadata = { title: "Relay 88.4" };

export default function RelayPage() {
  return <RelayExperience />;
}
