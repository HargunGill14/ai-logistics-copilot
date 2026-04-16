import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree, DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: {
    default: 'FreTraq | AI Pricing for Freight Brokers',
    template: '%s | FreTraq',
  },
  description:
    'FreTraq gives freight brokers instant AI-powered lane pricing, auto-generated negotiation emails, and real-time margin tracking — all in one platform.',
  metadataBase: new URL('https://fretraq.com'),
  openGraph: {
    type: 'website',
    url: 'https://fretraq.com',
    siteName: 'FreTraq',
    title: 'FreTraq | AI Pricing for Freight Brokers',
    description:
      'Instant AI lane pricing, negotiation emails, and margin tracking for freight brokers.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreTraq | AI Pricing for Freight Brokers',
    description:
      'Instant AI lane pricing, negotiation emails, and margin tracking for freight brokers.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        figtree.variable,
        dmSerif.variable,
        dmSans.variable,
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
