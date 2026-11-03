import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CaseProvider } from "@/components/case-provider";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";
import "./puzzles.css";

export const metadata: Metadata = {
  title: { default: "Zero Meridian — Independent Witness Protocol", template: "%s · Zero Meridian" },
  description: "A seven-act investigative puzzle across an archive, a relay, a lunar atlas and the Zero Meridian core.",
  applicationName: "Zero Meridian",
};

export const viewport: Viewport = { themeColor: "#0b0f0e", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><CaseProvider><SiteChrome>{children}</SiteChrome></CaseProvider></body></html>;
}
