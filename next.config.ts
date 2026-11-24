import type { NextConfig } from "next";

// STATIC_EXPORT=1 build ra thư mục `out/` để kiểm tra khả năng đóng gói Capacitor.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport && { output: "export" }),
  images: { unoptimized: true },
  // Header bảo mật (NFR-SEC-04). Static export không hỗ trợ `headers`, nên chỉ áp dụng khi deploy server.
  ...(!isStaticExport && {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Frame-Options", value: "DENY" },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(), payment=()",
            },
          ],
        },
        {
          // Service worker luôn được kiểm tra bản mới.
          source: "/sw.js",
          headers: [{ key: "Cache-Control", value: "no-cache" }],
        },
      ];
    },
  }),
};

export default nextConfig;
