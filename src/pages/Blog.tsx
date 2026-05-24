import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { client, isSanityConfigured, urlFor } from "../sanity/client";

export type BlogPost = {
  _id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  slug?: string;
};

type SanityPost = {
  _id: string;
  title?: string;
  excerpt?: string;
  categories?: { title?: string }[];
  publishedAt?: string;
  slug?: { current?: string };
  mainImage?: Parameters<typeof urlFor>[0];
};

export const mockPosts: BlogPost[] = [
  {
    _id: "1",
    slug: "how-to-convert-epub-to-pdf-for-free",
    title: "How to Convert EPUB to PDF for Free Without Losing Quality",
    excerpt:
      "Learn the best browser-based methods to convert your EPUB files to PDF format without losing formatting or images.",
    category: "Tutorial",
    date: "May 15, 2024",
    image: "https://placehold.co/900x540/6b5bf2/ffffff?text=EPUB+to+PDF",
  },
  {
    _id: "2",
    slug: "top-5-ebook-formats-explained",
    title: "Top 5 Ebook Formats Explained",
    excerpt:
      "Understand the differences between EPUB, PDF, MOBI, AZW3, and FB2 formats and when to use each.",
    category: "Guide",
    date: "May 10, 2024",
    image: "https://placehold.co/600x400/1a73e8/ffffff?text=Ebook+Formats",
  },
  {
    _id: "3",
    slug: "how-to-extract-images-from-an-epub",
    title: "How to Extract Images from an EPUB",
    excerpt:
      "A step-by-step guide on extracting high-quality images from your EPUB files using EPUBForge.",
    category: "Tips",
    date: "May 5, 2024",
    image: "https://placehold.co/600x400/c58af9/ffffff?text=Extract+Images",
  },
  {
    _id: "4",
    slug: "converting-pdf-to-epub-best-practices",
    title: "Converting PDF to EPUB: Best Practices",
    excerpt:
      "Tips for converting PDF documents to reflowable EPUB files for better reading experiences.",
    category: "Tutorial",
    date: "April 28, 2024",
    image: "https://placehold.co/600x400/1a73e8/ffffff?text=PDF+to+EPUB",
  },
  {
    _id: "5",
    slug: "why-local-first-conversion-matters",
    title: "Why Local-First Conversion Matters",
    excerpt:
      "Discover the privacy and speed benefits of converting files directly in your browser.",
    category: "News",
    date: "April 20, 2024",
    image: "https://placehold.co/600x400/6b5bf2/ffffff?text=Local-First",
  },
  {
    _id: "6",
    slug: "how-to-create-an-epub-from-markdown",
    title: "How to Create an EPUB from Markdown",
    excerpt:
      "Turn your Markdown manuscripts into professional EPUB ebooks in seconds.",
    category: "Guide",
    date: "April 15, 2024",
    image: "https://placehold.co/600x400/c58af9/ffffff?text=Markdown+to+EPUB",
  },
];

function formatDate(value?: string) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

type CategoryBadgeProps = { label: string };

function CategoryBadge({ label }: CategoryBadgeProps) {
  return (
    <span className="inline-block rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
      {label}
    </span>
  );
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    if (!isSanityConfigured) {
      setPosts(mockPosts);
      setCategories([
        "All",
        ...Array.from(new Set(mockPosts.map((p) => p.category))).filter(Boolean),
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);

    client
      .fetch<SanityPost[]>(
        // ← only fetch posts where publishedAt is today or earlier
        `*[_type == "post" && publishedAt <= now()] | order(publishedAt desc) {
          _id,
          title,
          excerpt,
          publishedAt,
          slug,
          mainImage,
          "categories": categories[]->{title}
        }`
      )
      .then((data) => {
        if (!data?.length) {
          setFetchFailed(true);
          return;
        }

        const mapped = data.map((post) => ({
          _id: post._id,
          title: post.title || "Untitled post",
          excerpt: post.excerpt || "",
          category: post.categories?.[0]?.title || "Blog",
          date: formatDate(post.publishedAt),
          image: post.mainImage
            ? urlFor(post.mainImage)
                .width(900)
                .height(520)
                .fit("crop")
                .url()
            : "https://placehold.co/600x400/6b5bf2/ffffff?text=EPUBForge",
          slug: post.slug?.current,
        }));

        setPosts(mapped);
        setCategories([
          "All",
          ...Array.from(new Set(mapped.map((p) => p.category))).filter(Boolean),
        ]);
      })
      .catch((err: unknown) => {
        console.warn("Sanity blog fetch failed.", err);
        setFetchFailed(true);
        setPosts(mockPosts);
        setCategories([
          "All",
          ...Array.from(new Set(mockPosts.map((p) => p.category))).filter(Boolean),
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#09090e]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const finalPosts = posts.length ? posts : fetchFailed ? mockPosts : [];
  const filtered =
    activeCategory === "All"
      ? finalPosts
      : finalPosts.filter((p) => p.category === activeCategory);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-[#09090e] dark:text-slate-100">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-b from-indigo-50 to-white py-14 text-center dark:from-slate-900 dark:to-[#09090e]">
        <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
          EPUBForge Blog
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500 dark:text-slate-400">
          Tips, tutorials, and news about ebook conversion, formats, and
          digital reading.
        </p>

        {/* ── Dynamic Category Tabs ── */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filtered.length === 0 && (
          <p className="py-20 text-center text-slate-400">
            No posts in this category yet.
          </p>
        )}

        {/* ── Featured + Sidebar ── */}
        {featured && (
          <div className="mb-10 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <Link
              to={`/blog/${featured.slug || featured._id}`}
              className="group relative flex h-[420px] overflow-hidden rounded-2xl lg:h-[440px]"
            >
              <img
                src={featured.image}
                alt={featured.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative mt-auto p-6 text-white">
                <CategoryBadge label={featured.category} />
                <h2 className="mt-3 text-2xl font-black leading-tight drop-shadow sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                  <span>📅 {featured.date}</span>
                  <span>·</span>
                  <span>💬 No Comments</span>
                </p>
              </div>
            </Link>

            {/* ── Right Sidebar Posts ── */}
            <div className="flex flex-col gap-6">
              {rest.slice(0, 2).map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug || post._id}`}
                  className="group flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative h-auto w-44 shrink-0 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-2 p-4">
                    <CategoryBadge label={post.category} />
                    <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-white">
                      {post.title}
                    </h3>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>📅 {post.date}</span>
                      <span>·</span>
                      <span>💬 No Comments</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Remaining Posts Grid ── */}
        {rest.length > 2 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(2).map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug || post._id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <CategoryBadge label={post.category} />
                  <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">
                    {post.excerpt}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>📅 {post.date}</span>
                    <span>·</span>
                    <span>💬 No Comments</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}