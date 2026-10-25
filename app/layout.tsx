import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import TopLoadingBar from "@/components/TopLoadingBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monitoring IRPOM - Kabupaten Way Kanan",
  description: "Data & peta sebaran Irigasi Perpompaan (IRPOM) Kabupaten Way Kanan — Dinas Tanaman Pangan, Hortikultura, dan Peternakan",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TopLoadingBar />
        {children}
      </body>
    </html>
  );
}
