import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { client, isSanityConfigured, urlFor } from "../sanity/client";
import { mockPosts } from "./Blog";

type SanityPost = {
  _id: string;
  title?: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
  slug?: { current?: string };
  mainImage?: Parameters<typeof urlFor>[0];
  body?: PortableTextBlock[];
};

function formatDate(value?: string) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function BlogPost() {
  const { slug } = useParams();
  const fallback = mockPosts.find((post) => post.slug === slug || post._id === slug) || mockPosts[0];
  const [post, setPost] = useState<SanityPost | null>(null);

  useEffect(() => {
    if (!slug || !isSanityConfigured) return;

    client
      .fetch<SanityPost | null>(
        `*[_type == "post" && slug.current == $slug][0] {
          _id,
          title,
          excerpt,
          category,
          publishedAt,
          slug,
          mainImage,
          body
        }`,
        { slug },
      )
      .then((data) => setPost(data))
      .catch((error: unknown) => {
        console.warn("Sanity post fetch failed. Showing fallback post.", error);
      });
  }, [slug]);

  const title = post?.title || fallback.title;
  const excerpt = post?.excerpt || fallback.excerpt;
  const category = post?.category || fallback.category;
  const date = post?.publishedAt ? formatDate(post.publishedAt) : fallback.date;
  const image = post?.mainImage ? urlFor(post.mainImage).width(1400).height(720).fit("crop").url() : fallback.image;

  return (
    <article className="min-h-screen bg-[#f8f7f4] text-slate-900 transition-colors duration-300 dark:bg-[#09090e] dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900/50 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            ← Back to Blog
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {category} · {date}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{excerpt}</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <img src={image} alt={title} className="mb-10 aspect-[16/9] w-full rounded-2xl object-cover" />

        {post?.body?.length ? (
          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-black prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
            <PortableText value={post.body} />
          </div>
        ) : (
          <div className="space-y-5 text-lg leading-8 text-slate-700 dark:text-slate-300">
            <p>{excerpt}</p>
            <p>
              This article is a placeholder until your Sanity Studio is connected. After you publish a post in Sanity with
              this slug, EPUBForge will automatically render its portable text content here.
            </p>
          </div>
        )}
      </main>
    </article>
  );
}