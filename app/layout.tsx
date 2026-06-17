import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/analytics";

export const metadata: Metadata = {
  title: "TrialSync AI",
  description: "AI-native clinical-trial patient matching — save and manage match runs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Analytics>{children}</Analytics>
      </body>
    </html>
  );
}
