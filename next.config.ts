import type { NextConfig } from "next";

// STATIC_EXPORT=1 build ra thư mục `out/` để kiểm tra khả năng đóng gói Capacitor.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport && { output: "export" }),
  images: { unoptimized: true },
};

export default nextConfig;
