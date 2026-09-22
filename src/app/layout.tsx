import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Resume Analyser",
    template: "%s | AI Resume Analyser",
  },
  description: "Private ATS-style resume analysis, improvement tracking, and job matching.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
