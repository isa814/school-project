import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/portal/admin", "/portal/teacher", "/portal/student", "/api/", "/portal/login"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
