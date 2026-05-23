import dotenv from "dotenv";
import { createClient } from "@sanity/client";

// ───────────────── LOAD ENV ─────────────────
dotenv.config();

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID!,
  dataset: process.env.VITE_SANITY_DATASET!,
  apiVersion: "2025-01-01",
  useCdn: true,
});

type PostSlug = {
  slug: string;
};

export async function getBlogRoutes(): Promise<string[]> {
  const posts = await client.fetch<PostSlug[]>(`
    *[_type == "post" && defined(slug.current)]{
      "slug": slug.current
    }
  `);

  return posts.map((post) => `/blog/${post.slug}`);
}