import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://voluntaris.lamamave.com"),
  title: "Quadrant FM 2026 · La Mama Ve",
  description: "Apunta't als torns de la festa major 💪",
  openGraph: {
    title: "Quadrant FM 2026 · La Mama Ve",
    description: "Apunta't als torns de la festa major 💪",
    url: "https://voluntaris.lamamave.com",
    siteName: "La Mama Ve",
    locale: "ca_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quadrant FM 2026 · La Mama Ve",
    description: "Apunta't als torns de la festa major 💪",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ca"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
