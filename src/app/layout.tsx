import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ExitIntentPopup from "@/components/ExitIntentPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "กอล์ฟรีวิว - แนะนำสินค้าคุณภาพ",
  description: "ค้นพบสินค้าที่ดีที่สุดจากการคัดสรรอย่างพิถีพิถันจากทีมงานของเรา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="scroll-smooth">
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pt-16`}
      >
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-white dark:bg-slate-900">
            {children}
          </main>
          <footer className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 dark:text-slate-400 text-sm">
              <p>© 2025 กอล์ฟรีวิว สงวนลิขสิทธิ์</p>
            </div>
          </footer>
          <ExitIntentPopup />
        </Providers>
      </body>
    </html>
  );
}
