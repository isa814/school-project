import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const staticPages = ["", "/about", "/academics", "/teachers", "/admissions", "/admissions/apply", "/news", "/gallery", "/contact", "/policies", "/forum", "/privacy", "/terms"];
  const posts = await db.newsPost.findMany({ where: { publishedAt: { not: null } }, select: { slug: true, publishedAt: true } });
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...posts.map((p) => ({ url: `${base}/news/${p.slug}`, lastModified: p.publishedAt ?? new Date(), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
