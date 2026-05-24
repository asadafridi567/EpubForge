import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { client, isSanityConfigured, urlFor } from "../sanity/client";
import { mockPosts } from "./Blog";
import CodeBlock from "../components/CodeBlock";

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

type TableCell = { text: string };
type TableRow = { cells?: TableCell[] };
type TableValue = { rows?: TableRow[] };

function formatDate(value?: string) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const portableTextComponents: PortableTextComponents = {
  types: {
    code: CodeBlock,

    table: ({ value }: { value: TableValue }) => {
      const rows = value?.rows ?? [];
      if (rows.length === 0) return null;
      const [headerRow, ...bodyRows] = rows;
      return (
        <div className="my-10 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-indigo-600 text-white">
                {headerRow?.cells?.map((cell, i) => (
                  <th
                    key={i}
                    className="border-r border-indigo-500 px-4 py-3 text-left font-bold last:border-r-0"
                  >
                    {cell.text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={
                    rowIndex % 2 === 0
                      ? "bg-white dark:bg-slate-800"
                      : "bg-slate-50 dark:bg-slate-900"
                  }
                >
                  {row.cells?.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border-r border-t border-slate-200 px-4 py-3 text-slate-700 last:border-r-0 dark:border-slate-700 dark:text-slate-300"
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },

    image: ({ value }: { value: Parameters<typeof urlFor>[0] }) => (
      <div className="my-10">
        <img
          src={urlFor(value).width(1200).fit("max").url()}
          alt=""
          className="w-full rounded-2xl object-cover shadow-sm"
        />
      </div>
    ),
  },

  block: {
    h1: ({ children }) => (
      <h1 className="mt-14 mb-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-12 mb-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-8 mb-3 text-xl font-bold text-slate-900 dark:text-white">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mb-6 text-lg leading-8 text-slate-700 dark:text-slate-300">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-4 border-indigo-500 pl-5 text-lg italic text-slate-600 dark:text-slate-300">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="my-6 ml-6 list-disc space-y-3 text-lg leading-8 text-slate-700 dark:text-slate-300">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-6 ml-6 list-decimal space-y-3 text-lg leading-8 text-slate-700 dark:text-slate-300">
        {children}
      </ol>
    ),
  },

  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },

  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-slate-900 dark:text-white">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }) => (
      <code className="rounded-md bg-slate-200 px-1.5 py-1 text-sm dark:bg-slate-800">
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-500 dark:text-indigo-400"
      >
        {children}
      </a>
    ),
  },
};

export default function BlogPost() {
  const { slug } = useParams();
  const fallback =
    mockPosts.find((post) => post.slug === slug || post._id === slug) ||
    mockPosts[0];
  const [post, setPost] = useState<SanityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (!slug || !isSanityConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    client
      .fetch<SanityPost | null>(
        // ✅ No date filter — fetch ANY post by slug for testing
        `*[_type == "post" && slug.current == $slug][0] {
          _id,
          title,
          excerpt,
          "category": categories[0]->title,
          publishedAt,
          slug,
          mainImage,
          body
        }`,
        { slug }
      )
      .then((data) => {
        if (data) {
          setPost(data);
        } else {
          setFetchFailed(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Sanity post fetch failed.", error);
        setFetchFailed(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const activePost = post || (fetchFailed ? fallback : null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f4] dark:bg-[#09090e]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!activePost) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f4] text-lg text-slate-600 dark:bg-[#09090e] dark:text-slate-300">
        Post not found.
      </div>
    );
  }

  const title = activePost.title;
  const excerpt = activePost.excerpt;
  const category = activePost.category;
  const date = activePost.publishedAt
    ? formatDate(activePost.publishedAt)
    : fallback.date;
  const image = activePost.mainImage
    ? urlFor(activePost.mainImage)
        .width(1400)
        .height(720)
        .fit("crop")
        .url()
    : fallback.image;

  return (
    <article className="min-h-screen bg-[#f8f7f4] text-slate-900 transition-colors duration-300 dark:bg-[#09090e] dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900/50 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            ← Back to Blog
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {category} · {date}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {excerpt}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <img
          src={image}
          alt={title}
          className="mb-12 aspect-[16/9] w-full rounded-2xl object-cover"
        />

        {activePost?.body?.length ? (
          <div className="max-w-none">
            <PortableText
              value={activePost.body}
              components={portableTextComponents}
            />
          </div>
        ) : (
          <div className="space-y-5 text-lg leading-8 text-slate-700 dark:text-slate-300">
            <p>{excerpt}</p>
            <p>
              This article is a placeholder until your Sanity Studio is
              connected. After you publish a post in Sanity with this slug,
              EPUBForge will automatically render its portable text content
              here.
            </p>
          </div>
        )}
      </main>
    </article>
  );
}