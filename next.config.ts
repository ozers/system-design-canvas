import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully client-side app: build to static files in ./out (served by Cloudflare and Vercel).
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
