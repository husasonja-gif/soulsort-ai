import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soulsortai.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog", "/privacy"],
      disallow: [
        "/login",
        "/dashboard",
        "/onboarding",
        "/r/",
        "/bmnl/",
        "/analytics",
        "/debug",
        "/admin/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
