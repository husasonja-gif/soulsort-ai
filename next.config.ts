import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/edge/",
        destination: "https://soulsort-edge.vercel.app/edge/beta",
      },
      {
        source: "/edge/",
        destination: "https://soulsort-edge.vercel.app/edge/beta/",
      },
      {
        source: "/edge/:path*",
        destination: "https://soulsort-edge.vercel.app/edge/beta/:path*",
      },
    ];
  },
};

export default nextConfig;
