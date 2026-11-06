import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://markazak-saas.vercel.app";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/portal/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}