import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const serif = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://edelweiss-salon-spa.local";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Edelweiss Salon Spa — Cantik, Rileks, Glowing",
    template: "%s | Edelweiss Salon Spa",
  },
  description: "Edelweiss Salon Spa: hair studio, body massage, facial, nail art. Terapis bersertifikat, booking online mudah.",
  keywords: ["salon", "spa", "facial", "massage", "creambath", "manicure pedicure", "salon spa"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Edelweiss Salon Spa",
    title: "Edelweiss Salon Spa — Cantik, Rileks, Glowing",
    description: "Hair studio, body spa, facial & nails. Booking online, konfirmasi via WhatsApp.",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Edelweiss Salon & Make Up Art",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

import { AlertProvider } from "@/components/AlertProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#fdfbf7]">
        <AlertProvider>{children}</AlertProvider>
      </body>
    </html>
  );
}
