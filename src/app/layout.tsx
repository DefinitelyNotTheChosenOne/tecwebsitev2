import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TutorMatch | Global Marketplace for Elite Tutors",
  description: "Connect with the world's most elite tutors and scale your knowledge with premium education.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#0f172a]`}
    >
      <body className="min-h-screen text-white bg-[#0f172a]">
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
