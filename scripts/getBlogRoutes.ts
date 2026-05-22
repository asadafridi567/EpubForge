import dotenv from "dotenv";
import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";

// ───────────────── LOAD ENV ─────────────────
dotenv.config();

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID!,
  dataset: process.env.VITE_SANITY_DATASET!,
  apiVersion: "2025-01-01",
  useCdn: true,
});

type PostData = {
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt?: string;
};

// ───────────────── RSS GENERATOR ─────────────────
function generateRSSFeed(posts: PostData[]) {
  let rssXML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>EPUBForge Blog</title>
  <link>https://www.epubforge.com</link>
  <description>The latest ebook conversion tips, tools, and guides from EPUBForge.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="https://www.epubforge.com/feed.xml" rel="self" type="application/rss+xml" />
`;

  posts.forEach((post) => {
    const postUrl = `https://www.epubforge.com/blog/${post.slug}`;
    const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString();
    
    rssXML += `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${postUrl}</link>
    <guid>${postUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${post.excerpt || ''}]]></description>
  </item>
`;
  });

  rssXML += `</channel>
</rss>`;

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  fs.writeFileSync(path.join(publicDir, "feed.xml"), rssXML);
  console.log(" Franz: ✅ RSS Feed successfully generated in /public/feed.xml");
}

// ───────────────── SITEMAP GENERATOR ─────────────────
function generateSitemap(posts: PostData[]) {
  // Add your static core pages here
  const staticPages = [
    "",
    "/privacy",
    "/terms",
    "/cookies"
  ];

  let sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // 1. Add static pages to XML
  staticPages.forEach((page) => {
    sitemapXML += `  <url>
    <loc>https://www.epubforge.com${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>
`;
  });

  // 2. Add all dynamic Sanity blog pages to XML
  posts.forEach((post) => {
    const lastMod = post.publishedAt ? post.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0];
    sitemapXML += `  <url>
    <loc>https://www.epubforge.com/blog/${post.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  });

  sitemapXML += `</urlset>`;

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapXML);
  console.log(" Franz: ✅ Sitemap successfully generated in /public/sitemap.xml");
}

// ───────────────── MAIN EXPORT ─────────────────
export async function getBlogRoutes(): Promise<string[]> {
  const posts = await client.fetch<PostData[]>(`
    *[_type == "post" && defined(slug.current)] | order(publishedAt desc){
      "slug": slug.current,
      title,
      excerpt,
      publishedAt
    }
  `);

  // Build both files directly inside your safe /public directory
  try {
    generateRSSFeed(posts);
    generateSitemap(posts);
  } catch (error) {
    console.error("❌ Failed to generate build assets:", error);
  }

  return posts.map((post) => `/blog/${post.slug}`);
}