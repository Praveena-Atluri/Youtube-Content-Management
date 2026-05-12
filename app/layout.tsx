import type { Metadata } from "next";
import { Manrope, Noto_Sans_Telugu } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

const headingFont = Manrope({
  subsets: ["latin"],
  variable: "--font-heading"
});

const teluguFont = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-telugu"
});

export const metadata: Metadata = {
  title: "Media Radar",
  description: "Track stories across multiple sources and turn them into creator-ready outputs."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          headingFont.variable,
          teluguFont.variable,
          "min-h-screen font-[var(--font-heading)]"
        )}
      >
        {children}
      </body>
    </html>
  );
}
