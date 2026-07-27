import path from "path";
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "5000" },
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};
export default nextConfig;
