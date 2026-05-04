import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HSKProvider } from "@/components/HSKContext";
import ClientLayout from "@/components/layout/ClientLayout";
import Navbar from "@/components/layout/Navbar";
import FloatingAIChat from "@/components/ui/FloatingAIChat";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-vietnamese",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-chinese",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hán Tự Đại Sư - Hanzi Master",
  description: "Cảnh giới học chữ Hán cùng AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${notoSerifSC.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#09060f] text-slate-100"
      >
        <ThemeProvider>
          <HSKProvider>
            {/* Navbar placeholder */}
            <Navbar />
            <ClientLayout>{children}</ClientLayout>
            {/* FloatingAIChat placeholder */}
            <FloatingAIChat />
          </HSKProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

