import type { NextConfig } from "next";

const PORTAL_URL =
  process.env.PORTAL_URL ?? "https://soulsort-portal.vercel.app";
const EDGE_URL =
  process.env.EDGE_URL ?? "https://soulsort-edge.vercel.app";

const nextConfig: NextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  async redirects() {
    const home = "/";
    const datingRoutes = [
      "/login",
      "/onboarding",
      "/dashboard",
      "/waitlist",
      "/bmnl",
      "/bmnl/login",
      "/bmnl/start",
      "/bmnl/assessment",
      "/bmnl/dashboard",
      "/bmnl/organizer",
    ];
    return [
      ...datingRoutes.map((source) => ({
        source,
        destination: home,
        permanent: true,
      })),
      {
        source: "/r/:path*",
        destination: home,
        permanent: true,
      },
      {
        source: "/bmnl/organizer/:path*",
        destination: home,
        permanent: true,
      },
      {
        source: "/blog/ai-dating-apps-women-queers-product",
        destination: "/blog",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/portal", destination: `${PORTAL_URL}/portal` },
        { source: "/portal/", destination: `${PORTAL_URL}/portal/` },
        {
          source: "/portal/:path*",
          destination: `${PORTAL_URL}/portal/:path*`,
        },
        { source: "/edge", destination: `${EDGE_URL}/edge` },
        { source: "/edge/", destination: `${EDGE_URL}/edge/` },
        {
          source: "/edge/:path*",
          destination: `${EDGE_URL}/edge/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
