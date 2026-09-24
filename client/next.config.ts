import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const apiServer = process.env.API_SERVER_URL || "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${apiServer}/api/:path*` }];
  },
};

export default nextConfig;
