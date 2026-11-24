import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import StorageWarning from "@/components/StorageWarning";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Workout App", template: "%s · Workout App" },
  description: "Lộ trình tập bodyweight tại nhà theo giai đoạn, tiếng Việt, không quảng cáo.",
  applicationName: "Workout App",
  appleWebApp: { capable: true, title: "Workout", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      {/* Chừa chỗ cho thanh tab dưới màn hình. */}
      <body className="pb-20 font-sans">
        <StorageWarning />
        {children}
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
