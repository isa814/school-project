import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db-fallback";
import { Section } from "@/components/public/Section";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await withDbFallback(db.newsPost.findUnique({ where: { slug: params.slug } }), null, "News post");
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, type: "article" } };
}

export default async function NewsDetail({ params }: { params: { slug: string } }) {
  const post = await withDbFallback(db.newsPost.findUnique({ where: { slug: params.slug } }), null, "News post");
  if (!post || !post.publishedAt) notFound();
  return (
    <Section className="max-w-3xl">
      <Link href="/news" className="focus-ring rounded text-sm font-semibold text-navy hover:underline">← All news</Link>
      <p className="mt-6 text-sm text-slate-500">{formatDate(post.publishedAt)}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-navy-deep">{post.title}</h1>
      <p className="mt-4 text-lg text-slate-600">{post.excerpt}</p>
      <div className="prose prose-slate mt-8 max-w-none whitespace-pre-line leading-relaxed text-slate-700">{post.body}</div>
    </Section>
  );
}
