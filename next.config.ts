import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Insight-post images: article bodies embed relative
      // /content-assets/... URLs (see engine docx conversion pipeline).
      // Proxy them to the FastAPI backend so the same URLs work in the
      // admin preview and the public hub. Retire at R2 cutover (URLs
      // will point at the public bucket instead).
      {
        source: "/content-assets/:path*",
        destination: `${API_URL}/content-assets/:path*`,
      },
    ];
  },
};

export default nextConfig;
