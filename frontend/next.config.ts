import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve public/ images as-is: the /_next/image optimizer route isn't exposed under Vercel Services.
  images: { unoptimized: true },
};

export default nextConfig;
