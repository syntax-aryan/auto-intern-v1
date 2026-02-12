import { TempoInit } from "@/components/tempo-init";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auto Intern | AI Cold Email for Internships & Jobs",
  description:
    "Auto Intern helps you land internships and jobs with AI-personalized cold emails to recruiters. Automate outreach, track responses, and get more interviews at top companies.",
  openGraph: {
    title: "Auto Intern | AI Cold Email for Internships & Jobs",
    description:
      "Auto Intern helps you land internships and jobs with AI-personalized cold emails to recruiters. Automate outreach, track responses, and get more interviews at top companies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script src="https://api.tempo.new/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
        <TempoInit />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
