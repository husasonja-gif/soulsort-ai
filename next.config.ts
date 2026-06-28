import type { NextConfig } from "next";

const PORTAL_URL =
  process.env.PORTAL_URL ?? "https://soulsort-portal.vercel.app";
const EDGE_URL =
  process.env.EDGE_URL ?? "https://soulsort-edge.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    // fallback runs right before 404 — required for external child zones on Next.js 16 + Vercel.
    return {
      fallback: [
        // PORTAL zone (child app: NEXT_PUBLIC_BASE_PATH=/portal)
        { source: "/portal", destination: `${PORTAL_URL}/portal` },
        { source: "/portal/", destination: `${PORTAL_URL}/portal/` },
        {
          source: "/portal/:path*",
          destination: `${PORTAL_URL}/portal/:path*`,
        },
        // EDGE landing (child app: NEXT_PUBLIC_BASE_PATH=/edge)
        { source: "/edge", destination: `${EDGE_URL}/edge` },
        { source: "/edge/", destination: `${EDGE_URL}/edge/` },
        { source: "/edge/:path*", destination: `${EDGE_URL}/edge/:path*` },
        // EDGE game beta (child app: NEXT_PUBLIC_BASE_PATH=/edge/beta)
        { source: "/edge/beta", destination: `${EDGE_URL}/edge/beta` },
        { source: "/edge/beta/", destination: `${EDGE_URL}/edge/beta/` },
        {
          source: "/edge/beta/:path*",
          destination: `${EDGE_URL}/edge/beta/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
