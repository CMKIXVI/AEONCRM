import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEONCRM — Agentic CRM Operating System",
  description: "The CRM operated by agents.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
