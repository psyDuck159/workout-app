import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppHeader from "@/components/AppHeader";
import StorageWarning from "@/components/StorageWarning";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: { default: "Workout App", template: "%s · Workout App" },
  description: "Lộ trình tập bodyweight tại nhà theo giai đoạn, tiếng Việt, không quảng cáo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AppHeader />
        <StorageWarning />
        {children}
      </body>
    </html>
  );
}
