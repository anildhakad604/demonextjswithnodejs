import path from "path";
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/uploads/**" },
    ],
    // The backend serves uploaded product/content images from localhost in
    // dev, which Next's image optimizer otherwise blocks as a private-IP SSRF
    // guard (added in Next 16). Safe here since the "remote" host is our own
    // API on the same machine, not arbitrary user-supplied URLs.
    dangerouslyAllowLocalIP: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
};
export default nextConfig;
