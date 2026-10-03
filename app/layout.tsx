import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: { default: "ChainBallot", template: "%s | ChainBallot" },
  description: "Privacy-aware blockchain voting research prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader /><main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main></body></html>;
}
