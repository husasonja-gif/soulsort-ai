import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/edge/beta",
        destination: "https://soulsort-edge.vercel.app/edge/beta",
      },
      {
        source: "/edge/beta/",
        destination: "https://soulsort-edge.vercel.app/edge/beta/",
      },
      {
        source: "/edge/beta/:path*",
        destination: "https://soulsort-edge.vercel.app/edge/beta/:path*",
      },
    ];
  },
};

export default nextConfig;
