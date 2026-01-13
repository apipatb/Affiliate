import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BoomBigNose รีวิว - แนะนำสินค้าคุณภาพ",
  description: "ค้นพบสินค้าที่ดีที่สุดจากการคัดสรรอย่างพิถีพิถันจากทีมงานของเรา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pt-16 bg-white text-black`}
      >
        <Navbar />
        <main className="min-h-screen bg-white">
          {children}
        </main>
        <footer className="bg-slate-50 border-t border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 text-sm">
            <p>© 2025 BoomBigNose รีวิว สงวนลิขสิทธิ์</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
