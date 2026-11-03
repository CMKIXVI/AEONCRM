import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEONCRM — Your CRM. Run by Agents.",
  description: "AEONCRM — the AI-native operating interface for enterprise CRM.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
