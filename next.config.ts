import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/edge",
        destination: "https://soulsort-edge.vercel.app/edge",
      },
      {
        source: "/edge/",
        destination: "https://soulsort-edge.vercel.app/edge/",
      },
      {
        source: "/edge/:path*",
        destination: "https://soulsort-edge.vercel.app/edge/:path*",
      },
    ];
  },
};

export default nextConfig;
