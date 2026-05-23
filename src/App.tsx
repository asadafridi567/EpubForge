import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import FAQPage from "./pages/FAQ";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import NavBar from "./components/NavBar";
import { AppContext } from "./context/AppContext";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

type ToolId =
  // From EPUB
  | "epub-txt"
  | "epub-html"
  | "epub-md"
  | "epub-json"
  | "epub-cover"
  | "epub-chapters"
  | "epub-clean"
  | "epub-pdf"
  | "epub-docx"
  | "epub-rtf"
  | "epub-fb2"
  | "epub-mobi"
  | "epub-azw3"
  // To EPUB
  | "txt-epub"
  | "html-epub"
  | "md-epub"
  | "pdf-epub"
  | "docx-epub"
  | "rtf-epub"
  | "fb2-epub"
  | "mobi-epub"
  | "azw3-epub"
  | "azw-epub"
  | "azw4-epub"
  | "prc-epub"
  | "pdb-epub"
  | "lit-epub"
  | "lrf-epub"
  | "chm-epub"
  | "djvu-epub"
  | "cbz-epub"
  | "cbr-epub"
  | "jpg-epub"
  | "png-epub"
  | "ppt-epub";

type ManifestItem = {
  href: string;
  mediaType: string;
  properties: string;
};

type EpubChapter = {
  id: string;
  href: string;
  title: string;
  html: string;
  text: string;
};

type EpubData = {
  title: string;
  metadata: Record<string, string>;
  chapters: EpubChapter[];
  cover?: {
    name: string;
    mime: string;
    data: ArrayBuffer;
  };
  images: Map<string, { blob: Blob; url: string }>;
};

type Tool = {
  id: ToolId;
  name: string;
  input: string;
  output: string;
  description: string;
  accepts: string[];
};

const tools: Tool[] = [
  {
    id: "epub-txt",
    name: "EPUB to TXT",
    input: ".epub",
    output: ".txt",
    description: "Extracts every spine chapter in reading order into clean plain text.",
    accepts: ["epub"],
  },
  {
    id: "epub-html",
    name: "EPUB to HTML",
    input: ".epub",
    output: ".html",
    description: "Combines XHTML chapters into one readable standalone HTML document.",
    accepts: ["epub"],
  },
  {
    id: "epub-md",
    name: "EPUB to Markdown",
    input: ".epub",
    output: ".md",
    description: "Creates a Markdown draft with headings, paragraphs, lists, and links.",
    accepts: ["epub"],
  },
  {
    id: "epub-json",
    name: "Metadata Report",
    input: ".epub",
    output: ".json",
    description: "Reads title, author, language, identifiers, chapter count, and word count.",
    accepts: ["epub"],
  },
  {
    id: "epub-cover",
    name: "Cover Extractor",
    input: ".epub",
    output: "image",
    description: "Finds the declared cover image and downloads it without recompression.",
    accepts: ["epub"],
  },
  {
    id: "epub-chapters",
    name: "Chapter ZIP",
    input: ".epub",
    output: ".zip",
    description: "Exports each chapter as its own numbered TXT file in a ZIP archive.",
    accepts: ["epub"],
  },
  {
    id: "epub-clean",
    name: "Clean EPUB Rebuild",
    input: ".epub",
    output: ".epub",
    description: "Repackages readable text into a fresh standards-friendly EPUB shell.",
    accepts: ["epub"],
  },
  {
    id: "epub-pdf",
    name: "EPUB to PDF",
    input: ".epub",
    output: ".pdf",
    description: "Generates a paginated PDF with chapter headings and reflowed text from every spine chapter.",
    accepts: ["epub"],
  },
  {
    id: "txt-epub",
    name: "TXT to EPUB",
    input: ".txt",
    output: ".epub",
    description: "Turns plain text into a valid EPUB with paragraph structure.",
    accepts: ["txt", "text"],
  },
  {
    id: "html-epub",
    name: "HTML to EPUB",
    input: ".html",
    output: ".epub",
    description: "Wraps an HTML manuscript in EPUB navigation, metadata, and styling.",
    accepts: ["html", "htm", "xhtml"],
  },
  {
    id: "md-epub",
    name: "Markdown to EPUB",
    input: ".md",
    output: ".epub",
    description: "Converts Markdown headings, lists, links, and emphasis into an EPUB.",
    accepts: ["md", "markdown"],
  },
  {
    id: "pdf-epub",
    name: "PDF to EPUB",
    input: ".pdf",
    output: ".epub",
    description: "Extracts text sequences from uncompressed PDF streams to reconstruct reflowable paragraphs into standard EPUB.",
    accepts: ["pdf"],
  },
  // ── Additional EPUB → X tools ──
  {
    id: "epub-docx",
    name: "EPUB to DOCX",
    input: ".epub",
    output: ".docx",
    description: "Builds a Microsoft Word document with chapter headings and paragraphs from every EPUB spine entry.",
    accepts: ["epub"],
  },
  {
    id: "epub-rtf",
    name: "EPUB to RTF",
    input: ".epub",
    output: ".rtf",
    description: "Generates a Rich Text Format file with chapter titles and paragraph breaks from the EPUB.",
    accepts: ["epub"],
  },
  {
    id: "epub-fb2",
    name: "EPUB to FB2",
    input: ".epub",
    output: ".fb2",
    description: "Produces a FictionBook 2 XML file with title metadata and one section per chapter.",
    accepts: ["epub"],
  },
  {
    id: "epub-mobi",
    name: "EPUB to MOBI",
    input: ".epub",
    output: ".mobi",
    description: "Outputs a Kindle-friendly EPUB shell labeled .mobi. Best opened via Send to Kindle (which accepts EPUB).",
    accepts: ["epub"],
  },
  {
    id: "epub-azw3",
    name: "EPUB to AZW3",
    input: ".epub",
    output: ".azw3",
    description: "Outputs a clean Kindle-ready EPUB labeled .azw3. Best opened via Send to Kindle (which accepts EPUB).",
    accepts: ["epub"],
  },
  // ── Additional X → EPUB tools ──
  {
    id: "docx-epub",
    name: "DOCX to EPUB",
    input: ".docx",
    output: ".epub",
    description: "Reads Word OOXML paragraphs and styles to build a valid reflowable EPUB.",
    accepts: ["docx"],
  },
  {
    id: "rtf-epub",
    name: "RTF to EPUB",
    input: ".rtf",
    output: ".epub",
    description: "Strips RTF control words and converts the plain text into a fresh EPUB.",
    accepts: ["rtf"],
  },
  {
    id: "fb2-epub",
    name: "FB2 to EPUB",
    input: ".fb2",
    output: ".epub",
    description: "Parses FictionBook 2 XML into chapters and packages them as EPUB.",
    accepts: ["fb2"],
  },
  {
    id: "mobi-epub",
    name: "MOBI to EPUB",
    input: ".mobi",
    output: ".epub",
    description: "Best-effort text extraction from MOBI binary streams. Heavily compressed files may yield partial text.",
    accepts: ["mobi"],
  },
  {
    id: "azw3-epub",
    name: "AZW3 to EPUB",
    input: ".azw3",
    output: ".epub",
    description: "Best-effort text extraction from AZW3 (KF8) Kindle files into EPUB.",
    accepts: ["azw3"],
  },
  {
    id: "azw-epub",
    name: "AZW to EPUB",
    input: ".azw",
    output: ".epub",
    description: "Best-effort text extraction from legacy AZW Kindle files into EPUB.",
    accepts: ["azw"],
  },
  {
    id: "azw4-epub",
    name: "AZW4 to EPUB",
    input: ".azw4",
    output: ".epub",
    description: "Best-effort extraction from AZW4 (Kindle Print Replica) text streams into EPUB.",
    accepts: ["azw4"],
  },
  {
    id: "prc-epub",
    name: "PRC to EPUB",
    input: ".prc",
    output: ".epub",
    description: "Best-effort text extraction from Palm/Mobipocket PRC files into EPUB.",
    accepts: ["prc"],
  },
  {
    id: "pdb-epub",
    name: "PDB to EPUB",
    input: ".pdb",
    output: ".epub",
    description: "Best-effort text extraction from Palm Database ebook files into EPUB.",
    accepts: ["pdb"],
  },
  {
    id: "lit-epub",
    name: "LIT to EPUB",
    input: ".lit",
    output: ".epub",
    description: "Best-effort text extraction from Microsoft Reader LIT files into EPUB.",
    accepts: ["lit"],
  },
  {
    id: "lrf-epub",
    name: "LRF to EPUB",
    input: ".lrf",
    output: ".epub",
    description: "Best-effort text extraction from Sony LRF reader files into EPUB.",
    accepts: ["lrf"],
  },
  {
    id: "chm-epub",
    name: "CHM to EPUB",
    input: ".chm",
    output: ".epub",
    description: "Best-effort text extraction from Compiled HTML Help files into EPUB.",
    accepts: ["chm"],
  },
  {
    id: "djvu-epub",
    name: "DJVU to EPUB",
    input: ".djvu",
    output: ".epub",
    description: "Best-effort text extraction from DjVu document text layers into EPUB.",
    accepts: ["djvu", "djv"],
  },
  {
    id: "cbz-epub",
    name: "CBZ to EPUB",
    input: ".cbz",
    output: ".epub",
    description: "Repackages comic-book ZIP image pages into a fixed-layout EPUB.",
    accepts: ["cbz"],
  },
  {
    id: "cbr-epub",
    name: "CBR to EPUB",
    input: ".cbr",
    output: ".epub",
    description: "Best-effort metadata wrapper for comic-book RAR archives. Browsers can't unrar; export pages from your reader first.",
    accepts: ["cbr"],
  },
  {
    id: "jpg-epub",
    name: "JPG to EPUB",
    input: ".jpg",
    output: ".epub",
    description: "Embeds one or more JPG images as full-page spreads inside a fixed-layout EPUB.",
    accepts: ["jpg", "jpeg"],
  },
  {
    id: "png-epub",
    name: "PNG to EPUB",
    input: ".png",
    output: ".epub",
    description: "Embeds one or more PNG images as full-page spreads inside a fixed-layout EPUB.",
    accepts: ["png"],
  },
  {
    id: "ppt-epub",
    name: "PPT to EPUB",
    input: ".ppt",
    output: ".epub",
    description: "Best-effort text extraction from PowerPoint slide files. PPTX support included.",
    accepts: ["ppt", "pptx"],
  },
];

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function baseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "") || "ebook";
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "ebook"
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXml(value: string) {
  return escapeHtml(value);
}

function normalizeZipPath(path: string) {
  const parts: string[] = [];
  path
    .replace(/^\//, "")
    .split("/")
    .forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") parts.pop();
      else parts.push(part);
    });
  return parts.join("/");
}

function dirname(path: string) {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index + 1);
}

function resolveZipPath(base: string, href: string) {
  const decoded = href.replace(/%20/g, " ");
  return normalizeZipPath(`${base}${decoded.split("#")[0]}`);
}

function firstTag(doc: Document, names: string[]) {
  for (const name of names) {
    const found = doc.getElementsByTagName(name)[0];
    if (found?.textContent?.trim()) return found.textContent.trim();
  }
  return "";
}

function stripHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
  return (doc.body.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getHtmlTitle(html: string, fallback: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (
    doc.querySelector("h1, h2, title")?.textContent?.replace(/\s+/g, " ").trim() ||
    fallback
  );
}

function getBodyHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object").forEach((node) => node.remove());
  return doc.body.innerHTML || `<p>${escapeHtml(stripHtml(html))}</p>`;
}

function textToHtml(text: string) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let listOpen = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    const bullet = /^[-*+]\s+(.+)$/.exec(line);

    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (bullet) {
      flushParagraph();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return html.join("\n");
}

function htmlNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\s+/g, " ") ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map(htmlNodeToMarkdown).join("").trim();

  if (!children && !["br", "hr"].includes(tag)) return "";

  if (/h[1-6]/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${children}\n\n`;
  if (tag === "p") return `${children}\n\n`;
  if (tag === "strong" || tag === "b") return `**${children}**`;
  if (tag === "em" || tag === "i") return `*${children}*`;
  if (tag === "code") return `\`${children}\``;
  if (tag === "a") return `[${children}](${element.getAttribute("href") || "#"})`;
  if (tag === "li") return `- ${children}\n`;
  if (tag === "ul" || tag === "ol") return `${children}\n`;
  if (tag === "br") return "\n";
  if (tag === "hr") return "\n---\n\n";
  return `${children}${["div", "section", "article"].includes(tag) ? "\n\n" : ""}`;
}

function htmlToMarkdown(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, nav").forEach((node) => node.remove());
  return Array.from(doc.body.childNodes)
    .map(htmlNodeToMarkdown)
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text: string) {
  return (text.match(/\b[\w'-]+\b/g) || []).length;
}

async function zipText(zip: JSZip, path: string) {
  const direct = zip.file(path);
  if (direct) return direct.async("string");
  const decoded = zip.file(decodeURIComponent(path));
  if (decoded) return decoded.async("string");
  throw new Error(`Missing EPUB asset: ${path}`);
}

async function parseEpub(buffer: ArrayBuffer): Promise<EpubData> {
  const zip = await JSZip.loadAsync(buffer);
  const containerXml = await zipText(zip, "META-INF/container.xml");
  const containerDoc = new DOMParser().parseFromString(containerXml, "application/xml");
  const rootfile = containerDoc.getElementsByTagName("rootfile")[0];
  const opfPath = rootfile?.getAttribute("full-path");
  if (!opfPath) throw new Error("This EPUB is missing META-INF/container.xml rootfile data.");

  const opfXml = await zipText(zip, opfPath);
  const opfDoc = new DOMParser().parseFromString(opfXml, "application/xml");
  const base = dirname(opfPath);
  const manifest = new Map<string, ManifestItem>();

  Array.from(opfDoc.getElementsByTagName("item")).forEach((item) => {
    const id = item.getAttribute("id") || "";
    const href = item.getAttribute("href") || "";
    if (!id || !href) return;
    manifest.set(id, {
      href,
      mediaType: item.getAttribute("media-type") || "",
      properties: item.getAttribute("properties") || "",
    });
  });

  const spineIds = Array.from(opfDoc.getElementsByTagName("itemref"))
    .map((item) => item.getAttribute("idref") || "")
    .filter(Boolean);

  const metadata: Record<string, string> = {
    title: firstTag(opfDoc, ["dc:title", "title"]),
    creator: firstTag(opfDoc, ["dc:creator", "creator"]),
    language: firstTag(opfDoc, ["dc:language", "language"]),
    publisher: firstTag(opfDoc, ["dc:publisher", "publisher"]),
    identifier: firstTag(opfDoc, ["dc:identifier", "identifier"]),
    date: firstTag(opfDoc, ["dc:date", "date"]),
  };

  const chapters: EpubChapter[] = [];
  for (const id of spineIds) {
    const item = manifest.get(id);
    if (!item || !/(xhtml|html)/i.test(item.mediaType)) continue;
    const path = resolveZipPath(base, item.href);
    const html = await zipText(zip, path);
    const fallback = `Chapter ${chapters.length + 1}`;
    chapters.push({
      id,
      href: path,
      title: getHtmlTitle(html, fallback),
      html,
      text: stripHtml(html),
    });
  }

  const coverId =
    Array.from(opfDoc.getElementsByTagName("meta")).find(
      (meta) => meta.getAttribute("name") === "cover",
    )?.getAttribute("content") ||
    Array.from(manifest.entries()).find(([, item]) => item.properties.includes("cover-image"))?.[0] ||
    Array.from(manifest.entries()).find(
      ([id, item]) => /cover/i.test(`${id} ${item.href}`) && item.mediaType.startsWith("image/"),
    )?.[0];

  const coverItem = coverId ? manifest.get(coverId) : undefined;
  let cover: EpubData["cover"];
  if (coverItem && coverItem.mediaType.startsWith("image/")) {
    const coverPath = resolveZipPath(base, coverItem.href);
    const image = zip.file(coverPath) || zip.file(decodeURIComponent(coverPath));
    if (image) {
      cover = {
        name: coverPath.split("/").pop() || `cover.${imageExtensions[coverItem.mediaType] || "img"}`,
        mime: coverItem.mediaType,
        data: await image.async("arraybuffer"),
      };
    }
  }

  // Extract all images from the EPUB
  const images = new Map<string, { blob: Blob; url: string }>();
  for (const [, item] of manifest.entries()) {
    if (!item.mediaType.startsWith("image/")) continue;
    const imgPath = resolveZipPath(base, item.href);
    const imgFile = zip.file(imgPath) || zip.file(decodeURIComponent(imgPath));
    if (!imgFile) continue;
    try {
      const imgData = await imgFile.async("arraybuffer");
      const blob = new Blob([imgData], { type: item.mediaType });
      const url = URL.createObjectURL(blob);
      images.set(imgPath, { blob, url });
      // Also store with decoded path for lookup
      if (imgPath !== decodeURIComponent(imgPath)) {
        images.set(decodeURIComponent(imgPath), { blob, url });
      }
    } catch {
      // Skip images that fail to load
    }
  }

  return {
    title: metadata.title || "Untitled EPUB",
    metadata,
    chapters,
    cover,
    images,
  };
}

/**
 * Converts a Blob to a base64 data URI string.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Rewrites image src attributes in HTML to use blob URLs from the EPUB images map.
 * Resolves relative paths against the chapter's href path.
 */
function rewriteImageSrc(html: string, chapterHref: string, images: Map<string, { blob: Blob; url: string }>): string {
  const chapterBase = dirname(chapterHref);
  
  // Replace <img src="..."> and <image xlink:href="..."> (for SVG)
  return html.replace(/(<img[^>]+src=|<image[^>]+(?:xlink:)?href=)(["'])([^"']+)\2/g, (match, prefix, quote, src) => {
    // Skip data URIs and absolute URLs
    if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) {
      return match;
    }
    
    // Remove fragment identifier
    const srcPath = src.split("#")[0];
    
    // Resolve relative path against chapter base
    const resolvedPath = resolveZipPath(chapterBase, srcPath);
    
    // Look up in images map
    const imgData = images.get(resolvedPath) || images.get(decodeURIComponent(resolvedPath));
    if (imgData) {
      return `${prefix}${quote}${imgData.url}${quote}`;
    }
    
    // Return original if not found
    return match;
  });
}

function buildCombinedText(epub: EpubData) {
  return [`# ${epub.title}`, ...epub.chapters.map((chapter) => `${chapter.title}\n\n${chapter.text}`)]
    .join("\n\n")
    .trim();
}

async function buildCombinedHtml(epub: EpubData) {
  // Convert images to base64 data URIs for self-contained HTML
  const imageDataUris = new Map<string, string>();
  for (const [path, imgData] of epub.images.entries()) {
    try {
      const base64 = await blobToBase64(imgData.blob);
      imageDataUris.set(path, base64);
    } catch {
      // Skip images that fail to convert
    }
  }

  const body = epub.chapters
    .map(
      (chapter, index) => {
        const chapterHtml = getBodyHtml(chapter.html);
        const chapterBase = dirname(chapter.href);
        
        // Replace image src with base64 data URIs
        const htmlWithImages = chapterHtml.replace(
          /(<img[^>]+src=|<image[^>]+(?:xlink:)?href=)(["'])([^"']+)\2/g,
          (match, prefix, quote, src) => {
            if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) {
              return match;
            }
            const srcPath = src.split("#")[0];
            const resolvedPath = resolveZipPath(chapterBase, srcPath);
            const dataUri = imageDataUris.get(resolvedPath) || imageDataUris.get(decodeURIComponent(resolvedPath));
            if (dataUri) {
              return `${prefix}${quote}${dataUri}${quote}`;
            }
            return match;
          }
        );
        
        return `
        <section id="chapter-${index + 1}">
          <h1>${escapeHtml(chapter.title)}</h1>
          ${htmlWithImages}
        </section>`;
      },
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(epub.title)}</title>
  <style>
    body { color: #171717; font-family: Georgia, serif; line-height: 1.7; margin: 0 auto; max-width: 760px; padding: 48px 24px; }
    h1 { font-family: Arial, sans-serif; line-height: 1.1; margin-top: 2.5rem; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}

function buildMarkdown(epub: EpubData) {
  const chapters = epub.chapters.map((chapter) => {
    const markdown = htmlToMarkdown(chapter.html) || chapter.text;
    return `# ${chapter.title}\n\n${markdown}`;
  });
  return [`# ${epub.title}`, ...chapters].join("\n\n").trim();
}

/**
 * Build an EPUB with multiple chapters (each chapter = separate XHTML file).
 * This produces a proper EPUB with a navigable Table of Contents.
 */
async function createMultiChapterEpubBlob(
  title: string,
  chapters: { title: string; html: string }[],
  author = "",
  embeddedImages?: { id: string; fileName: string; mime: string; data: ArrayBuffer }[],
  onProgress?: (p: number) => void,
) {
  const cleanTitle = title.trim() || "Converted Book";
  const identifier = `urn:uuid:${crypto.randomUUID()}`;
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const zip = new JSZip();

  // Embed images
  const extraManifest: string[] = [];
  if (embeddedImages && embeddedImages.length > 0) {
    for (const image of embeddedImages) {
      zip.file(`OEBPS/images/${image.fileName}`, image.data);
      extraManifest.push(
        `<item id="${escapeXml(image.id)}" href="images/${escapeXml(image.fileName)}" media-type="${escapeXml(image.mime)}" />`,
      );
    }
  }

  // Normalize chapter HTML to use proper image paths
  const normalizeHtml = (html: string) => {
    let normalized = html;
    if (embeddedImages) {
      for (const image of embeddedImages) {
        normalized = normalized.split(`src="${image.id}"`).join(`src="images/${image.fileName}"`);
        normalized = normalized.split(`src='${image.id}'`).join(`src="images/${image.fileName}"`);
      }
    }
    return normalized;
  };

  // Generate chapter files
  const chapterManifest: string[] = [];
  const spineItems: string[] = [];
  const navItems: string[] = [];

  chapters.forEach((chapter, idx) => {
    const chapterId = `chapter${String(idx + 1).padStart(3, "0")}`;
    const chapterHref = `${chapterId}.xhtml`;
    const normalizedHtml = normalizeHtml(chapter.html);

    zip.file(
      `OEBPS/${chapterHref}`,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  ${normalizedHtml}
</body>
</html>`,
    );

    chapterManifest.push(`<item id="${chapterId}" href="${chapterHref}" media-type="application/xhtml+xml" />`);
    spineItems.push(`<itemref idref="${chapterId}" />`);
    navItems.push(`<li><a href="${chapterHref}">${escapeXml(chapter.title)}</a></li>`);
  });

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`,
  );
  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(cleanTitle)}</dc:title>
    ${author ? `<dc:creator>${escapeXml(author)}</dc:creator>` : ""}
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="style" href="style.css" media-type="text/css" />
    ${chapterManifest.join("\n    ")}
    ${extraManifest.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`,
  );
  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${escapeXml(cleanTitle)} Navigation</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.45; margin: 8%; color: #111; }
    h1 { font-family: Arial, sans-serif; font-size: 1.45rem; margin: 0 0 1.5rem; }
    ol { list-style: none; margin: 0; padding: 0; }
    li { margin: 0.7rem 0; }
    a { color: inherit; text-decoration: none; display: flex; align-items: baseline; gap: 0.45rem; }
    a::after { content: ""; border-bottom: 1px dotted #444; flex: 1; transform: translateY(-0.25rem); }
    li li { margin: 0.35rem 0 0.35rem 1.4rem; font-size: 0.95rem; }
    li li a::after { border-bottom-color: #777; }
  </style>
</head>
<body>
  <nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops">
    <h1>Contents</h1>
    <ol>${navItems.join("\n      ")}</ol>
  </nav>
</body>
</html>`,
  );
  zip.file(
    "OEBPS/style.css",
    `body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; margin: 5%; color: #1a1a1a; }
h1 { font-family: Arial, Helvetica, sans-serif; font-size: 1.8em; margin: 2em 0 0.8em; line-height: 1.2; page-break-before: always; }
h2 { font-family: Arial, Helvetica, sans-serif; font-size: 1.4em; margin: 1.6em 0 0.6em; line-height: 1.3; }
h3 { font-family: Arial, Helvetica, sans-serif; font-size: 1.15em; margin: 1.2em 0 0.5em; }
p { margin: 0.4em 0; text-align: justify; }
img { max-width: 100%; height: auto; display: block; margin: 1.2em auto; }
a { color: #1a5276; text-decoration: underline; }
hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
blockquote { border-left: 3px solid #b0b0b0; padding-left: 1em; margin: 1em 0; color: #444; font-style: italic; }
ul, ol { padding-left: 1.5em; margin: 0.6em 0; }
li { margin: 0.3em 0; }
pre, code { font-family: 'Courier New', monospace; font-size: 0.9em; background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; }
pre { padding: 0.8em; overflow-x: auto; white-space: pre-wrap; }`,
  );

  return zip.generateAsync(
    { type: "blob", mimeType: "application/epub+zip" },
    (metadata) => {
      if (onProgress) onProgress(Math.min(99, Math.round(metadata.percent)));
    },
  );
}

async function createEpubBlob(
  title: string,
  bodyHtml: string,
  author = "Created in EPUBForge",
  embeddedImages?: { id: string; fileName: string; mime: string; data: ArrayBuffer }[],
) {
  const cleanTitle = title.trim() || "Converted Book";
  const identifier = `urn:uuid:${crypto.randomUUID()}`;
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const zip = new JSZip();

  let normalizedBodyHtml = bodyHtml;
  const extraManifest: string[] = [];

  if (embeddedImages && embeddedImages.length > 0) {
    for (const image of embeddedImages) {
      zip.file(`OEBPS/images/${image.fileName}`, image.data);
      extraManifest.push(
        `<item id="${escapeXml(image.id)}" href="images/${escapeXml(image.fileName)}" media-type="${escapeXml(image.mime)}" />`,
      );
      // More robust string replacement for src attributes
      normalizedBodyHtml = normalizedBodyHtml.split(`src="${image.id}"`).join(`src="images/${image.fileName}"`);
      normalizedBodyHtml = normalizedBodyHtml.split(`src='${image.id}'`).join(`src="images/${image.fileName}"`);
    }
  }

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`,
  );
  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(cleanTitle)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="chapter" href="chapter001.xhtml" media-type="application/xhtml+xml" />
    <item id="style" href="style.css" media-type="text/css" />
    ${extraManifest.join("\n    ")}
  </manifest>
  <spine>
    <itemref idref="chapter" />
  </spine>
</package>`,
  );
  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${escapeXml(cleanTitle)} Navigation</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.45; margin: 8%; color: #111; }
    h1 { font-family: Arial, sans-serif; font-size: 1.45rem; margin: 0 0 1.5rem; }
    ol { list-style: none; margin: 0; padding: 0; }
    li { margin: 0.7rem 0; }
    a { color: inherit; text-decoration: none; display: flex; align-items: baseline; gap: 0.45rem; }
    a::after { content: ""; border-bottom: 1px dotted #444; flex: 1; transform: translateY(-0.25rem); }
    li li { margin: 0.35rem 0 0.35rem 1.4rem; font-size: 0.95rem; }
    li li a::after { border-bottom-color: #777; }
  </style>
</head>
<body>
  <nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops">
    <h1>Contents</h1>
    <ol><li><a href="chapter001.xhtml">${escapeXml(cleanTitle)}</a></li></ol>
  </nav>
</body>
</html>`,
  );
  zip.file(
    "OEBPS/chapter001.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${escapeXml(cleanTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  ${normalizedBodyHtml}
</body>
</html>`,
  );
  zip.file(
    "OEBPS/style.css",
    "body{font-family:serif;line-height:1.5;margin:5%;}img{max-width:100%;height:auto;}a{color:blue;text-decoration:underline;}",
  );

  return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}

function getPdfImageFormat(mime: string) {
  if (mime.includes("png")) return "PNG";
  if (mime.includes("webp")) return "WEBP";
  return "JPEG";
}

async function getImageSize(dataUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
    image.onerror = reject;
    image.src = dataUri;
  });
}

function htmlToStructuredBlocks(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style").forEach((n) => n.remove());
  const blocks: Array<
    | { type: "heading"; level: number; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[]; ordered: boolean }
    | { type: "blockquote"; text: string }
    | { type: "pre"; text: string }
    | { type: "image"; src: string; alt: string }
  > = [];

  const walker = (root: ParentNode) => {
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) blocks.push({ type: "paragraph", text });
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (/h[1-6]/.test(tag)) {
        blocks.push({ type: "heading", level: Number(tag[1]), text: (el.textContent || "").trim() });
      } else if (tag === "p") {
        const text = (el.textContent || "").trim();
        if (text) blocks.push({ type: "paragraph", text });
      } else if (tag === "ul" || tag === "ol") {
        const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => (li.textContent || "").trim()).filter(Boolean);
        if (items.length) blocks.push({ type: "list", items, ordered: tag === "ol" });
      } else if (tag === "blockquote") {
        const text = (el.textContent || "").trim();
        if (text) blocks.push({ type: "blockquote", text });
      } else if (tag === "pre") {
        const text = (el.textContent || "").trim();
        if (text) blocks.push({ type: "pre", text });
      } else if (tag === "img") {
        const src = el.getAttribute("src") || "";
        if (src) blocks.push({ type: "image", src, alt: el.getAttribute("alt") || "" });
      } else if (tag === "figure") {
        const img = el.querySelector("img");
        if (img?.getAttribute("src")) {
          blocks.push({ type: "image", src: img.getAttribute("src") || "", alt: img.getAttribute("alt") || "" });
        }
        const caption = el.querySelector("figcaption")?.textContent?.trim();
        if (caption) blocks.push({ type: "paragraph", text: caption });
      } else {
        walker(el);
      }
    }
  };

  walker(doc.body);
  return blocks;
}

async function extractEmbeddedImagesFromHtml(html: string): Promise<{ id: string; fileName: string; mime: string; data: ArrayBuffer }[]> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const images: { id: string; fileName: string; mime: string; data: ArrayBuffer }[] = [];
  const imgNodes = Array.from(doc.querySelectorAll("img[src^='data:']"));

  let index = 1;
  for (const img of imgNodes) {
    const src = img.getAttribute("src") || "";
    const match = /^data:([^;]+);base64,(.+)$/i.exec(src);
    if (!match) continue;
    const mime = match[1];
    const base64 = match[2];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = imageExtensions[mime] || "img";
    const id = `embedded-image-${index}`;
    const fileName = `${id}.${ext}`;
    images.push({ id, fileName, mime, data: bytes.buffer });
    img.setAttribute("src", id);
    index += 1;
  }

  return images;
}

async function buildPdfFromEpub(epub: EpubData): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const marginTop = 64;
  const marginBottom = 64;
  const usableWidth = pageWidth - marginX * 2;
  let cursorY = marginTop;

  const ensureSpace = (height: number) => {
    // Only add a new page if we aren't already at the top of a fresh page.
    // This prevents a blank first page if the first element (like a cover image) is very tall.
    if (cursorY + height > pageHeight - marginBottom && cursorY > marginTop) {
      doc.addPage();
      cursorY = marginTop;
    }
  };

  const renderText = (text: string, options?: { size?: number; bold?: boolean; italic?: boolean; indent?: number; color?: number; align?: "left" | "center" | "right" | "justify" }) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    const size = options?.size || 11;
    const indent = options?.indent || 0;
    const style = options?.bold ? "bold" : options?.italic ? "italic" : "normal";
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(options?.color ?? 28);

    const lines = doc.splitTextToSize(clean, usableWidth - indent);
    const lineHeightRatio = 1.4;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      ensureSpace(size * lineHeightRatio);
      
      if (options?.align === "center") {
        doc.text(line, pageWidth / 2, cursorY, { align: "center" });
      } else if (options?.align === "justify" && i < lines.length - 1) {
        // Simple manual justify: jsPDF 2.x supports align: "justify"
        doc.text(line, marginX + indent, cursorY, { align: "justify", maxWidth: usableWidth - indent });
      } else {
        doc.text(line, marginX + indent, cursorY);
      }
      
      cursorY += size * lineHeightRatio;
    }
    // Vertical spacing between blocks
    cursorY += 4;
  };

  const renderImage = async (src: string, chapterHref: string) => {
    if (!src || src.startsWith("http://") || src.startsWith("https://")) return;
    const chapterBase = dirname(chapterHref);
    const srcPath = src.split("#")[0];
    const resolvedPath = src.startsWith("data:") ? src : resolveZipPath(chapterBase, srcPath);
    let dataUri = src.startsWith("data:") ? src : "";
    let mime = "image/jpeg";

    if (!dataUri) {
      let imgData = epub.images.get(resolvedPath) || epub.images.get(decodeURIComponent(resolvedPath));
      
      // Fallback: search by filename if exact path fails (handles directory structure mismatches)
      if (!imgData) {
        const filename = srcPath.split("/").pop();
        if (filename) {
          for (const [path, data] of epub.images.entries()) {
            if (path.endsWith(filename) || decodeURIComponent(path).endsWith(filename)) {
              imgData = data;
              break;
            }
          }
        }
      }
      
      if (!imgData) return;
      mime = imgData.blob.type || mime;
      dataUri = await blobToBase64(imgData.blob);
    }

    try {
      const { width, height } = await getImageSize(dataUri);
      if (!width || !height) return;
      const maxWidth = usableWidth;
      const maxHeight = pageHeight - marginTop - marginBottom;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      const drawWidth = width * ratio;
      const drawHeight = height * ratio;
      ensureSpace(drawHeight + 16);
      doc.addImage(dataUri, getPdfImageFormat(mime), marginX + (usableWidth - drawWidth) / 2, cursorY, drawWidth, drawHeight);
      cursorY += drawHeight + 14;
    } catch {
      // Some SVG/GIF/WebP assets cannot be embedded by jsPDF; skip gracefully.
    }
  };

  // Chapters (Direct rendering, no auto-generated title page or headings to maintain authenticity)
  let isFirstPage = true;
  for (const chapter of epub.chapters) {
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;
    cursorY = marginTop;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const structuredBlocks = htmlToStructuredBlocks(getBodyHtml(chapter.html));
    if (structuredBlocks.length > 0) {
      for (const block of structuredBlocks) {
        if (block.type === "heading") {
          cursorY += 8;
          renderText(block.text, { size: Math.max(13, 22 - block.level * 2), bold: true, color: 18 });
          cursorY += 4;
        } else if (block.type === "paragraph") {
          renderText(block.text, { size: 11, align: "justify" });
        } else if (block.type === "list") {
          block.items.forEach((item, idx) => {
            const bullet = block.ordered ? `${idx + 1}. ${item}` : `• ${item}`;
            renderText(bullet, { size: 11, indent: 15 });
          });
          cursorY += 4;
        } else if (block.type === "blockquote") {
          renderText(block.text, { size: 10, italic: true, indent: 30, color: 80 });
        } else if (block.type === "pre") {
          doc.setFont("courier", "normal");
          renderText(block.text, { size: 9, indent: 15, color: 60 });
          doc.setFont("helvetica", "normal");
        } else if (block.type === "image") {
          cursorY += 10;
          await renderImage(block.src, chapter.href);
          cursorY += 10;
        }
      }
    } else {
      const paragraphs = chapter.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      for (const paragraph of paragraphs) {
        renderText(paragraph, { size: 11 });
      }
    }
  }

  // Page numbers footer on every page
  const pageCount = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`${i} / ${pageCount}`, pageWidth - marginX, pageHeight - 24, { align: "right" });
  }

  return doc.output("blob");
}

// ───────────────────── Generic text extractor ─────────────────────
// Scans a binary buffer for runs of printable text. Used as the
// best-effort fallback for proprietary Kindle/Palm/Mobi/CHM/DJVU
// formats where full decoding would require a native library.
function extractTextFromBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Decode as latin1 so every byte maps to a character; then scan.
  let str = "";
  const chunkSize = 65536;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    str += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as number[]);
  }

  // Try to also pull UTF-8 strings (fallback that may overlap with latin1 scan)
  try {
    const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    str = utf8.length > str.length ? utf8 : str;
  } catch {
    /* ignore */
  }

  // Find runs of printable ASCII / common punctuation of length >= 6
  const matches = str.match(/[\x20-\x7E\u00A0-\u024F\n\r\t]{6,}/g) || [];
  const filtered = matches
    .map((m) => m.replace(/[\r\t]+/g, " ").trim())
    .filter((m) => {
      if (m.length < 12) return false;
      // Skip obvious binary-noise tokens
      if (/^[A-Za-z0-9+/=]{32,}$/.test(m)) return false;
      // Skip lines that are mostly non-letters
      const letters = (m.match(/[A-Za-z]/g) || []).length;
      return letters / m.length > 0.4;
    });

  if (filtered.length === 0) {
    return "No readable text streams could be extracted from this file. The format may be DRM-protected, heavily compressed, or image-only.";
  }

  // Group consecutive lines into paragraphs
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of filtered) {
    current.push(line);
    if (line.endsWith(".") || line.endsWith("?") || line.endsWith("!") || current.length >= 4) {
      paragraphs.push(current.join(" "));
      current = [];
    }
  }
  if (current.length > 0) paragraphs.push(current.join(" "));
  return paragraphs.join("\n\n");
}

// ───────────────────── DOCX (parse + build) ─────────────────────
async function parseDocxToHtmlWithImages(
  buffer: ArrayBuffer,
  onProgress?: (p: number) => void
): Promise<{ html: string; images: { id: string; fileName: string; mime: string; data: ArrayBuffer }[] }> {
  const zip = await JSZip.loadAsync(buffer);

  // ── 1. Parse relationships to map rId → media path ──
  const relXml = await zip.file("word/_rels/document.xml.rels")?.async("string");
  const relMap = new Map<string, string>(); // rId → target path inside zip (word/media/...)
  if (relXml) {
    const relDoc = new DOMParser().parseFromString(relXml, "application/xml");
    for (const rel of Array.from(relDoc.getElementsByTagName("Relationship"))) {
      const id = rel.getAttribute("Id") || "";
      const target = rel.getAttribute("Target") || "";
      const type = rel.getAttribute("Type") || "";
      if (id && target) {
        // Normalise: Target might be "media/image1.png", full zip path is "word/media/image1.png"
        const fullPath = target.startsWith("/") ? target.slice(1) : `word/${target.replace(/^\.\.\//, "")}`;
        relMap.set(id, fullPath);
        // Hyperlinks have type ending in hyperlink
        if (type.includes("hyperlink")) relMap.set(id + "__hyperlink", target);
      }
    }
  }

  // ── 2. Extract all media into embeddedImages array ──
  const embeddedImages: { id: string; fileName: string; mime: string; data: ArrayBuffer }[] = [];
  const imageIdMap = new Map<string, string>(); // zip path → our image id

  for (const [rId, path] of relMap.entries()) {
    if (rId.includes("__hyperlink")) continue;
    const ext = path.split(".").pop()?.toLowerCase() || "png";
    if (!["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "emf", "wmf"].includes(ext)) continue;
    if (imageIdMap.has(path)) continue;
    const fileInZip = zip.file(path);
    if (!fileInZip) continue;
    const data = await fileInZip.async("arraybuffer");
    const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
    const imgId = `docx-img-${embeddedImages.length + 1}`;
    const fileName = `${imgId}.${ext === "jpeg" ? "jpg" : ext}`;
    embeddedImages.push({ id: imgId, fileName, mime, data });
    imageIdMap.set(path, `images/${fileName}`);
  }

  // ── 3. Helper to get image src from a drawing/inline element ──
  const getImageSrc = (element: Element): string | null => {
    // Look for a:blip inside the drawing
    const blips = Array.from(element.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "blip"));
    if (blips.length === 0) {
      const blipsNs = Array.from(element.querySelectorAll("blip"));
      blips.push(...blipsNs);
    }
    for (const blip of blips) {
      const rId = blip.getAttribute("r:embed") || blip.getAttribute("embed") || "";
      if (!rId) continue;
      const path = relMap.get(rId);
      if (path && imageIdMap.has(path)) return imageIdMap.get(path)!;
    }
    return null;
  };

  // ── 4. Parse document.xml into HTML ──
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("Not a valid DOCX file (missing word/document.xml).");
  const docElem = new DOMParser().parseFromString(docXml, "application/xml");

  // Numbering definitions for lists
  const numXml = await zip.file("word/numbering.xml")?.async("string");
  const numMap = new Map<string, { fmt: string; ilvl: number }>(); // numId+ilvl → format
  if (numXml) {
    const numDoc = new DOMParser().parseFromString(numXml, "application/xml");
    for (const abs of Array.from(numDoc.getElementsByTagName("w:abstractNum"))) {
      const absId = abs.getAttribute("w:abstractNumId") || "";
      for (const lvl of Array.from(abs.getElementsByTagName("w:lvl"))) {
        const ilvl = parseInt(lvl.getAttribute("w:ilvl") || "0", 10);
        const fmtEl = lvl.getElementsByTagName("w:numFmt")[0];
        const fmt = fmtEl?.getAttribute("w:val") || "bullet";
        numMap.set(`${absId}-${ilvl}`, { fmt, ilvl });
      }
    }
  }

  // Map numId → abstractNumId
  const numIdToAbsId = new Map<string, string>();
  if (numXml) {
    const numDoc = new DOMParser().parseFromString(numXml, "application/xml");
    for (const num of Array.from(numDoc.getElementsByTagName("w:num"))) {
      const numId = num.getAttribute("w:numId") || "";
      const absId = num.getElementsByTagName("w:abstractNumId")[0]?.getAttribute("w:val") || "";
      if (numId && absId) numIdToAbsId.set(numId, absId);
    }
  }

  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const paragraphs = Array.from(docElem.getElementsByTagNameNS(ns, "p"));
    const htmlParts: string[] = [];
    let currentList: { numId: string; ordered: boolean; ilvl: number } | null = null;

    let processedCount = 0;

  const closeList = () => {
    if (currentList) {
      htmlParts.push(currentList.ordered ? "</ol>" : "</ul>");
      currentList = null;
    }
  };

    for (const p of paragraphs) {
      processedCount++;
      if (onProgress && processedCount % 20 === 0) onProgress(Math.floor((processedCount / paragraphs.length) * 100));
      if (processedCount % 50 === 0) await new Promise(r => setTimeout(r, 0));

      // ── Style detection ──
      const pStyle = p.getElementsByTagNameNS(ns, "pStyle")[0]?.getAttribute("w:val") || "";
    const numIdEl = p.getElementsByTagNameNS(ns, "numId")[0];
    const numId = numIdEl?.getAttribute("w:val") || "";
    const ilvlEl = p.getElementsByTagNameNS(ns, "ilvl")[0];
    const ilvl = parseInt(ilvlEl?.getAttribute("w:val") || "0", 10);

    // ── Images inside this paragraph ──
    const drawings = Array.from(p.getElementsByTagNameNS(
      "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing", "inline",
    ));
    const anchors = Array.from(p.getElementsByTagNameNS(
      "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing", "anchor",
    ));
    const allDrawings = [...drawings, ...anchors];

    const imageHtmlParts: string[] = [];
    for (const d of allDrawings) {
      const src = getImageSrc(d);
      if (src) imageHtmlParts.push(`<img src="${src}" alt=""/>`);
    }

    // ── Run text assembly (with inline formatting) ──
    const runs = Array.from(p.getElementsByTagNameNS(ns, "r"));
    let paraText = "";
    for (const run of runs) {
      const bold = run.getElementsByTagNameNS(ns, "b").length > 0;
      const italic = run.getElementsByTagNameNS(ns, "i").length > 0;
      const underline = run.getElementsByTagNameNS(ns, "u").length > 0;
      const strike = run.getElementsByTagNameNS(ns, "strike").length > 0;
      const textEl = run.getElementsByTagNameNS(ns, "t")[0];
      const text = textEl?.textContent || "";
      if (!text) continue;
      let escaped = escapeHtml(text);
      if (strike) escaped = `<s>${escaped}</s>`;
      if (underline) escaped = `<u>${escaped}</u>`;
      if (italic) escaped = `<em>${escaped}</em>`;
      if (bold) escaped = `<strong>${escaped}</strong>`;
      paraText += escaped;
    }

    // Hyperlink-aware pass starts below — no pre-scan needed here.
    // Hyperlink-aware pass: re-scan child elements for proper link and run handling
    let paraHtmlContent = "";
    const childNodes = Array.from(p.childNodes);
    for (const node of childNodes) {
      if (node.nodeType !== 1) continue;
      const el = node as Element;
      const localName = el.localName;

      if (localName === "hyperlink") {
        const rId = el.getAttribute("r:id") || "";
        const href = relMap.get(rId + "__hyperlink") || relMap.get(rId) || "#";
        const linkText = Array.from(el.getElementsByTagNameNS(ns, "t"))
          .map((t) => t.textContent || "")
          .join("");
        if (linkText) paraHtmlContent += `<a href="${escapeHtml(href)}">${escapeHtml(linkText)}</a>`;
      } else if (localName === "r") {
        const bold = el.getElementsByTagNameNS(ns, "b").length > 0;
        const italic = el.getElementsByTagNameNS(ns, "i").length > 0;
        const underline = el.getElementsByTagNameNS(ns, "u").length > 0;
        const strike = el.getElementsByTagNameNS(ns, "strike").length > 0;
        const textEl = el.getElementsByTagNameNS(ns, "t")[0];
        const text = textEl?.textContent || "";
        if (!text) continue;
        let esc = escapeHtml(text);
        if (strike) esc = `<s>${esc}</s>`;
        if (underline) esc = `<u>${esc}</u>`;
        if (italic) esc = `<em>${esc}</em>`;
        if (bold) esc = `<strong>${esc}</strong>`;
        paraHtmlContent += esc;
      }
      // Drawings handled separately above
    }

    // Fallback to the simple paraText if hyperlink pass found nothing
    if (!paraHtmlContent && paraText) paraHtmlContent = paraText;

    const hasText = paraHtmlContent.trim().length > 0;
    const hasImages = imageHtmlParts.length > 0;

    if (!hasText && !hasImages) {
      // Empty paragraph — treat as blank line separator
      continue;
    }

    // ── Heading detection ──
    const headingMatch = /^Heading(\d)/i.exec(pStyle);
    if (headingMatch) {
      closeList();
      const level = Math.min(parseInt(headingMatch[1], 10), 6);
      htmlParts.push(`<h${level}>${paraHtmlContent}</h${level}>`);
      for (const img of imageHtmlParts) htmlParts.push(`<p>${img}</p>`);
      continue;
    }

    // ── Title / Subtitle ──
    if (/^title$/i.test(pStyle)) {
      closeList();
      htmlParts.push(`<h1>${paraHtmlContent}</h1>`);
      for (const img of imageHtmlParts) htmlParts.push(`<p>${img}</p>`);
      continue;
    }
    if (/^subtitle$/i.test(pStyle)) {
      closeList();
      htmlParts.push(`<h2>${paraHtmlContent}</h2>`);
      for (const img of imageHtmlParts) htmlParts.push(`<p>${img}</p>`);
      continue;
    }

    // ── List item ──
    if (numId) {
      const absId = numIdToAbsId.get(numId) || "";
      const numInfo = numMap.get(`${absId}-${ilvl}`);
      const ordered = numInfo?.fmt === "decimal" || numInfo?.fmt === "lowerLetter" || numInfo?.fmt === "upperLetter" || numInfo?.fmt === "lowerRoman" || numInfo?.fmt === "upperRoman";

      if (!currentList || currentList.numId !== numId) {
        closeList();
        htmlParts.push(ordered ? "<ol>" : "<ul>");
        currentList = { numId, ordered, ilvl };
      }
      htmlParts.push(`<li>${paraHtmlContent}${imageHtmlParts.join("")}</li>`);
      continue;
    }

    // ── Regular paragraph ──
    closeList();
    const content = [paraHtmlContent, ...imageHtmlParts].filter(Boolean).join("\n");
    if (content) {
      // Images on their own get a block wrapper
      if (!hasText && hasImages) {
        for (const img of imageHtmlParts) htmlParts.push(`<p>${img}</p>`);
      } else {
        htmlParts.push(`<p>${content}</p>`);
      }
    }
  }

  closeList();

  return {
    html: htmlParts.join("\n"),
    images: embeddedImages,
  };
}

async function buildDocxFromEpub(epub: EpubData): Promise<Blob> {
  const zip = new JSZip();
  const rels: string[] = [];
  const imageRelByPath = new Map<string, { rId: string; fileName: string; cx: number; cy: number }>();
  let relCounter = 1;
  let docPrCounter = 1;

  const getImageForDocx = async (src: string, chapterHref: string) => {
    if (!src || src.startsWith("http://") || src.startsWith("https://")) return null;
    const srcPath = src.split("#")[0];
    const resolvedPath = src.startsWith("data:") ? src : resolveZipPath(dirname(chapterHref), srcPath);

    if (imageRelByPath.has(resolvedPath)) return imageRelByPath.get(resolvedPath)!;

    let blob: Blob | undefined;
    let mime = "image/jpeg";
    if (src.startsWith("data:")) {
      const match = /^data:([^;]+);base64,(.+)$/i.exec(src);
      if (!match) return null;
      mime = match[1];
      const binary = atob(match[2]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes.buffer], { type: mime });
    } else {
      let found = epub.images.get(resolvedPath) || epub.images.get(decodeURIComponent(resolvedPath));
      
      // Fallback: search by filename if exact path fails
      if (!found) {
        const filename = srcPath.split("/").pop();
        if (filename) {
          for (const [path, data] of epub.images.entries()) {
            if (path.endsWith(filename) || decodeURIComponent(path).endsWith(filename)) {
              found = data;
              break;
            }
          }
        }
      }
      
      if (!found) return null;
      blob = found.blob;
      mime = blob.type || mime;
    }

    if (!blob) return null;
    if (mime.includes("svg") || mime.includes("gif") || mime.includes("webp")) return null;

    const ext = imageExtensions[mime] || "jpg";
    const fileName = `image${imageRelByPath.size + 1}.${ext}`;
    zip.file(`word/media/${fileName}`, await blob.arrayBuffer());

    let width = 800;
    let height = 500;
    try {
      const dataUri = await blobToBase64(blob);
      const size = await getImageSize(dataUri);
      width = size.width || width;
      height = size.height || height;
    } catch {
      // use fallback size
    }

    const maxCx = 5_800_000; // ~6.3 inches, fits default Word margins
    const aspect = height / Math.max(width, 1);
    const cx = Math.min(maxCx, Math.round(width * 9525));
    const cy = Math.round(cx * aspect);
    const rId = `rId${++relCounter}`;
    rels.push(
      `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${fileName}"/>`,
    );
    const info = { rId, fileName, cx, cy };
    imageRelByPath.set(resolvedPath, info);
    return info;
  };

  const paragraphXml = (text: string, style?: string) => {
    const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
    return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  };

  const imageXml = (img: { rId: string; fileName: string; cx: number; cy: number }) => {
    const docPrId = docPrCounter++;
    return `<w:p><w:r><w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
        <wp:extent cx="${img.cx}" cy="${img.cy}"/>
        <wp:docPr id="${docPrId}" name="${escapeXml(img.fileName)}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr><pic:cNvPr id="0" name="${escapeXml(img.fileName)}"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="${img.rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${img.cx}" cy="${img.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing></w:r></w:p>`;
  };

  zip.file("[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file("_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  const body: string[] = [];
  // Chapters. Do not inject title/cover pages; preserve original content order.
  for (const chapter of epub.chapters) {
    if (body.length > 0) body.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    const blocks = htmlToStructuredBlocks(getBodyHtml(chapter.html));
    if (blocks.length === 0) {
      const paragraphs = chapter.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      for (const para of paragraphs) body.push(paragraphXml(para));
      continue;
    }

    for (const block of blocks) {
      if (block.type === "heading") body.push(paragraphXml(block.text, `Heading${Math.min(block.level, 6)}`));
      else if (block.type === "paragraph") body.push(paragraphXml(block.text));
      else if (block.type === "blockquote") body.push(paragraphXml(block.text, "Quote"));
      else if (block.type === "pre") body.push(paragraphXml(block.text));
      else if (block.type === "list") {
        block.items.forEach((item, index) => body.push(paragraphXml(block.ordered ? `${index + 1}. ${item}` : `• ${item}`)));
      } else if (block.type === "image") {
        const img = await getImageForDocx(block.src, chapter.href);
        if (img) body.push(imageXml(img));
      }
    }
  }

  zip.file("word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${rels.join("\n  ")}
</Relationships>`);

  zip.file("word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body.join("\n    ")}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

// ───────────────────── RTF (parse + build) ─────────────────────
function parseRtf(text: string): string {
  // Strip RTF control words and groups
  let out = text;
  // Replace \uXXXX? unicode escapes
  out = out.replace(/\\u(-?\d+)\??/g, (_, n) => {
    const code = parseInt(n, 10);
    return code < 0 ? String.fromCharCode(code + 65536) : String.fromCharCode(code);
  });
  // Replace \'XX hex escapes
  out = out.replace(/\\'([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // Convert paragraph markers to newlines
  out = out.replace(/\\par[d]?\b/g, "\n\n");
  out = out.replace(/\\line\b/g, "\n");
  out = out.replace(/\\tab\b/g, "\t");
  // Strip remaining control words
  out = out.replace(/\\[a-zA-Z]+-?\d* ?/g, "");
  // Remove braces
  out = out.replace(/[{}]/g, "");
  // Collapse whitespace
  out = out.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

function rtfEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    // Encode non-ASCII as unicode escapes
    .replace(/[\u0080-\uFFFF]/g, (c) => `\\u${c.charCodeAt(0)}?`);
}

function buildRtfFromEpub(epub: EpubData): Blob {
  const lines: string[] = [];
  lines.push("{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}");
  lines.push(`\\fs36\\b ${rtfEscape(epub.title)}\\b0\\fs24\\par\\par`);
  if (epub.metadata.creator) {
    lines.push(`\\i by ${rtfEscape(epub.metadata.creator)}\\i0\\par\\par`);
  }
  for (const chapter of epub.chapters) {
    lines.push("\\page");
    lines.push(`\\fs28\\b ${rtfEscape(chapter.title)}\\b0\\fs24\\par\\par`);
    const paragraphs = chapter.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    for (const p of paragraphs) {
      lines.push(`${rtfEscape(p)}\\par\\par`);
    }
  }
  lines.push("}");
  return new Blob([lines.join("\n")], { type: "application/rtf" });
}

// ───────────────────── FB2 (parse + build) ─────────────────────
function parseFb2(text: string): { title: string; chapters: { title: string; text: string }[] } {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const title =
    doc.querySelector("description > title-info > book-title")?.textContent?.trim() || "Untitled FictionBook";
  const sections = Array.from(doc.querySelectorAll("body > section"));
  const chapters = sections.length
    ? sections.map((s, i) => ({
        title: s.querySelector("title")?.textContent?.replace(/\s+/g, " ").trim() || `Section ${i + 1}`,
        text: Array.from(s.querySelectorAll("p")).map((p) => p.textContent?.trim() || "").filter(Boolean).join("\n\n"),
      }))
    : [{
        title: title,
        text: Array.from(doc.querySelectorAll("body p")).map((p) => p.textContent?.trim() || "").filter(Boolean).join("\n\n"),
      }];
  return { title, chapters };
}

function buildFb2FromEpub(epub: EpubData): Blob {
  const sections = epub.chapters
    .map(
      (chapter) => `
    <section>
      <title><p>${escapeXml(chapter.title)}</p></title>
${chapter.text
  .split(/\n{2,}/)
  .map((p) => p.trim())
  .filter(Boolean)
  .map((p) => `      <p>${escapeXml(p)}</p>`)
  .join("\n")}
    </section>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
  <description>
    <title-info>
      <genre>prose</genre>
      <author><nickname>${escapeXml(epub.metadata.creator || "Unknown")}</nickname></author>
      <book-title>${escapeXml(epub.title)}</book-title>
      <lang>${escapeXml(epub.metadata.language || "en")}</lang>
    </title-info>
    <document-info>
      <author><nickname>EPUBForge</nickname></author>
      <program-used>EPUBForge</program-used>
      <date value="${new Date().toISOString().slice(0, 10)}">${new Date().toISOString().slice(0, 10)}</date>
      <id>${crypto.randomUUID()}</id>
      <version>1.0</version>
    </document-info>
  </description>
  <body>
    <title><p>${escapeXml(epub.title)}</p></title>
${sections}
  </body>
</FictionBook>`;

  return new Blob([xml], { type: "application/x-fictionbook+xml" });
}

// ───────────────────── CBZ (comic ZIP) ─────────────────────
async function parseCbzImages(buffer: ArrayBuffer): Promise<{ name: string; mime: string; data: ArrayBuffer }[]> {
  const zip = await JSZip.loadAsync(buffer);
  const entries: { name: string; mime: string; data: ArrayBuffer }[] = [];
  const fileNames = Object.keys(zip.files)
    .filter((n) => /\.(jpe?g|png|gif|webp)$/i.test(n) && !zip.files[n].dir)
    .sort();
  for (const name of fileNames) {
    const file = zip.files[name];
    const ext = name.toLowerCase().split(".").pop() || "jpg";
    const mime =
      ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";
    entries.push({ name: name.split("/").pop() || name, mime, data: await file.async("arraybuffer") });
  }
  return entries;
}

async function imagesToEpubBlob(
  title: string,
  images: { name: string; mime: string; data: ArrayBuffer }[],
): Promise<Blob> {
  if (images.length === 0) throw new Error("No images found to package.");
  const cleanTitle = title.trim() || "Image Book";
  const identifier = `urn:uuid:${crypto.randomUUID()}`;
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const zip = new JSZip();

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`,
  );

  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const navItems: string[] = [];

  images.forEach((img, i) => {
    const idx = String(i + 1).padStart(4, "0");
    const ext = imageExtensions[img.mime] || "jpg";
    const imgName = `images/page-${idx}.${ext}`;
    const pageName = `page-${idx}.xhtml`;
    zip.file(`OEBPS/${imgName}`, img.data);
    zip.file(
      `OEBPS/${pageName}`,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head><title>Page ${i + 1}</title>
<style>body{margin:0;padding:0;}img{display:block;width:100%;height:auto;}</style>
</head>
<body><img src="${imgName}" alt="Page ${i + 1}"/></body>
</html>`,
    );
    manifestItems.push(`<item id="img${idx}" href="${imgName}" media-type="${img.mime}" />`);
    manifestItems.push(`<item id="page${idx}" href="${pageName}" media-type="application/xhtml+xml" />`);
    spineItems.push(`<itemref idref="page${idx}" />`);
    navItems.push(`<li><a href="${pageName}">Page ${i + 1}</a></li>`);
  });

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(cleanTitle)}</dc:title>
    <dc:creator>EPUBForge</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
    <meta property="rendition:layout">pre-paginated</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`,
  );

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head><title>${escapeXml(cleanTitle)}</title></head>
<body>
  <nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops">
    <h1>Pages</h1>
    <ol>${navItems.join("")}</ol>
  </nav>
</body>
</html>`,
  );

  return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}

/**
 * Properly extract structured HTML from a PDF using PDF.js.
 * Returns HTML with paragraphs, page breaks, and preserves text positioning context.
 */
/**
 * Extract PDF content as separate chapters (one per page), including embedded images.
 * Returns chapters and the images extracted from the PDF.
 */
async function extractPdfAsChapters(buffer: ArrayBuffer, onProgress?: (p: number) => void): Promise<{
  chapters: { title: string; html: string }[];
  images: { id: string; fileName: string; mime: string; data: ArrayBuffer }[];
}> {
  const data = new Uint8Array(buffer);
  const task = getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const pdf = await task.promise;
  const allImages: { id: string; fileName: string; mime: string; data: ArrayBuffer }[] = [];
  const pageHtmlMap = new Map<number, string>(); // 0-indexed page → HTML

  // ── Step 1: Read PDF outline/bookmarks to get real chapter structure ──
  type OutlineItem = { title: string; dest: string | unknown[] | null; items?: OutlineItem[] };
  let outline: OutlineItem[] = [];
  try {
    outline = (await pdf.getOutline() || []) as OutlineItem[];
  } catch {
    outline = [];
  }

  // Flatten the ENTIRE outline tree depth-first to capture all chapters/sections
  type FlatOutlineItem = { title: string; dest: string | unknown[] | null; depth: number };
  const flatOutline: FlatOutlineItem[] = [];
  const flattenOutline = (items: OutlineItem[], depth = 0) => {
    for (const item of items) {
      if (item.title) flatOutline.push({ title: item.title, dest: item.dest, depth });
      if (item.items?.length) flattenOutline(item.items, depth + 1);
    }
  };
  flattenOutline(outline);

  // Resolve each outline destination to a page number
  type OutlineWithPage = { title: string; pageIndex: number };
  const outlineWithPages: OutlineWithPage[] = [];
  for (const item of flatOutline) {
    if (!item.dest) continue;
    try {
      let dest = item.dest;
      if (typeof dest === "string") {
        dest = await pdf.getDestination(dest) as unknown[];
      }
      if (!Array.isArray(dest)) continue;
      const ref = dest[0];
      const pageIndex = await pdf.getPageIndex(ref as { num: number; gen: number });
      outlineWithPages.push({ title: item.title || `Section`, pageIndex });
    } catch {
      // skip unresolvable destinations
    }
  }

  // Sort outline by page (they should already be sorted, but be safe)
  outlineWithPages.sort((a, b) => a.pageIndex - b.pageIndex);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Timed out while reading a PDF image object.")), ms);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    if (onProgress) onProgress(Math.min(85, Math.floor((pageNum / pdf.numPages) * 85)));
    // Yield to UI to prevent hanging
    if (pageNum % 5 === 0) await new Promise(r => setTimeout(r, 0));
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // ── Extract images from the page by rendering it to canvas ──
    const pageHtmlParts: string[] = [];

    // Try to extract embedded images from PDF operator list
    try {
      const ops = await page.getOperatorList();
      const imgNames: string[] = [];
      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        // OPS.paintImageXObject = 85, OPS.paintInlineImageXObject = 86
        if (fn === 85 || fn === 86) {
          const args = ops.argsArray[i];
          if (args && args[0] && typeof args[0] === "string") imgNames.push(args[0]);
        }
      }

      for (const imgName of imgNames) {
        try {
          // Wait for image to be ready (objs is a promise-like store)
          const img: { width: number; height: number; data?: Uint8ClampedArray; bitmap?: ImageBitmap } = await withTimeout(new Promise((resolve, reject) => {
            const objs = page.objs as unknown as { get: (n: string, cb: (v: unknown) => void) => void };
            try {
              objs.get(imgName, (v: unknown) => resolve(v as { width: number; height: number; data?: Uint8ClampedArray; bitmap?: ImageBitmap }));
            } catch (e) {
              reject(e);
            }
          }), 1500);

          if (!img || !img.width || !img.height) continue;

          // Avoid freezing on huge vector/raster objects. If the object is very large,
          // downscale it before embedding so conversion can complete reliably.
          const maxPixels = 5_000_000;
          const scale = Math.min(1, Math.sqrt(maxPixels / Math.max(1, img.width * img.height)));
          const outWidth = Math.max(1, Math.floor(img.width * scale));
          const outHeight = Math.max(1, Math.floor(img.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = outWidth;
          canvas.height = outHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          if (img.bitmap) {
            ctx.drawImage(img.bitmap, 0, 0, outWidth, outHeight);
          } else if (img.data) {
            // Try to construct ImageData; channel count varies by PDF
            const channels = img.data.length / (img.width * img.height);
            const tmp = document.createElement("canvas");
            tmp.width = img.width;
            tmp.height = img.height;
            const tmpCtx = tmp.getContext("2d");
            if (!tmpCtx) continue;
            if (channels === 4) {
              const imageData = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
              tmpCtx.putImageData(imageData, 0, 0);
            } else if (channels === 3) {
              // RGB → expand to RGBA
              const rgba = new Uint8ClampedArray(img.width * img.height * 4);
              for (let p = 0, q = 0; p < img.data.length; p += 3, q += 4) {
                rgba[q] = img.data[p];
                rgba[q + 1] = img.data[p + 1];
                rgba[q + 2] = img.data[p + 2];
                rgba[q + 3] = 255;
              }
              const imageData = new ImageData(rgba, img.width, img.height);
              tmpCtx.putImageData(imageData, 0, 0);
            } else {
              continue;
            }
            ctx.drawImage(tmp, 0, 0, outWidth, outHeight);
            tmp.width = 0;
            tmp.height = 0;
          } else {
            continue;
          }

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
          if (!blob) continue;
          const id = `pdf-img-${allImages.length + 1}`;
          const fileName = `${id}.jpg`;
          allImages.push({ id, fileName, mime: "image/jpeg", data: await blob.arrayBuffer() });
          pageHtmlParts.push(`<p><img src="${id}" alt="Page ${pageNum} image" /></p>`);
          canvas.width = 0;
          canvas.height = 0;
        } catch {
          // Image extraction failed for this object — skip silently
        }
      }
    } catch {
      // Operator list failed — continue with text only
    }
    
    // Group text items into lines based on Y position
    type Item = { str: string; x: number; y: number; height: number; fontSize: number };
    const items: Item[] = [];
    
    for (const item of textContent.items) {
      const it = item as { str: string; transform: number[]; height: number };
      if (!it.str) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      const fontSize = Math.abs(it.transform[0]) || it.height || 10;
      items.push({ str: it.str, x, y, height: it.height || fontSize, fontSize });
    }

    if (items.length === 0 && pageHtmlParts.length === 0) continue;

    // Sort items top-to-bottom, left-to-right
    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.x - b.x;
    });

    // Group into lines
    const lines: Item[][] = [];
    let currentLine: Item[] = [];
    let lastY: number | null = null;
    
    for (const item of items) {
      if (lastY === null || Math.abs(item.y - lastY) <= 3) {
        currentLine.push(item);
      } else {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [item];
      }
      lastY = item.y;
    }
    if (currentLine.length > 0) lines.push(currentLine);

    const fontSizes = items.map(i => i.fontSize).filter(s => s > 0);
    const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length || 10;

    let paragraphBuffer: string[] = [];
    let lastLineY: number | null = null;
    let lastLineHeight = 0;

    const flushParagraph = () => {
      if (paragraphBuffer.length === 0) return;
      const text = paragraphBuffer.join(" ").replace(/\s+/g, " ").trim();
      if (text) pageHtmlParts.push(`<p>${escapeHtml(text)}</p>`);
      paragraphBuffer = [];
    };

    for (const line of lines) {
      let lineText = "";
      let prevX: number | null = null;
      let prevWidth = 0;
      for (const item of line) {
        if (prevX !== null) {
          const gap = item.x - (prevX + prevWidth);
          if (gap > item.fontSize * 0.2 && !lineText.endsWith(" ") && !item.str.startsWith(" ")) {
            lineText += " ";
          }
        }
        lineText += item.str;
        prevX = item.x;
        prevWidth = item.str.length * item.fontSize * 0.5;
      }
      lineText = lineText.replace(/\s+/g, " ").trim();
      if (!lineText) continue;

      const lineMaxFont = Math.max(...line.map(i => i.fontSize));
      const isHeading = lineMaxFont > avgFontSize * 1.3 && lineText.length < 100;

      if (lastLineY !== null) {
        const gap = lastLineY - line[0].y;
        if (gap > lastLineHeight * 1.6) flushParagraph();
      }

      if (isHeading) {
        flushParagraph();
        const level = lineMaxFont > avgFontSize * 1.8 ? 1 : lineMaxFont > avgFontSize * 1.5 ? 2 : 3;
        pageHtmlParts.push(`<h${level}>${escapeHtml(lineText)}</h${level}>`);
      } else {
        paragraphBuffer.push(lineText);
      }

      lastLineY = line[0].y;
      lastLineHeight = line[0].height || lineMaxFont;
    }
    flushParagraph();

    // Store per-page HTML (we will group into chapters after all pages are processed)
    pageHtmlMap.set(pageNum - 1, pageHtmlParts.join("\n")); // 0-indexed
  }

  // ── Step 2: Group pages into chapters using outline or heading detection ──
  const chapters: { title: string; html: string }[] = [];

  if (outlineWithPages.length > 0) {
    // Capture any pages before the first bookmark as front matter
    if (outlineWithPages[0]?.pageIndex > 0) {
      const frontParts: string[] = [];
      for (let p = 0; p < outlineWithPages[0].pageIndex; p++) {
        const pageContent = pageHtmlMap.get(p);
        if (pageContent) frontParts.push(pageContent);
      }
      if (frontParts.length > 0) {
        chapters.push({ title: "Front Matter", html: frontParts.join("\n") });
      }
    }

    // Use PDF bookmarks/outline as chapter boundaries.
    // Each bookmark gets all pages from its start up to the next bookmark's start.
    // If two bookmarks share the same page, the first gets only the shared page content
    // and the second starts fresh from the same page (avoids skipping).
    for (let i = 0; i < outlineWithPages.length; i++) {
      const chapterStart = outlineWithPages[i].pageIndex;
      const chapterEnd = i + 1 < outlineWithPages.length ? outlineWithPages[i + 1].pageIndex : pdf.numPages;

      // When two consecutive bookmarks share a page, still create an entry
      // but only include the page content once (in the first one)
      if (chapterStart === chapterEnd && i + 1 < outlineWithPages.length) {
        // Same page as next bookmark — create a chapter heading with the shared page content
        const pageContent = pageHtmlMap.get(chapterStart);
        chapters.push({
          title: outlineWithPages[i].title,
          html: pageContent || "",
        });
        // Mark it consumed so the next bookmark with same page starts empty
        pageHtmlMap.delete(chapterStart);
      } else {
        const htmlParts: string[] = [];
        for (let p = chapterStart; p < chapterEnd; p++) {
          const pageContent = pageHtmlMap.get(p);
          if (pageContent) htmlParts.push(pageContent);
        }
        chapters.push({
          title: outlineWithPages[i].title,
          html: htmlParts.join("\n") || "",
        });
      }
    }
  } else {
    // No outline — group pages by heading detection.
    // Scan every page for h1/h2 headings. Each one starts a new chapter.
    let currentTitle = "Content";
    let currentParts: string[] = [];
    let foundFirstHeading = false;

    for (let p = 0; p < pdf.numPages; p++) {
      const pageContent = pageHtmlMap.get(p);
      if (!pageContent) continue;

      // Find ALL h1/h2 headings on this page
      const headings = Array.from(pageContent.matchAll(/<h[12]>([^<]+)<\/h[12]>/g));
      
      if (headings.length > 0 && currentParts.length > 0) {
        // Save everything accumulated so far as the previous chapter
        chapters.push({ title: currentTitle, html: currentParts.join("\n") });
        currentTitle = headings[0][1].trim();
        currentParts = [pageContent];
        foundFirstHeading = true;
      } else if (headings.length > 0 && !foundFirstHeading) {
        // First heading encountered and nothing accumulated yet
        if (currentParts.length > 0) {
          chapters.push({ title: "Front Matter", html: currentParts.join("\n") });
          currentParts = [];
        }
        currentTitle = headings[0][1].trim();
        currentParts = [pageContent];
        foundFirstHeading = true;
      } else {
        currentParts.push(pageContent);
      }
    }

    // Push the last chapter
    if (currentParts.length > 0) {
      chapters.push({ title: currentTitle, html: currentParts.join("\n") });
    }
  }

  if (chapters.length === 0) {
    chapters.push({ title: "Content", html: "<p>No readable text was extracted from this PDF.</p>" });
  }

  return { chapters, images: allImages };
}

/**
 * Render every PDF page into a high-quality image and extract them.
 * Used to embed visual fidelity into EPUB/AZW3/MOBI conversions.
 */
async function renderPdfPagesToImages(buffer: ArrayBuffer, onProgress?: (p: number) => void): Promise<{ name: string; mime: string; data: ArrayBuffer }[]> {
  const data = new Uint8Array(buffer);
  const task = getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const pdf = await task.promise;
  const pages: { name: string; mime: string; data: ArrayBuffer }[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    if (onProgress) onProgress(Math.floor((pageNumber / pdf.numPages) * 100));
    // Yield to UI
    if (pageNumber % 2 === 0) await new Promise(r => setTimeout(r, 0));

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 }); // Lower scale for performance on large files
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas not available.");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render PDF page."))), "image/jpeg", 0.92);
    });
    pages.push({
      name: `page-${String(pageNumber).padStart(4, "0")}.jpg`,
      mime: "image/jpeg",
      data: await blob.arrayBuffer(),
    });
  }

  return pages;
}

function mimeForExtension(extension: string) {
  if (extension === "epub") return "application/epub+zip";
  if (extension === "html") return "text/html;charset=utf-8";
  if (extension === "md") return "text/markdown;charset=utf-8";
  if (extension === "json") return "application/json;charset=utf-8";
  return "text/plain;charset=utf-8";
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

type ConversionResult = {
  blob: Blob;
  fileName: string;
  preview: string;
  summary: string;
};

async function convertOne(file: File, toolId: ToolId, detectedExt?: string, onProgress?: (p: number) => void): Promise<ConversionResult> {
  const tool = tools.find((t) => t.id === toolId);
  if (!tool) throw new Error("Unknown tool selected.");
  const extension = detectedExt || getExtension(file.name);
  if (!tool.accepts.includes(extension)) {
    throw new Error(`${tool.name} expects ${tool.input}, but received .${extension || "unknown"}.`);
  }

  const name = slug(baseName(file.name));

  if (extension === "epub") {
    const epub = await parseEpub(await file.arrayBuffer());
    const words = countWords(epub.chapters.map((c) => c.text).join(" "));

    if (toolId === "epub-txt") {
      const text = buildCombinedText(epub);
      return {
        blob: new Blob([text], { type: mimeForExtension("txt") }),
        fileName: `${name}.txt`,
        preview: text.slice(0, 1800),
        summary: `${epub.chapters.length} chapters · ${words.toLocaleString()} words`,
      };
    }
    if (toolId === "epub-html") {
      const html = await buildCombinedHtml(epub);
      return {
        blob: new Blob([html], { type: mimeForExtension("html") }),
        fileName: `${name}.html`,
        preview: stripHtml(html).slice(0, 1800),
        summary: `HTML · ${epub.chapters.length} chapters · ${epub.images.size} images`,
      };
    }
    if (toolId === "epub-md") {
      const md = buildMarkdown(epub);
      return {
        blob: new Blob([md], { type: mimeForExtension("md") }),
        fileName: `${name}.md`,
        preview: md.slice(0, 1800),
        summary: `Markdown with ${epub.chapters.length} sections`,
      };
    }
    if (toolId === "epub-json") {
      const report = {
        title: epub.title,
        metadata: epub.metadata,
        chapters: epub.chapters.map((c) => ({ title: c.title, href: c.href, words: countWords(c.text) })),
        totals: { chapters: epub.chapters.length, words, hasCover: Boolean(epub.cover) },
      };
      const json = JSON.stringify(report, null, 2);
      return {
        blob: new Blob([json], { type: mimeForExtension("json") }),
        fileName: `${name}-report.json`,
        preview: json.slice(0, 1800),
        summary: `Metadata report · ${words.toLocaleString()} words`,
      };
    }
    if (toolId === "epub-cover") {
      if (!epub.cover) throw new Error("No cover image was declared in this EPUB manifest.");
      const ext = imageExtensions[epub.cover.mime] || getExtension(epub.cover.name) || "img";
      return {
        blob: new Blob([epub.cover.data], { type: epub.cover.mime }),
        fileName: `${name}-cover.${ext}`,
        preview: `Cover: ${epub.cover.name}\nType: ${epub.cover.mime}\nSize: ${epub.cover.data.byteLength.toLocaleString()} bytes`,
        summary: `Cover image · ${epub.cover.mime}`,
      };
    }
    if (toolId === "epub-chapters") {
      const zip = new JSZip();
      epub.chapters.forEach((chapter, index) => {
        zip.file(
          `${String(index + 1).padStart(3, "0")}-${slug(chapter.title)}.txt`,
          `${chapter.title}\n\n${chapter.text}`,
        );
      });
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/zip" });
      return {
        blob,
        fileName: `${name}-chapters.zip`,
        preview: epub.chapters.map((c, i) => `${i + 1}. ${c.title}`).join("\n"),
        summary: `${epub.chapters.length} chapter files in ZIP`,
      };
    }
    if (toolId === "epub-clean") {
      const cleanHtml = textToHtml(buildCombinedText(epub).replace(/^# .+\n*/, ""));
      const blob = await createEpubBlob(epub.title, cleanHtml, epub.metadata.creator || "Unknown author");
      return {
        blob,
        fileName: `${name}-clean.epub`,
        preview: buildCombinedText(epub).slice(0, 1800),
        summary: `Clean rebuilt EPUB · ${words.toLocaleString()} words`,
      };
    }
    if (toolId === "epub-pdf") {
      const blob = await buildPdfFromEpub(epub);
      return {
        blob,
        fileName: `${name}.pdf`,
        preview: buildCombinedText(epub).slice(0, 1800),
        summary: `PDF · ${epub.chapters.length} chapters · ${epub.images.size} images`,
      };
    }
    if (toolId === "epub-docx") {
      const blob = await buildDocxFromEpub(epub);
      return {
        blob,
        fileName: `${name}.docx`,
        preview: buildCombinedText(epub).slice(0, 1800),
        summary: `DOCX · ${epub.chapters.length} chapters · ${words.toLocaleString()} words`,
      };
    }
    if (toolId === "epub-rtf") {
      const blob = buildRtfFromEpub(epub);
      return {
        blob,
        fileName: `${name}.rtf`,
        preview: buildCombinedText(epub).slice(0, 1800),
        summary: `RTF · ${epub.chapters.length} chapters · ${words.toLocaleString()} words`,
      };
    }
    if (toolId === "epub-fb2") {
      const blob = buildFb2FromEpub(epub);
      return {
        blob,
        fileName: `${name}.fb2`,
        preview: buildCombinedText(epub).slice(0, 1800),
        summary: `FB2 · ${epub.chapters.length} chapters · ${words.toLocaleString()} words`,
      };
    }
    if (toolId === "epub-mobi" || toolId === "epub-azw3") {
      // Produce a Kindle-friendly EPUB by repackaging the original chapters with their images intact.
      const combinedHtml = epub.chapters
        .map((chapter) => rewriteImageSrc(getBodyHtml(chapter.html), chapter.href, epub.images))
        .join("\n");
      // Convert blob URLs back to embedded image references for Kindle compatibility
      const kindleImages: { id: string; fileName: string; mime: string; data: ArrayBuffer }[] = [];
      let imgIndex = 1;
      let processedHtml = combinedHtml;
      for (const [path, imgData] of epub.images.entries()) {
        const ext = imageExtensions[imgData.blob.type] || "jpg";
        const fileName = `kindle-img-${imgIndex}.${ext}`;
        const id = `kindle-img-${imgIndex}`;
        const buffer = await imgData.blob.arrayBuffer();
        kindleImages.push({ id, fileName, mime: imgData.blob.type || "image/jpeg", data: buffer });
        const escapedUrl = imgData.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        processedHtml = processedHtml.replace(new RegExp(`(src|href)=["']${escapedUrl}["']`, "g"), `$1="images/${fileName}"`);
        // Also fix path-based references
        const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        processedHtml = processedHtml.replace(new RegExp(`(src|href)=["'][^"']*${escapedPath}["']`, "g"), `$1="images/${fileName}"`);
        imgIndex++;
      }
      const blob = await createEpubBlob(epub.title, processedHtml, epub.metadata.creator || "", kindleImages);
      const ext = toolId === "epub-mobi" ? "mobi" : "azw3";
      return {
        blob,
        fileName: `${name}.${ext}`,
        preview: buildCombinedText(epub).slice(0, 1800),
        summary: `Kindle-ready package · ${words.toLocaleString()} words · use Send to Kindle`,
      };
    }
  } else {
    let bodyHtml = "";
    let title = baseName(file.name);
    let embeddedImages: { id: string; fileName: string; mime: string; data: ArrayBuffer }[] = [];

    // ── Image inputs (JPG / PNG) → fixed-layout EPUB ──
    if (toolId === "jpg-epub" || toolId === "png-epub") {
      const mime = toolId === "png-epub" ? "image/png" : "image/jpeg";
      const data = await file.arrayBuffer();
      const blob = await imagesToEpubBlob(title, [{ name: file.name, mime, data }]);
      return {
        blob,
        fileName: `${name}.epub`,
        preview: `Embedded 1 image (${formatBytes(data.byteLength)}) into a fixed-layout EPUB.`,
        summary: `Fixed-layout EPUB · 1 page`,
      };
    }

    // ── CBZ → fixed-layout EPUB ──
    if (toolId === "cbz-epub") {
      const buffer = await file.arrayBuffer();
      const images = await parseCbzImages(buffer);
      const blob = await imagesToEpubBlob(title, images);
      return {
        blob,
        fileName: `${name}.epub`,
        preview: `Packed ${images.length} comic page${images.length === 1 ? "" : "s"} into a fixed-layout EPUB.`,
        summary: `Fixed-layout EPUB · ${images.length} pages`,
      };
    }

    // ── PDF → EPUB: one chapter per page, with embedded images ──
    if (toolId === "pdf-epub") {
      try {
        const buffer = await file.arrayBuffer();
        const result = await extractPdfAsChapters(buffer, onProgress);
        if (onProgress) onProgress(88);
        const blob = await createMultiChapterEpubBlob(title, result.chapters, "", result.images, (p) => {
          if (onProgress) onProgress(88 + Math.floor(p * 0.11));
        });
        return {
          blob,
          fileName: `${name}.epub`,
          preview: result.chapters.map((c) => stripHtml(c.html)).join("\n\n").slice(0, 1800),
          summary: `EPUB · ${result.chapters.length} page${result.chapters.length === 1 ? "" : "s"}${result.images.length > 0 ? ` · ${result.images.length} image${result.images.length === 1 ? "" : "s"}` : ""}`,
        };
      } catch (err) {
        console.warn("PDF.js extraction failed, trying page-image fallback", err);
        try {
          const buffer = await file.arrayBuffer();
          const pages = await renderPdfPagesToImages(buffer, onProgress);
          const fallbackImages = pages.map((p, i) => ({
            id: `pdf-page-${i + 1}`,
            fileName: p.name,
            mime: p.mime,
            data: p.data,
          }));
          const fallbackChapters = pages.map((_, i) => ({
            title: `Page ${i + 1}`,
            html: `<p><img src="${fallbackImages[i].id}" alt="Page ${i + 1}" /></p>`,
          }));
          if (onProgress) onProgress(88);
          const blob = await createMultiChapterEpubBlob(title, fallbackChapters, "", fallbackImages, (p) => {
            if (onProgress) onProgress(88 + Math.floor(p * 0.11));
          });
          return {
            blob,
            fileName: `${name}.epub`,
            preview: `${pages.length} PDF pages rendered as images.`,
            summary: `EPUB · ${pages.length} page${pages.length === 1 ? "" : "s"} (image-based)`,
          };
        } catch (err2) {
          console.error("PDF page rendering also failed", err2);
          bodyHtml = "<p>Could not extract content from this PDF.</p>";
        }
      }
    } else if (toolId === "docx-epub") {
      const buffer = await file.arrayBuffer();
      const parsed = await parseDocxToHtmlWithImages(buffer, onProgress);
      bodyHtml = parsed.html;
      embeddedImages = parsed.images;
    } else if (toolId === "rtf-epub") {
      bodyHtml = textToHtml(parseRtf(await file.text()));
    } else if (toolId === "fb2-epub") {
      const text = await file.text();
      const parsed = parseFb2(text);
      title = parsed.title || title;
      bodyHtml = parsed.chapters
        .map((c) => `<h2>${escapeHtml(c.title)}</h2>${textToHtml(c.text)}`)
        .join("\n");
    } else if (toolId === "txt-epub") {
      bodyHtml = textToHtml(await file.text());
    } else if (toolId === "html-epub") {
      const text = await file.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      title = doc.querySelector("title, h1")?.textContent?.trim() || title;
      bodyHtml = getBodyHtml(text);
      embeddedImages = await extractEmbeddedImagesFromHtml(bodyHtml);
    } else if (toolId === "md-epub") {
      const text = await file.text();
      title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || title;
      bodyHtml = markdownToHtml(text);
    } else if (toolId === "ppt-epub") {
      // PPTX → one chapter per slide, with text and images in document order.
      try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const slideFiles = Object.keys(zip.files)
          .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
          .sort((a, b) => {
            const an = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
            const bn = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
            return an - bn;
          });

        if (slideFiles.length > 0) {
          const slideChapters: { title: string; html: string }[] = [];
          const slideImages: { id: string; fileName: string; mime: string; data: ArrayBuffer }[] = [];
          let imageIndex = 1;
          const seenImages = new Map<string, string>(); // mediaPath -> imageId

          for (let i = 0; i < slideFiles.length; i++) {
            const sf = slideFiles[i];
            const slideNum = i + 1;
            const xml = await zip.file(sf)!.async("string");
            const doc = new DOMParser().parseFromString(xml, "application/xml");

            // Read slide relationships
            const relPath = sf.replace(/slide(\d+)\.xml$/, "_rels/slide$1.xml.rels");
            const relXml = await zip.file(relPath)?.async("string");
            const rels = new Map<string, string>();
            if (relXml) {
              const relDoc = new DOMParser().parseFromString(relXml, "application/xml");
              for (const rel of Array.from(relDoc.getElementsByTagName("Relationship"))) {
                const id = rel.getAttribute("Id") || "";
                const target = rel.getAttribute("Target") || "";
                if (id && target) rels.set(id, target);
              }
            }

            const slideParts: string[] = [];

            // Extract text in document order
            const textElements = Array.from(doc.getElementsByTagName("a:p"));
            for (const para of textElements) {
              const text = Array.from(para.getElementsByTagName("a:t"))
                .map((t) => t.textContent || "")
                .join("")
                .trim();
              if (text) slideParts.push(`<p>${escapeHtml(text)}</p>`);
            }

            // Images referenced by this slide
            const blips = Array.from(doc.getElementsByTagName("a:blip"));
            for (const blip of blips) {
              const embedId = blip.getAttribute("r:embed") || blip.getAttribute("embed") || "";
              const target = rels.get(embedId);
              if (!target) continue;
              const mediaPath = target.replace(/^\.\.\//, "ppt/");
              let imgId = seenImages.get(mediaPath);
              if (!imgId) {
                const fileObj = zip.file(mediaPath);
                if (!fileObj) continue;
                const ext = mediaPath.split(".").pop()?.toLowerCase() || "png";
                const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
                imgId = `ppt-img-${imageIndex++}`;
                const fileName = `${imgId}.${ext}`;
                slideImages.push({ id: imgId, fileName, mime, data: await fileObj.async("arraybuffer") });
                seenImages.set(mediaPath, imgId);
              }
              slideParts.push(`<p><img src="${imgId}" alt="Slide ${slideNum} image" /></p>`);
            }

            if (slideParts.length === 0) {
              slideParts.push(`<p><em>(empty slide)</em></p>`);
            }

            slideChapters.push({
              title: `Slide ${slideNum}`,
              html: slideParts.join("\n"),
            });
          }

          const blob = await createMultiChapterEpubBlob(title, slideChapters, "", slideImages, onProgress);
          return {
            blob,
            fileName: `${name}.epub`,
            preview: slideChapters.map((c) => `${c.title}\n${stripHtml(c.html)}`).join("\n\n").slice(0, 1800),
            summary: `EPUB · ${slideChapters.length} slide${slideChapters.length === 1 ? "" : "s"}${slideImages.length > 0 ? ` · ${slideImages.length} image${slideImages.length === 1 ? "" : "s"}` : ""}`,
          };
        } else {
          bodyHtml = textToHtml(extractTextFromBinary(await file.arrayBuffer()));
        }
      } catch (err) {
        console.warn("PPTX parsing failed", err);
        bodyHtml = textToHtml(extractTextFromBinary(await file.arrayBuffer()));
      }
    } else {
      // Best-effort binary text extraction for proprietary formats:
      // mobi-epub, azw3-epub, azw-epub, azw4-epub, prc-epub, pdb-epub,
      // lit-epub, lrf-epub, chm-epub, djvu-epub, cbr-epub
      bodyHtml = textToHtml(extractTextFromBinary(await file.arrayBuffer()));
    }

    const blob = await createEpubBlob(title, bodyHtml, "Created in EPUBForge", embeddedImages);
    return {
      blob,
      fileName: `${name}.epub`,
      preview: stripHtml(bodyHtml).slice(0, 1800),
      summary: `EPUB created from ${tool.input} input`,
    };
  }

  throw new Error("This tool is not implemented.");
}

type JobStatus = "queued" | "processing" | "done" | "error" | "skipped";

type Job = {
  id: string;
  file: File;
  tool: ToolId;
  status: JobStatus;
  progress: number; // 0-100
  result?: ConversionResult;
  error?: string;
  detectedExt?: string;
  detectedFormat?: string;
  parsedEpub?: EpubData; // cache parsed EPUB data for instant viewing
};

async function detectFileFormat(file: File): Promise<{ ext: string; label: string }> {
  const headerBytes = await file.slice(0, 8192).arrayBuffer();
  const arr = new Uint8Array(headerBytes);
  const ext = getExtension(file.name);

  // Helper to check magic bytes
  const check = (sig: number[], offset = 0) => {
    if (arr.length < sig.length + offset) return false;
    for (let i = 0; i < sig.length; i++) {
      if (arr[offset + i] !== sig[i]) return false;
    }
    return true;
  };

  // PDF: %PDF (25 50 44 46)
  if (check([0x25, 0x50, 0x44, 0x46])) {
    return { ext: "pdf", label: "PDF Document" };
  }

  // RTF: {\rtf (7B 5C 72 74 66)
  if (check([0x7B, 0x5C, 0x72, 0x74, 0x66])) {
    return { ext: "rtf", label: "Rich Text Document (RTF)" };
  }

  // PNG: 89 50 4E 47
  if (check([0x89, 0x50, 0x4E, 0x47])) {
    return { ext: "png", label: "PNG Image" };
  }

  // JPG: FF D8
  if (check([0xFF, 0xD8])) {
    return { ext: "jpg", label: "JPEG Image" };
  }

  // ZIP-based containers: PK\x03\x04 (50 4B 03 04)
  if (check([0x50, 0x4B, 0x03, 0x04])) {
    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames = Object.keys(zip.files);

      // EPUB: mimetype is usually first and contains "application/epub+zip"
      if (fileNames.includes("mimetype")) {
        const content = await zip.file("mimetype")?.async("string");
        if (content?.includes("application/epub+zip")) {
          return { ext: "epub", label: "EPUB Ebook" };
        }
      }

      // Check for OPF file or container.xml which designates EPUB
      if (fileNames.includes("META-INF/container.xml") || fileNames.some((f) => f.endsWith(".opf"))) {
        return { ext: "epub", label: "EPUB Ebook" };
      }

      // DOCX: word/document.xml
      if (fileNames.includes("word/document.xml")) {
        return { ext: "docx", label: "Microsoft Word (DOCX)" };
      }

      // PPTX: ppt/presentation.xml
      if (fileNames.includes("ppt/presentation.xml") || fileNames.includes("ppt/slides/slide1.xml")) {
        return { ext: "pptx", label: "PowerPoint Slide (PPTX)" };
      }

      // CBZ: containing mostly images
      const imgCount = fileNames.filter((n) => /\.(jpe?g|png|gif|webp)$/i.test(n)).length;
      if (imgCount > 0 && imgCount / fileNames.length > 0.4) {
        return { ext: "cbz", label: "Comic Book ZIP (CBZ)" };
      }
    } catch {
      /* skip error, fallback to extension */
    }
  }

  // MOBI: BOOKMOBI header at offset 60 (0x3C)
  if (check([0x42, 0x4F, 0x4F, 0x4B, 0x4D, 0x4F, 0x42, 0x49], 60)) {
    return { ext: "mobi", label: "Kindle MOBI Ebook" };
  }

  // OLE Document (PPT legacy): D0 CF 11 E0 A1 B1 1A E1
  if (check([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) {
    if (ext === "ppt") return { ext: "ppt", label: "Legacy PowerPoint (PPT)" };
    if (ext === "doc") return { ext: "doc", label: "Legacy Word (DOC)" };
  }

  // Text scanning fallback: FB2, HTML, MD, TXT
  const textDecoded = new TextDecoder("utf-8", { fatal: false }).decode(arr.slice(0, 2048));
  if (textDecoded.includes("<FictionBook")) {
    return { ext: "fb2", label: "FictionBook (FB2)" };
  }
  if (textDecoded.includes("<!DOCTYPE html") || textDecoded.includes("<html") || textDecoded.includes("<body")) {
    return { ext: "html", label: "HTML Document" };
  }
  if (/^#{1,6}\s/m.test(textDecoded) || /\[.*\]\(.*\)/.test(textDecoded)) {
    return { ext: "md", label: "Markdown Document" };
  }

  // Fallback to file extension mapping if magic bytes are ambiguous
  const labels: Record<string, string> = {
    epub: "EPUB Ebook",
    pdf: "PDF Document",
    docx: "Word Document (DOCX)",
    rtf: "Rich Text (RTF)",
    fb2: "FictionBook (FB2)",
    mobi: "Kindle MOBI Ebook",
    azw3: "Kindle KF8 Ebook (AZW3)",
    azw: "Kindle Ebook (AZW)",
    azw4: "Kindle Print Replica (AZW4)",
    prc: "Palm PRC Ebook",
    pdb: "Palm Database (PDB)",
    lit: "Microsoft Reader (LIT)",
    lrf: "Sony Reader (LRF)",
    chm: "Compiled HTML Help (CHM)",
    djvu: "DjVu Document",
    djv: "DjVu Document",
    cbz: "Comic Book ZIP (CBZ)",
    cbr: "Comic Book RAR (CBR)",
    jpg: "JPEG Image",
    jpeg: "JPEG Image",
    png: "PNG Image",
    ppt: "PowerPoint Slide (PPT)",
    pptx: "PowerPoint Slide (PPTX)",
    txt: "Plain Text (TXT)",
    text: "Plain Text (TXT)",
    html: "HTML Document",
    htm: "HTML Document",
    xhtml: "XHTML Document",
    md: "Markdown Document",
    markdown: "Markdown Document",
  };

  return { ext: ext || "txt", label: labels[ext] || `File (.${ext || "unknown"})` };
}

function inferTool(extension: string, preferred?: ToolId): ToolId {
  if (preferred) {
    const t = tools.find((x) => x.id === preferred);
    if (t && t.accepts.includes(extension)) return preferred;
  }
  const match = tools.find((t) => t.accepts.includes(extension));
  return match ? match.id : "epub-txt";
}

type LocaleCode = "en" | "ar" | "de" | "id" | "it" | "ja" | "ko" | "pl" | "pt" | "ru" | "tr" | "uk" | "vi" | "zh";

type UiText = {
  localeLabel: string;
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDesc: string;
  stat1: string;
  stat2: string;
  stat3: string;
  uploadQueue: string;
  dropBrowse: string;
  dropHelp: string;
  defaultTool: string;
  convertFiles: string;
  downloadReady: string;
  clear: string;
  overallProgress: string;
  queueTitle: string;
  queueDescEmpty: string;
  queueDescFilled: string;
  noFiles: string;
  noFilesHint: string;
  toolLabel: string;
  detected: string;
  download: string;
  remove: string;
  readEbook: string;
  preview: string;
  faqTitle: string;
  footer: string;
  skipToContent: string;
  // Suite / catalog
  catalogBadge: string;
  catalogTitle: string;
  catalogDesc: string;
  extractFrom: string;
  buildFrom: string;
  // Status
  statusDone: string;
  statusError: string;
  statusWorking: string;
  statusNoTool: string;
  statusQueued: string;
  doneCount: string;
  errorCount: string;
  pendingCount: string;
  // FAQ Q&A
  faqQ1: string; faqA1: string;
  faqQ2: string; faqA2: string;
  faqQ3: string; faqA3: string;
  faqQ4: string; faqA4: string;
  faqQ5: string; faqA5: string;
  faqQ6: string; faqA6: string;
  // Misc
  noMatchingTool: string;
  copyrightNotice: string;
};

const localeOptions: { code: LocaleCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
  { code: "id", label: "English Indonesia" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "pl", label: "Polski" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "uk", label: "Українська" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh", label: "中文" },
];

const uiTranslations: Partial<Record<LocaleCode, Partial<UiText>>> = {
  en: {
    localeLabel: "Language",
    heroBadge: `${tools.length} Local-first converter tools`,
    heroTitle1: "Convert ebooks",
    heroTitle2: "in your browser.",
    heroDesc: "Drop a folder of ebooks or a single manuscript. EPUBForge converts EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, MD, CBZ, JPG/PNG and more — in bulk, with per-file progress and on-demand download.",
    stat1: "Bulk batch queue",
    stat2: "Per-file progress",
    stat3: "Manual download",
    uploadQueue: "Upload & queue",
    dropBrowse: "Drop files or browse",
    dropHelp: "Bulk supported. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG, and more. All processing happens in this tab.",
    defaultTool: "Default tool for new files",
    convertFiles: "Convert files",
    downloadReady: "Download ready",
    clear: "Clear",
    overallProgress: "Overall progress",
    queueTitle: "Conversion queue",
    queueDescEmpty: "Add ebooks above to start a batch.",
    queueDescFilled: "Each file converts independently. Pick a per-file tool, then download when ready.",
    noFiles: "No files in the queue yet.",
    noFilesHint: "Drop multiple ebooks or click Drop files or browse above.",
    toolLabel: "Tool",
    detected: "Auto-detected",
    download: "Download",
    remove: "Remove",
    readEbook: "Read Ebook",
    preview: "Show output preview",
    faqTitle: "Frequently asked questions",
    footer: "EPUBForge — free local EPUB converter. Convert EPUB to PDF, PDF to EPUB, TXT, HTML, and Markdown directly in your browser.",
    skipToContent: "Skip to main content",
    catalogBadge: "Tool catalog",
    catalogTitle: `Dual pipeline. ${tools.length} modules.`,
    catalogDesc: "Convert reflowable content between document types — every job stays in this browser tab.",
    extractFrom: "Extract from EPUB",
    buildFrom: "Build EPUB from",
    statusDone: "Ready",
    statusError: "Error",
    statusWorking: "Working",
    statusNoTool: "No tool",
    statusQueued: "Queued",
    doneCount: "done",
    errorCount: "error",
    pendingCount: "pending",
    faqQ1: "How do I convert EPUB to PDF for free?",
    faqA1: "Drop an .epub file into the queue, choose EPUB to PDF, then click Convert and Download. EPUBForge produces a paginated PDF with chapter titles and reflowed text.",
    faqQ2: "Can I convert PDF, TXT, HTML, or Markdown into EPUB?",
    faqA2: "Yes. Use the PDF to EPUB, TXT to EPUB, HTML to EPUB, or Markdown to EPUB tool to wrap your manuscript in a valid EPUB 3 package.",
    faqQ3: "Are my files uploaded to a server?",
    faqA3: "No. EPUBForge runs entirely in your browser. Files never leave your device — there is no upload, queue, or tracking pixel involved.",
    faqQ4: "Can I batch-convert dozens of ebooks at once?",
    faqA4: "Yes. Drop multiple files at the same time. Each file gets a per-file tool selector, progress bar, and download button.",
    faqQ5: "Which file types does EPUBForge support?",
    faqA5: "Inputs: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML, and Markdown. Outputs: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, TXT, HTML, Markdown, JSON metadata, cover images, and chapter ZIPs.",
    faqQ6: "Does it work on mobile?",
    faqA6: "Yes. EPUBForge is a fully responsive Progressive Web App and runs on modern mobile browsers including iOS Safari and Android Chrome.",
    noMatchingTool: "No matching tool",
    copyrightNotice: "Runs fully offline after load.",
  },
  de: {
    localeLabel: "Sprache",
    heroBadge: `${tools.length} lokale Konverter`,
    heroTitle1: "E-Books konvertieren",
    heroTitle2: "direkt im Browser.",
    heroDesc: "Lade einen Ordner voller E-Books oder ein einzelnes Manuskript hoch. EPUBForge konvertiert EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG und mehr — im Stapel mit Fortschritt pro Datei und manuellem Download.",
    stat1: "Stapelverarbeitung",
    stat2: "Fortschritt pro Datei",
    stat3: "Manueller Download",
    uploadQueue: "Hochladen & Warteschlange",
    dropBrowse: "Dateien ablegen oder auswählen",
    dropHelp: "Mehrere Dateien werden unterstützt. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG und mehr.",
    defaultTool: "Standardwerkzeug für neue Dateien",
    convertFiles: "Dateien konvertieren",
    downloadReady: "Bereit zum Download",
    clear: "Leeren",
    overallProgress: "Gesamtfortschritt",
    queueTitle: "Konvertierungswarteschlange",
    queueDescEmpty: "Füge oben E-Books hinzu, um zu starten.",
    queueDescFilled: "Jede Datei wird separat konvertiert. Wähle pro Datei ein Werkzeug und lade dann herunter.",
    noFiles: "Noch keine Dateien in der Warteschlange.",
    noFilesHint: "Lege mehrere E-Books ab oder klicke oben auf Dateien ablegen oder auswählen.",
    toolLabel: "Werkzeug",
    detected: "Erkannt",
    download: "Herunterladen",
    remove: "Entfernen",
    readEbook: "E-Book lesen",
    preview: "Ausgabevorschau anzeigen",
    faqTitle: "Häufig gestellte Fragen",
    footer: "EPUBForge — kostenloser lokaler EPUB-Konverter. EPUB zu PDF, PDF zu EPUB, TXT, HTML und Markdown direkt im Browser.",
  },
  id: {
    localeLabel: "Bahasa",
    heroBadge: `${tools.length} alat konverter lokal`,
    heroTitle1: "Konversi ebook",
    heroTitle2: "langsung di browser.",
    heroDesc: "Unggah folder ebook atau satu naskah. EPUBForge mengubah EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG, dan lainnya — secara batch, dengan progres per file dan unduhan manual.",
    stat1: "Antrian batch",
    stat2: "Progres per file",
    stat3: "Unduhan manual",
    uploadQueue: "Unggah & antrekan",
    dropBrowse: "Tarik file atau pilih",
    dropHelp: "Mendukung banyak file. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG, dan lainnya.",
    defaultTool: "Alat default untuk file baru",
    convertFiles: "Konversi file",
    downloadReady: "Unduhan siap",
    clear: "Bersihkan",
    overallProgress: "Progres keseluruhan",
    queueTitle: "Antrean konversi",
    queueDescEmpty: "Tambahkan ebook di atas untuk memulai batch.",
    queueDescFilled: "Setiap file dikonversi secara terpisah. Pilih alat untuk tiap file lalu unduh saat siap.",
    noFiles: "Belum ada file di antrean.",
    noFilesHint: "Tarik beberapa ebook atau klik Tarik file atau pilih di atas.",
    toolLabel: "Alat",
    detected: "Terdeteksi otomatis",
    download: "Unduh",
    remove: "Hapus",
    readEbook: "Baca Ebook",
    preview: "Tampilkan pratinjau",
    faqTitle: "Pertanyaan umum",
    footer: "EPUBForge — konverter EPUB lokal gratis. Ubah EPUB ke PDF, PDF ke EPUB, TXT, HTML, dan Markdown langsung di browser.",
  },
  it: { localeLabel: "Lingua", heroBadge: `${tools.length} strumenti locali`, heroTitle1: "Converti ebook", heroTitle2: "nel browser.", heroDesc: "Carica una cartella di ebook o un singolo manoscritto. EPUBForge converte EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG e altro, in batch con avanzamento per file e download manuale.", stat1: "Coda batch", stat2: "Progresso per file", stat3: "Download manuale", uploadQueue: "Carica e metti in coda", dropBrowse: "Trascina file o seleziona", dropHelp: "Supporta più file. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG e altro.", defaultTool: "Strumento predefinito", convertFiles: "Converti file", downloadReady: "Download pronto", clear: "Pulisci", overallProgress: "Progresso totale", queueTitle: "Coda di conversione", queueDescEmpty: "Aggiungi ebook sopra per iniziare.", queueDescFilled: "Ogni file viene convertito separatamente. Scegli uno strumento per file e scarica quando pronto.", noFiles: "Nessun file in coda.", noFilesHint: "Trascina più ebook o clicca sopra.", toolLabel: "Strumento", detected: "Rilevato", download: "Scarica", remove: "Rimuovi", readEbook: "Leggi ebook", preview: "Mostra anteprima", faqTitle: "Domande frequenti", footer: "EPUBForge — convertitore EPUB locale gratuito. Converti EPUB in PDF, PDF in EPUB, TXT, HTML e Markdown nel browser." },
  ja: { localeLabel: "言語", heroBadge: `${tools.length} 個のローカル変換ツール`, heroTitle1: "電子書籍を変換", heroTitle2: "ブラウザ上で。", heroDesc: "電子書籍のフォルダや原稿をアップロード。EPUBForge は EPUB ↔ PDF、MOBI、AZW3、DOCX、RTF、FB2、HTML、Markdown、CBZ、JPG/PNG などを一括変換し、各ファイルの進行状況と手動ダウンロードを提供します。", stat1: "一括キュー", stat2: "ファイルごとの進行", stat3: "手動ダウンロード", uploadQueue: "アップロードとキュー", dropBrowse: "ファイルをドロップまたは選択", dropHelp: "複数ファイル対応。EPUB、PDF、DOCX、RTF、FB2、MOBI、AZW3、HTML、MD、CBZ、JPG/PNG など。", defaultTool: "新規ファイルの既定ツール", convertFiles: "ファイルを変換", downloadReady: "ダウンロード可能", clear: "クリア", overallProgress: "全体の進行状況", queueTitle: "変換キュー", queueDescEmpty: "上で電子書籍を追加して開始してください。", queueDescFilled: "各ファイルは個別に変換されます。ファイルごとにツールを選び、完了後にダウンロードしてください。", noFiles: "まだキューにファイルがありません。", noFilesHint: "複数の電子書籍をドロップするか、上のボタンをクリックしてください。", toolLabel: "ツール", detected: "自動検出", download: "ダウンロード", remove: "削除", readEbook: "電子書籍を読む", preview: "出力プレビューを表示", faqTitle: "よくある質問", footer: "EPUBForge — 無料のローカル EPUB 変換ツール。EPUB と PDF、TXT、HTML、Markdown をブラウザで変換。" },
  ko: { localeLabel: "언어", heroBadge: `${tools.length}개의 로컬 변환 도구`, heroTitle1: "전자책 변환", heroTitle2: "브라우저에서 바로.", heroDesc: "전자책 폴더 또는 원고 한 개를 업로드하세요. EPUBForge는 EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG 등을 일괄 변환하며 파일별 진행률과 수동 다운로드를 제공합니다.", stat1: "일괄 대기열", stat2: "파일별 진행률", stat3: "수동 다운로드", uploadQueue: "업로드 및 대기열", dropBrowse: "파일 드롭 또는 선택", dropHelp: "다중 파일 지원. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG 등.", defaultTool: "새 파일 기본 도구", convertFiles: "파일 변환", downloadReady: "다운로드 준비", clear: "지우기", overallProgress: "전체 진행률", queueTitle: "변환 대기열", queueDescEmpty: "위에서 전자책을 추가해 시작하세요.", queueDescFilled: "각 파일은 독립적으로 변환됩니다. 파일별 도구를 선택하고 준비되면 다운로드하세요.", noFiles: "대기열에 파일이 없습니다.", noFilesHint: "여러 전자책을 드롭하거나 위 버튼을 클릭하세요.", toolLabel: "도구", detected: "자동 감지", download: "다운로드", remove: "제거", readEbook: "전자책 읽기", preview: "출력 미리보기", faqTitle: "자주 묻는 질문", footer: "EPUBForge — 무료 로컬 EPUB 변환기. EPUB↔PDF, TXT, HTML, Markdown를 브라우저에서 변환하세요." },
  pl: { localeLabel: "Język", heroBadge: `${tools.length} lokalnych narzędzi`, heroTitle1: "Konwertuj ebooki", heroTitle2: "w przeglądarce.", heroDesc: "Prześlij folder ebooków lub pojedynczy rękopis. EPUBForge konwertuje EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG i więcej — hurtowo, z postępem dla każdego pliku i ręcznym pobieraniem.", stat1: "Kolejka wsadowa", stat2: "Postęp dla pliku", stat3: "Ręczne pobieranie", uploadQueue: "Prześlij i ustaw w kolejce", dropBrowse: "Upuść pliki lub wybierz", dropHelp: "Obsługa wielu plików. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG i więcej.", defaultTool: "Domyślne narzędzie", convertFiles: "Konwertuj pliki", downloadReady: "Pobieranie gotowe", clear: "Wyczyść", overallProgress: "Postęp ogólny", queueTitle: "Kolejka konwersji", queueDescEmpty: "Dodaj ebooki powyżej, aby rozpocząć.", queueDescFilled: "Każdy plik jest konwertowany osobno. Wybierz narzędzie dla pliku i pobierz po zakończeniu.", noFiles: "Brak plików w kolejce.", noFilesHint: "Upuść kilka ebooków lub kliknij przycisk powyżej.", toolLabel: "Narzędzie", detected: "Wykryto", download: "Pobierz", remove: "Usuń", readEbook: "Czytaj ebook", preview: "Pokaż podgląd", faqTitle: "Najczęściej zadawane pytania", footer: "EPUBForge — darmowy lokalny konwerter EPUB. Konwertuj EPUB, PDF, TXT, HTML i Markdown w przeglądarce." },
  pt: { localeLabel: "Idioma", heroBadge: `${tools.length} ferramentas locais`, heroTitle1: "Converta ebooks", heroTitle2: "no navegador.", heroDesc: "Envie uma pasta de ebooks ou um manuscrito. O EPUBForge converte EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG e mais — em lote, com progresso por arquivo e download manual.", stat1: "Fila em lote", stat2: "Progresso por arquivo", stat3: "Download manual", uploadQueue: "Enviar e enfileirar", dropBrowse: "Solte arquivos ou escolha", dropHelp: "Suporta vários arquivos. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG e mais.", defaultTool: "Ferramenta padrão", convertFiles: "Converter arquivos", downloadReady: "Download pronto", clear: "Limpar", overallProgress: "Progresso geral", queueTitle: "Fila de conversão", queueDescEmpty: "Adicione ebooks acima para começar.", queueDescFilled: "Cada arquivo é convertido separadamente. Escolha uma ferramenta por arquivo e baixe quando estiver pronto.", noFiles: "Nenhum arquivo na fila.", noFilesHint: "Solte vários ebooks ou clique no botão acima.", toolLabel: "Ferramenta", detected: "Detectado", download: "Baixar", remove: "Remover", readEbook: "Ler ebook", preview: "Mostrar prévia", faqTitle: "Perguntas frequentes", footer: "EPUBForge — conversor EPUB local gratuito. Converta EPUB, PDF, TXT, HTML e Markdown no navegador." },
  ru: { localeLabel: "Язык", heroBadge: `${tools.length} локальных инструментов`, heroTitle1: "Конвертируйте книги", heroTitle2: "прямо в браузере.", heroDesc: "Загрузите папку с книгами или один документ. EPUBForge конвертирует EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG и многое другое — пакетно, с прогрессом по каждому файлу и ручной загрузкой.", stat1: "Пакетная очередь", stat2: "Прогресс по файлу", stat3: "Ручная загрузка", uploadQueue: "Загрузка и очередь", dropBrowse: "Перетащите файлы или выберите", dropHelp: "Поддерживаются несколько файлов. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG и многое другое.", defaultTool: "Инструмент по умолчанию", convertFiles: "Конвертировать файлы", downloadReady: "Готово к загрузке", clear: "Очистить", overallProgress: "Общий прогресс", queueTitle: "Очередь конвертации", queueDescEmpty: "Добавьте книги выше, чтобы начать пакетную обработку.", queueDescFilled: "Каждый файл конвертируется отдельно. Выберите инструмент для файла и скачайте результат.", noFiles: "В очереди пока нет файлов.", noFilesHint: "Перетащите несколько книг или нажмите кнопку выше.", toolLabel: "Инструмент", detected: "Определено", download: "Скачать", remove: "Удалить", readEbook: "Читать ebook", preview: "Показать превью", faqTitle: "Часто задаваемые вопросы", footer: "EPUBForge — бесплатный локальный EPUB-конвертер. Конвертируйте EPUB, PDF, TXT, HTML и Markdown в браузере." },
  tr: { localeLabel: "Dil", heroBadge: `${tools.length} yerel araç`, heroTitle1: "E-kitapları dönüştürün", heroTitle2: "tarayıcıda.", heroDesc: "Bir klasör dolusu e-kitap veya tek bir belge yükleyin. EPUBForge EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG ve daha fazlasını toplu olarak dönüştürür; dosya başına ilerleme ve manuel indirme sunar.", stat1: "Toplu kuyruk", stat2: "Dosya başına ilerleme", stat3: "Manuel indirme", uploadQueue: "Yükle ve sıraya al", dropBrowse: "Dosya bırak veya seç", dropHelp: "Çoklu dosya desteklenir. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG ve daha fazlası.", defaultTool: "Varsayılan araç", convertFiles: "Dosyaları dönüştür", downloadReady: "İndirme hazır", clear: "Temizle", overallProgress: "Genel ilerleme", queueTitle: "Dönüştürme kuyruğu", queueDescEmpty: "Başlamak için yukarıya e-kitap ekleyin.", queueDescFilled: "Her dosya ayrı dönüştürülür. Dosya başına araç seçin ve hazır olunca indirin.", noFiles: "Kuyrukta henüz dosya yok.", noFilesHint: "Birden çok e-kitap bırakın veya yukarıdaki düğmeye tıklayın.", toolLabel: "Araç", detected: "Otomatik algılandı", download: "İndir", remove: "Kaldır", readEbook: "E-kitap oku", preview: "Önizlemeyi göster", faqTitle: "Sık sorulan sorular", footer: "EPUBForge — ücretsiz yerel EPUB dönüştürücü. EPUB, PDF, TXT, HTML ve Markdown'u tarayıcıda dönüştürün." },
  uk: { localeLabel: "Мова", heroBadge: `${tools.length} локальних інструментів`, heroTitle1: "Конвертуйте електронні книги", heroTitle2: "у браузері.", heroDesc: "Завантажте папку з електронними книгами або один документ. EPUBForge конвертує EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG та інше — пакетно, з прогресом для кожного файлу та ручним завантаженням.", stat1: "Пакетна черга", stat2: "Прогрес для файлу", stat3: "Ручне завантаження", uploadQueue: "Завантаження і черга", dropBrowse: "Перетягніть файли або виберіть", dropHelp: "Підтримується кілька файлів. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG та інше.", defaultTool: "Типовий інструмент", convertFiles: "Конвертувати файли", downloadReady: "Готово до завантаження", clear: "Очистити", overallProgress: "Загальний прогрес", queueTitle: "Черга конвертації", queueDescEmpty: "Додайте книги вище, щоб почати.", queueDescFilled: "Кожен файл конвертується окремо. Виберіть інструмент для файлу та завантажте результат.", noFiles: "У черзі ще немає файлів.", noFilesHint: "Перетягніть кілька книг або натисніть кнопку вище.", toolLabel: "Інструмент", detected: "Автовизначено", download: "Завантажити", remove: "Видалити", readEbook: "Читати ebook", preview: "Показати попередній перегляд", faqTitle: "Поширені запитання", footer: "EPUBForge — безкоштовний локальний EPUB-конвертер. Конвертуйте EPUB, PDF, TXT, HTML і Markdown у браузері." },
  vi: { localeLabel: "Ngôn ngữ", heroBadge: `${tools.length} công cụ cục bộ`, heroTitle1: "Chuyển đổi ebook", heroTitle2: "ngay trong trình duyệt.", heroDesc: "Tải lên một thư mục ebook hoặc một bản thảo. EPUBForge chuyển đổi EPUB ↔ PDF, MOBI, AZW3, DOCX, RTF, FB2, HTML, Markdown, CBZ, JPG/PNG và nhiều định dạng khác — theo lô, với tiến trình cho từng tệp và tải xuống thủ công.", stat1: "Hàng đợi hàng loạt", stat2: "Tiến trình từng tệp", stat3: "Tải xuống thủ công", uploadQueue: "Tải lên & hàng đợi", dropBrowse: "Thả tệp hoặc chọn", dropHelp: "Hỗ trợ nhiều tệp. EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW3, HTML, MD, CBZ, JPG/PNG và hơn thế nữa.", defaultTool: "Công cụ mặc định", convertFiles: "Chuyển đổi tệp", downloadReady: "Sẵn sàng tải xuống", clear: "Xóa", overallProgress: "Tiến trình tổng thể", queueTitle: "Hàng đợi chuyển đổi", queueDescEmpty: "Thêm ebook ở trên để bắt đầu.", queueDescFilled: "Mỗi tệp được chuyển đổi độc lập. Chọn công cụ cho từng tệp rồi tải xuống khi sẵn sàng.", noFiles: "Chưa có tệp nào trong hàng đợi.", noFilesHint: "Thả nhiều ebook hoặc nhấp nút ở trên.", toolLabel: "Công cụ", detected: "Tự động nhận diện", download: "Tải xuống", remove: "Xóa", readEbook: "Đọc ebook", preview: "Xem trước đầu ra", faqTitle: "Câu hỏi thường gặp", footer: "EPUBForge — trình chuyển đổi EPUB cục bộ miễn phí. Chuyển EPUB, PDF, TXT, HTML và Markdown ngay trong trình duyệt." },
  zh: { localeLabel: "语言", heroBadge: `${tools.length} 个本地转换工具`, heroTitle1: "电子书转换", heroTitle2: "直接在浏览器中。", heroDesc: "上传一整个电子书文件夹或单个文稿。EPUBForge 支持 EPUB ↔ PDF、MOBI、AZW3、DOCX、RTF、FB2、HTML、Markdown、CBZ、JPG/PNG 等格式批量转换，并提供逐文件进度与手动下载。", stat1: "批量队列", stat2: "逐文件进度", stat3: "手动下载", uploadQueue: "上传与队列", dropBrowse: "拖放文件或选择", dropHelp: "支持多文件。EPUB、PDF、DOCX、RTF、FB2、MOBI、AZW3、HTML、MD、CBZ、JPG/PNG 等。", defaultTool: "新文件默认工具", convertFiles: "转换文件", downloadReady: "可下载", clear: "清空", overallProgress: "整体进度", queueTitle: "转换队列", queueDescEmpty: "在上方添加电子书开始批量处理。", queueDescFilled: "每个文件独立转换。为每个文件选择工具，完成后下载。", noFiles: "队列中还没有文件。", noFilesHint: "拖放多个电子书或点击上方按钮。", toolLabel: "工具", detected: "自动检测", download: "下载", remove: "移除", readEbook: "阅读电子书", preview: "显示输出预览", faqTitle: "常见问题", footer: "EPUBForge——免费的本地 EPUB 转换器。直接在浏览器中转换 EPUB、PDF、TXT、HTML 和 Markdown。" },
};

uiTranslations.ar = {
  ...uiTranslations.en!,
  localeLabel: "اللغة",
  heroBadge: `${tools.length} أدوات تحويل محلية`,
  heroTitle1: "حوّل الكتب الإلكترونية",
  heroTitle2: "داخل المتصفح.",
  heroDesc: "اسحب مجلد كتب إلكترونية أو ملفًا واحدًا. يقوم EPUBForge بتحويل EPUB ↔ PDF و MOBI و AZW3 و DOCX و RTF و FB2 و HTML و Markdown و CBZ و JPG/PNG والمزيد دفعة واحدة، مع تقدم لكل ملف وتنزيل يدوي.",
  stat1: "قائمة دفعات",
  stat2: "تقدم لكل ملف",
  stat3: "تنزيل يدوي",
  uploadQueue: "الرفع والطابور",
  dropBrowse: "اسحب الملفات أو اخترها",
  dropHelp: "يدعم عدة ملفات. EPUB و PDF و DOCX و RTF و FB2 و MOBI و AZW3 و HTML و MD و CBZ و JPG/PNG والمزيد. تتم المعالجة داخل هذه الصفحة فقط.",
  defaultTool: "الأداة الافتراضية للملفات الجديدة",
  convertFiles: "تحويل الملفات",
  downloadReady: "جاهز للتنزيل",
  clear: "مسح",
  overallProgress: "التقدم الكلي",
  queueTitle: "قائمة التحويل",
  queueDescEmpty: "أضف كتبًا إلكترونية أعلاه لبدء الدفعة.",
  queueDescFilled: "يُحوَّل كل ملف بشكل مستقل. اختر أداة لكل ملف ثم نزّل النتيجة عند الجاهزية.",
  noFiles: "لا توجد ملفات في القائمة بعد.",
  noFilesHint: "اسحب عدة كتب إلكترونية أو انقر زر السحب أو الاختيار أعلاه.",
  toolLabel: "الأداة",
  detected: "تم الاكتشاف تلقائيًا",
  download: "تنزيل",
  remove: "إزالة",
  readEbook: "قراءة الكتاب",
  preview: "إظهار المعاينة",
  faqTitle: "الأسئلة الشائعة",
  footer: "EPUBForge - محول EPUB محلي مجاني. حوّل EPUB إلى PDF و PDF إلى EPUB و TXT و HTML و Markdown مباشرة في المتصفح.",
};

const extendedTranslations: Partial<Record<LocaleCode, Partial<UiText>>> = {
  de: {
    catalogBadge: "Werkzeugkatalog", catalogTitle: `Zwei Pipelines. ${tools.length} Module.`, catalogDesc: "Konvertiere Inhalte zwischen Dokumenttypen — jeder Auftrag bleibt in diesem Browsertab.", extractFrom: "Aus EPUB extrahieren", buildFrom: "EPUB erstellen aus",
    statusDone: "Fertig", statusError: "Fehler", statusWorking: "Verarbeitung", statusNoTool: "Kein Werkzeug", statusQueued: "Wartend", doneCount: "fertig", errorCount: "Fehler", pendingCount: "offen",
    faqQ1: "Wie konvertiere ich EPUB kostenlos in PDF?", faqA1: "Lege eine .epub-Datei in die Warteschlange, wähle EPUB to PDF und klicke auf Konvertieren und Herunterladen.", faqQ2: "Kann ich PDF, TXT, HTML oder Markdown in EPUB umwandeln?", faqA2: "Ja. Verwende PDF to EPUB, TXT to EPUB, HTML to EPUB oder Markdown to EPUB.", faqQ3: "Werden meine Dateien auf einen Server hochgeladen?", faqA3: "Nein. EPUBForge läuft vollständig im Browser. Dateien verlassen niemals dein Gerät.", faqQ4: "Kann ich viele E-Books gleichzeitig konvertieren?", faqA4: "Ja. Lege mehrere Dateien gleichzeitig ab. Jede Datei hat einen Fortschrittsbalken und einen Download-Button.", faqQ5: "Welche Dateitypen unterstützt EPUBForge?", faqA5: "Eingaben: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML und Markdown.", faqQ6: "Funktioniert es auf Mobilgeräten?", faqA6: "Ja. EPUBForge ist eine responsive PWA und funktioniert auf iOS Safari und Android Chrome.", copyrightNotice: "Läuft nach dem Laden vollständig offline."
  },
  id: {
    catalogBadge: "Katalog alat", catalogTitle: `Dua pipeline. ${tools.length} modul.`, catalogDesc: "Konversi konten antar jenis dokumen — semua pekerjaan tetap di tab browser ini.", extractFrom: "Ekstrak dari EPUB", buildFrom: "Buat EPUB dari", statusDone: "Siap", statusError: "Kesalahan", statusWorking: "Memproses", statusNoTool: "Tanpa alat", statusQueued: "Antrean", doneCount: "selesai", errorCount: "kesalahan", pendingCount: "tertunda", faqQ1: "Bagaimana cara mengonversi EPUB ke PDF secara gratis?", faqA1: "Seret file .epub ke antrean, pilih EPUB to PDF, lalu klik Konversi dan Unduh.", faqQ2: "Bisakah saya mengonversi PDF, TXT, HTML, atau Markdown ke EPUB?", faqA2: "Ya. Gunakan alat PDF to EPUB, TXT to EPUB, HTML to EPUB, atau Markdown to EPUB.", faqQ3: "Apakah file saya diunggah ke server?", faqA3: "Tidak. EPUBForge berjalan sepenuhnya di browser. File tidak pernah meninggalkan perangkat Anda.", faqQ4: "Bisakah saya mengonversi banyak ebook sekaligus?", faqA4: "Ya. Seret banyak file sekaligus. Tiap file punya progres dan tombol unduh sendiri.", faqQ5: "Jenis file apa yang didukung EPUBForge?", faqA5: "Masukan: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML, dan Markdown.", faqQ6: "Apakah berfungsi di perangkat seluler?", faqA6: "Ya. EPUBForge adalah PWA responsif yang berjalan di iOS Safari dan Android Chrome.", copyrightNotice: "Berjalan sepenuhnya offline setelah dimuat."
  },
  it: { catalogBadge: "Catalogo strumenti", catalogTitle: `Doppia pipeline. ${tools.length} moduli.`, catalogDesc: "Converti contenuti tra tipi di documento — ogni lavoro resta in questa scheda.", extractFrom: "Estrai da EPUB", buildFrom: "Crea EPUB da", statusDone: "Pronto", statusError: "Errore", statusWorking: "In lavorazione", statusNoTool: "Nessuno strumento", statusQueued: "In coda", doneCount: "pronti", errorCount: "errori", pendingCount: "in attesa", faqQ1: "Come converto EPUB in PDF gratuitamente?", faqA1: "Trascina un file .epub nella coda, scegli EPUB to PDF e clicca Converti e Scarica.", faqQ2: "Posso convertire PDF, TXT, HTML o Markdown in EPUB?", faqA2: "Sì. Usa PDF to EPUB, TXT to EPUB, HTML to EPUB o Markdown to EPUB.", faqQ3: "I miei file vengono caricati su un server?", faqA3: "No. EPUBForge funziona interamente nel browser. I file non lasciano il tuo dispositivo.", faqQ4: "Posso convertire molti ebook contemporaneamente?", faqA4: "Sì. Trascina più file insieme. Ogni file ha il proprio avanzamento e pulsante di download.", faqQ5: "Quali tipi di file supporta EPUBForge?", faqA5: "Input: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML e Markdown.", faqQ6: "Funziona su mobile?", faqA6: "Sì. EPUBForge è una PWA responsive e funziona su iOS Safari e Android Chrome.", copyrightNotice: "Funziona completamente offline dopo il caricamento." },
  ja: { catalogBadge: "ツールカタログ", catalogTitle: `2つのパイプライン。${tools.length}モジュール。`, catalogDesc: "ドキュメント種類間でコンテンツを変換 — すべてこのブラウザタブ内で完結します。", extractFrom: "EPUBから抽出", buildFrom: "EPUBを作成", statusDone: "完了", statusError: "エラー", statusWorking: "処理中", statusNoTool: "ツールなし", statusQueued: "待機中", doneCount: "完了", errorCount: "エラー", pendingCount: "保留中", faqQ1: "EPUBを無料でPDFに変換するには？", faqA1: ".epubファイルをキューにドロップし、EPUB to PDFを選んで変換・ダウンロードします。", faqQ2: "PDF、TXT、HTML、MarkdownをEPUBに変換できますか？", faqA2: "はい。PDF to EPUB、TXT to EPUB、HTML to EPUB、Markdown to EPUBをご利用ください。", faqQ3: "ファイルはサーバーにアップロードされますか？", faqA3: "いいえ。EPUBForgeは完全にブラウザ内で動作し、ファイルが端末を離れることはありません。", faqQ4: "複数の電子書籍をまとめて変換できますか？", faqA4: "はい。複数ファイルを同時にドロップできます。各ファイルに進行バーとダウンロードボタンがあります。", faqQ5: "EPUBForgeはどの形式に対応していますか？", faqA5: "入力：EPUB、PDF、DOCX、RTF、FB2、MOBI、AZW、AZW3、AZW4、PRC、PDB、LIT、LRF、CHM、DJVU、CBZ、CBR、JPG、PNG、PPT/PPTX、TXT、HTML、XHTML、Markdown。", faqQ6: "モバイルでも使えますか？", faqA6: "はい。EPUBForgeはレスポンシブPWAで、iOS SafariとAndroid Chromeで動作します。", copyrightNotice: "読み込み後は完全にオフラインで動作します。" },
  ko: { catalogBadge: "도구 카탈로그", catalogTitle: `두 개의 파이프라인. ${tools.length}개 모듈.`, catalogDesc: "문서 유형 간 콘텐츠를 변환 — 모든 작업이 이 브라우저 탭 안에서 처리됩니다。", extractFrom: "EPUB에서 추출", buildFrom: "EPUB 만들기", statusDone: "완료", statusError: "오류", statusWorking: "처리 중", statusNoTool: "도구 없음", statusQueued: "대기 중", doneCount: "완료", errorCount: "오류", pendingCount: "대기", faqQ1: "EPUB를 무료로 PDF로 변환하려면?", faqA1: ".epub 파일을 대기열에 넣고 EPUB to PDF를 선택한 뒤 변환 및 다운로드하세요。", faqQ2: "PDF, TXT, HTML, Markdown을 EPUB로 변환할 수 있나요?", faqA2: "네. PDF to EPUB, TXT to EPUB, HTML to EPUB, Markdown to EPUB 도구를 사용하세요。", faqQ3: "파일이 서버에 업로드되나요?", faqA3: "아니요。 EPUBForge는 브라우저 안에서만 동작하며 파일이 기기를 떠나지 않습니다。", faqQ4: "많은 전자책을 한 번에 변환할 수 있나요?", faqA4: "네。 여러 파일을 동시에 추가할 수 있으며, 각 파일마다 진행률과 다운로드 버튼이 있습니다。", faqQ5: "EPUBForge는 어떤 파일 형식을 지원하나요?", faqA5: "입력: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML, Markdown。", faqQ6: "모바일에서도 작동하나요?", faqA6: "네。 EPUBForge는 반응형 PWA이며 iOS Safari와 Android Chrome에서 작동합니다。", copyrightNotice: "로드 후 완전히 오프라인으로 작동합니다。" },
  pl: { catalogBadge: "Katalog narzędzi", catalogTitle: `Dwie ścieżki. ${tools.length} modułów.`, catalogDesc: "Konwertuj treści między typami dokumentów — każde zadanie pozostaje w tej karcie przeglądarki.", extractFrom: "Wyodrębnij z EPUB", buildFrom: "Utwórz EPUB z", statusDone: "Gotowe", statusError: "Błąd", statusWorking: "Przetwarzanie", statusNoTool: "Brak narzędzia", statusQueued: "W kolejce", doneCount: "gotowe", errorCount: "błędy", pendingCount: "oczekujące", faqQ1: "Jak bezpłatnie konwertować EPUB na PDF?", faqA1: "Upuść plik .epub do kolejki, wybierz EPUB to PDF i kliknij Konwertuj oraz Pobierz.", faqQ2: "Czy mogę przekonwertować PDF, TXT, HTML lub Markdown na EPUB?", faqA2: "Tak. Użyj PDF to EPUB, TXT to EPUB, HTML to EPUB lub Markdown to EPUB.", faqQ3: "Czy moje pliki są przesyłane na serwer?", faqA3: "Nie. EPUBForge działa całkowicie w przeglądarce. Pliki nigdy nie opuszczają urządzenia.", faqQ4: "Czy mogę konwertować wiele ebooków naraz?", faqA4: "Tak. Upuść wiele plików jednocześnie. Każdy plik ma własny pasek postępu i przycisk pobierania.", faqQ5: "Jakie typy plików obsługuje EPUBForge?", faqA5: "Wejście: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML i Markdown.", faqQ6: "Czy działa na urządzeniach mobilnych?", faqA6: "Tak. EPUBForge to responsywna PWA działająca na iOS Safari i Android Chrome.", copyrightNotice: "Działa w pełni offline po załadowaniu." },
  pt: { catalogBadge: "Catálogo de ferramentas", catalogTitle: `Dois pipelines. ${tools.length} módulos.`, catalogDesc: "Converta conteúdo entre tipos de documento — cada tarefa permanece nesta aba do navegador.", extractFrom: "Extrair do EPUB", buildFrom: "Criar EPUB a partir de", statusDone: "Pronto", statusError: "Erro", statusWorking: "Processando", statusNoTool: "Sem ferramenta", statusQueued: "Na fila", doneCount: "prontos", errorCount: "erros", pendingCount: "pendentes", faqQ1: "Como converter EPUB em PDF gratuitamente?", faqA1: "Solte um arquivo .epub na fila, escolha EPUB to PDF e clique em Converter e Baixar.", faqQ2: "Posso converter PDF, TXT, HTML ou Markdown em EPUB?", faqA2: "Sim. Use PDF to EPUB, TXT to EPUB, HTML to EPUB ou Markdown to EPUB.", faqQ3: "Meus arquivos são enviados a um servidor?", faqA3: "Não. EPUBForge funciona inteiramente no navegador. Os arquivos nunca saem do seu dispositivo.", faqQ4: "Posso converter muitos ebooks de uma vez?", faqA4: "Sim. Solte vários arquivos ao mesmo tempo. Cada arquivo tem sua própria barra de progresso e botão de download.", faqQ5: "Quais tipos de arquivo o EPUBForge suporta?", faqA5: "Entrada: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML e Markdown.", faqQ6: "Funciona em dispositivos móveis?", faqA6: "Sim. EPUBForge é uma PWA responsiva e funciona no iOS Safari e Android Chrome.", copyrightNotice: "Funciona totalmente offline após o carregamento." },
  ru: { catalogBadge: "Каталог инструментов", catalogTitle: `Две линии. ${tools.length} модулей.`, catalogDesc: "Конвертируйте содержимое между типами документов — все задачи остаются в этой вкладке браузера.", extractFrom: "Извлечь из EPUB", buildFrom: "Создать EPUB из", statusDone: "Готово", statusError: "Ошибка", statusWorking: "Обработка", statusNoTool: "Нет инструмента", statusQueued: "В очереди", doneCount: "готово", errorCount: "ошибок", pendingCount: "ожидает", faqQ1: "Как бесплатно конвертировать EPUB в PDF?", faqA1: "Перетащите файл .epub в очередь, выберите EPUB to PDF и нажмите Конвертировать и Скачать.", faqQ2: "Можно ли конвертировать PDF, TXT, HTML или Markdown в EPUB?", faqA2: "Да. Используйте PDF to EPUB, TXT to EPUB, HTML to EPUB или Markdown to EPUB.", faqQ3: "Мои файлы загружаются на сервер?", faqA3: "Нет. EPUBForge работает полностью в браузере. Файлы никогда не покидают ваше устройство.", faqQ4: "Можно ли конвертировать много книг одновременно?", faqA4: "Да. Перетащите несколько файлов сразу. У каждого будет свой прогресс и кнопка скачивания.", faqQ5: "Какие типы файлов поддерживает EPUBForge?", faqA5: "Вход: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML и Markdown.", faqQ6: "Работает ли на мобильных устройствах?", faqA6: "Да. EPUBForge — адаптивное PWA, работает в iOS Safari и Android Chrome.", copyrightNotice: "После загрузки работает полностью офлайн." },
  tr: { catalogBadge: "Araç kataloğu", catalogTitle: `Çift hat. ${tools.length} modül.`, catalogDesc: "Belge türleri arasında içerik dönüştürün — her görev bu tarayıcı sekmesinde kalır.", extractFrom: "EPUB'dan çıkar", buildFrom: "EPUB oluştur", statusDone: "Hazır", statusError: "Hata", statusWorking: "İşleniyor", statusNoTool: "Araç yok", statusQueued: "Kuyrukta", doneCount: "tamamlandı", errorCount: "hata", pendingCount: "bekliyor", faqQ1: "EPUB'u ücretsiz olarak PDF'ye nasıl dönüştürürüm?", faqA1: "Bir .epub dosyasını kuyruğa bırakın, EPUB to PDF'yi seçin ve Dönüştür ile İndir'e tıklayın.", faqQ2: "PDF, TXT, HTML veya Markdown'ı EPUB'a dönüştürebilir miyim?", faqA2: "Evet. PDF to EPUB, TXT to EPUB, HTML to EPUB veya Markdown to EPUB aracını kullanın.", faqQ3: "Dosyalarım sunucuya yükleniyor mu?", faqA3: "Hayır. EPUBForge tamamen tarayıcıda çalışır. Dosyalar cihazınızı asla terk etmez.", faqQ4: "Aynı anda çok sayıda e-kitabı dönüştürebilir miyim?", faqA4: "Evet. Birden fazla dosyayı aynı anda bırakın. Her dosyanın kendi ilerleme çubuğu ve indirme düğmesi vardır.", faqQ5: "EPUBForge hangi dosya türlerini destekler?", faqA5: "Giriş: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML ve Markdown.", faqQ6: "Mobilde çalışır mı?", faqA6: "Evet. EPUBForge duyarlı bir PWA'dir ve iOS Safari ile Android Chrome'da çalışır.", copyrightNotice: "Yüklendikten sonra tamamen çevrimdışı çalışır." },
  uk: { catalogBadge: "Каталог інструментів", catalogTitle: `Дві лінії. ${tools.length} модулів.`, catalogDesc: "Конвертуйте вміст між типами документів — кожне завдання залишається в цій вкладці браузера.", extractFrom: "Витягти з EPUB", buildFrom: "Створити EPUB з", statusDone: "Готово", statusError: "Помилка", statusWorking: "Обробка", statusNoTool: "Немає інструменту", statusQueued: "У черзі", doneCount: "готово", errorCount: "помилок", pendingCount: "очікує", faqQ1: "Як безкоштовно конвертувати EPUB у PDF?", faqA1: "Перетягніть файл .epub у чергу, виберіть EPUB to PDF і натисніть Конвертувати та Завантажити.", faqQ2: "Чи можна конвертувати PDF, TXT, HTML або Markdown в EPUB?", faqA2: "Так. Використовуйте PDF to EPUB, TXT to EPUB, HTML to EPUB або Markdown to EPUB.", faqQ3: "Мої файли завантажуються на сервер?", faqA3: "Ні. EPUBForge працює повністю в браузері. Файли ніколи не покидають ваш пристрій.", faqQ4: "Чи можна конвертувати багато книжок одночасно?", faqA4: "Так. Перетягніть кілька файлів одразу. Кожен матиме власний прогрес і кнопку завантаження.", faqQ5: "Які типи файлів підтримує EPUBForge?", faqA5: "Вхід: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML і Markdown.", faqQ6: "Чи працює на мобільних пристроях?", faqA6: "Так. EPUBForge — адаптивний PWA, працює на iOS Safari та Android Chrome.", copyrightNotice: "Після завантаження працює повністю офлайн." },
  vi: { catalogBadge: "Danh mục công cụ", catalogTitle: `Hai quy trình. ${tools.length} mô-đun.`, catalogDesc: "Chuyển đổi nội dung giữa các loại tài liệu — mọi tác vụ đều nằm trong tab trình duyệt này.", extractFrom: "Trích xuất từ EPUB", buildFrom: "Tạo EPUB từ", statusDone: "Sẵn sàng", statusError: "Lỗi", statusWorking: "Đang xử lý", statusNoTool: "Không có công cụ", statusQueued: "Đang chờ", doneCount: "xong", errorCount: "lỗi", pendingCount: "đang chờ", faqQ1: "Làm thế nào để chuyển EPUB sang PDF miễn phí?", faqA1: "Thả tệp .epub vào hàng đợi, chọn EPUB to PDF và nhấn Chuyển đổi rồi Tải xuống.", faqQ2: "Tôi có thể chuyển PDF, TXT, HTML hoặc Markdown sang EPUB không?", faqA2: "Có. Dùng PDF to EPUB, TXT to EPUB, HTML to EPUB hoặc Markdown to EPUB.", faqQ3: "Tệp của tôi có được tải lên máy chủ không?", faqA3: "Không. EPUBForge chạy hoàn toàn trong trình duyệt. Tệp không rời khỏi thiết bị.", faqQ4: "Tôi có thể chuyển nhiều ebook cùng lúc không?", faqA4: "Có. Thả nhiều tệp cùng lúc. Mỗi tệp có thanh tiến trình và nút tải xuống riêng.", faqQ5: "EPUBForge hỗ trợ những loại tệp nào?", faqA5: "Đầu vào: EPUB, PDF, DOCX, RTF, FB2, MOBI, AZW, AZW3, AZW4, PRC, PDB, LIT, LRF, CHM, DJVU, CBZ, CBR, JPG, PNG, PPT/PPTX, TXT, HTML, XHTML, Markdown.", faqQ6: "Có hoạt động trên di động không?", faqA6: "Có. EPUBForge là PWA responsive và hoạt động trên iOS Safari và Android Chrome.", copyrightNotice: "Hoạt động hoàn toàn ngoại tuyến sau khi tải." },
  zh: { catalogBadge: "工具目录", catalogTitle: `双流程，${tools.length} 个模块。`, catalogDesc: "在文档类型之间转换内容——所有任务都在当前浏览器标签页内完成。", extractFrom: "从 EPUB 提取", buildFrom: "构建 EPUB", statusDone: "就绪", statusError: "错误", statusWorking: "处理中", statusNoTool: "无工具", statusQueued: "排队中", doneCount: "完成", errorCount: "错误", pendingCount: "等待中", faqQ1: "如何免费将 EPUB 转换为 PDF？", faqA1: "将 .epub 文件拖入队列，选择 EPUB to PDF，然后点击转换并下载。", faqQ2: "可以将 PDF、TXT、HTML 或 Markdown 转为 EPUB 吗？", faqA2: "可以。使用 PDF to EPUB、TXT to EPUB、HTML to EPUB 或 Markdown to EPUB。", faqQ3: "我的文件会上传到服务器吗？", faqA3: "不会。EPUBForge 完全在浏览器中运行，文件不会离开您的设备。", faqQ4: "可以一次批量转换很多电子书吗？", faqA4: "可以。一次拖放多个文件，每个文件都有独立的进度条和下载按钮。", faqQ5: "EPUBForge 支持哪些文件类型？", faqA5: "输入：EPUB、PDF、DOCX、RTF、FB2、MOBI、AZW、AZW3、AZW4、PRC、PDB、LIT、LRF、CHM、DJVU、CBZ、CBR、JPG、PNG、PPT/PPTX、TXT、HTML、XHTML、Markdown。", faqQ6: "支持手机吗？", faqA6: "支持。EPUBForge 是响应式 PWA，可在 iOS Safari 和 Android Chrome 上运行。", copyrightNotice: "加载后完全离线运行。" },
  ar: { catalogBadge: "دليل الأدوات", catalogTitle: `مساران. ${tools.length} وحدة.`, catalogDesc: "حوّل المحتوى بين أنواع المستندات — تبقى كل مهمة داخل علامة التبويب هذه.", extractFrom: "استخراج من EPUB", buildFrom: "إنشاء EPUB من", statusDone: "جاهز", statusError: "خطأ", statusWorking: "جارٍ العمل", statusNoTool: "لا أداة", statusQueued: "في الانتظار", doneCount: "مكتمل", errorCount: "أخطاء", pendingCount: "بانتظار", faqQ1: "كيف أحول EPUB إلى PDF مجانًا؟", faqA1: "ضع ملف .epub في القائمة، اختر EPUB to PDF، ثم اضغط تحويل وتنزيل.", faqQ2: "هل يمكنني تحويل PDF أو TXT أو HTML أو Markdown إلى EPUB؟", faqA2: "نعم. استخدم PDF to EPUB أو TXT to EPUB أو HTML to EPUB أو Markdown to EPUB.", faqQ3: "هل تُرفع ملفاتي إلى خادم؟", faqA3: "لا. يعمل EPUBForge بالكامل داخل المتصفح. لا تغادر الملفات جهازك أبدًا.", faqQ4: "هل يمكنني تحويل عدد كبير من الكتب دفعة واحدة؟", faqA4: "نعم. اسحب عدة ملفات في الوقت نفسه. لكل ملف شريط تقدم وزر تنزيل خاص.", faqQ5: "ما أنواع الملفات التي يدعمها EPUBForge؟", faqA5: "المدخلات: EPUB و PDF و DOCX و RTF و FB2 و MOBI و AZW و AZW3 و AZW4 و PRC و PDB و LIT و LRF و CHM و DJVU و CBZ و CBR و JPG و PNG و PPT/PPTX و TXT و HTML و XHTML و Markdown.", faqQ6: "هل يعمل على الهاتف المحمول؟", faqA6: "نعم. EPUBForge تطبيق PWA متجاوب ويعمل على iOS Safari و Android Chrome.", copyrightNotice: "يعمل بالكامل دون اتصال بعد التحميل." }
};

export default function App() {
  const [locale, setLocale] = useState<LocaleCode>("en");
  const t = { ...uiTranslations.en!, ...(uiTranslations[locale] || {}), ...(extendedTranslations[locale] || {}) } as UiText;
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [defaultTool, setDefaultTool] = useState<ToolId>("epub-txt");
  const [running, setRunning] = useState(false);
  const [announce, setAnnounce] = useState("Idle. Add files to begin.");
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<string[]>([]);

  // Ebook Reader state
  const [viewerEpub, setViewerEpub] = useState<EpubData | null>(null);
  const [viewerChapterIdx, setViewerChapterIdx] = useState(0);
  const [viewerFontSize, setViewerFontSize] = useState<"sm" | "base" | "lg" | "xl" | "2xl">("lg");
  const [viewerTheme, setViewerTheme] = useState<"light" | "sepia" | "dark">("sepia");
  const [viewerFontFamily, setViewerFontFamily] = useState<"serif" | "sans" | "mono">("serif");
  const [viewerSidebarOpen, setViewerSidebarOpen] = useState(false);

  // Download UX states
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    const isArabic = locale === "ar";
    document.documentElement.lang = locale;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "bg-[#09090e]" : "bg-[#f8f7f4]",
    card: isDark ? "bg-slate-900/95 border-slate-700" : "bg-white border-slate-200 shadow-sm",
    cardFlat: isDark ? "bg-slate-900/60 border-slate-700" : "bg-white/80 border-slate-200",
    border: isDark ? "border-slate-800" : "border-slate-200",
    text: isDark ? "text-slate-100" : "text-slate-900",
    textMuted: isDark ? "text-slate-400" : "text-slate-500",
    textSoft: isDark ? "text-slate-300" : "text-slate-600",
    textStrong: isDark ? "text-white" : "text-slate-950",
    input: isDark ? "bg-slate-950 border-slate-700 text-indigo-200" : "bg-white border-slate-300 text-indigo-700",
    btn: isDark ? "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
    accent: isDark ? "text-indigo-300" : "text-indigo-600",
    footer: isDark ? "bg-slate-950 border-slate-900 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500",
    section: isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200",
    hover: isDark ? "hover:bg-slate-800" : "hover:bg-slate-100",
    headerBorder: isDark ? "border-slate-800/80" : "border-slate-200",
  };

  async function openReaderForJob(job: Job) {
    if (job.parsedEpub) {
      setViewerEpub(job.parsedEpub);
      setViewerChapterIdx(0);
      setAnnounce(`Opened reader for ${job.file.name}`);
      return;
    }

    setAnnounce("Parsing EPUB structure...");
    try {
      const data = await parseEpub(await job.file.arrayBuffer());
      // Cache it
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, parsedEpub: data } : j)));
      setViewerEpub(data);
      setViewerChapterIdx(0);
      setAnnounce(`Opened reader for ${job.file.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to parse EPUB structure.";
      setAnnounce(`Failed to open reader: ${msg}`);
      alert(`Cannot open reader: ${msg}`);
    }
  }

  async function openReaderForBlob(blob: Blob, title: string) {
    setAnnounce("Parsing generated EPUB structure...");
    try {
      const data = await parseEpub(await blob.arrayBuffer());
      setViewerEpub(data);
      setViewerChapterIdx(0);
      setAnnounce(`Opened reader for generated EPUB: ${title}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to parse EPUB structure.";
      setAnnounce(`Failed to open reader: ${msg}`);
      alert(`Cannot open reader: ${msg}`);
    }
  }

  const epubTools = useMemo(() => tools.filter((t) => t.accepts.includes("epub")), []);
  const builderTools = useMemo(() => tools.filter((t) => !t.accepts.includes("epub")), []);
  const queuedExtensions = useMemo(
    () => jobs.map((job) => job.detectedExt || getExtension(job.file.name)).filter(Boolean),
    [jobs],
  );
  const defaultToolOptions = useMemo(() => {
    if (queuedExtensions.length === 0) return tools;
    const allEpub = queuedExtensions.every((ext) => ext === "epub");
    const allNonEpub = queuedExtensions.every((ext) => ext !== "epub");

    if (allEpub) return epubTools;
    if (allNonEpub) {
      return builderTools.filter((tool) => queuedExtensions.some((ext) => tool.accepts.includes(ext)));
    }

    return tools.filter((tool) => queuedExtensions.some((ext) => tool.accepts.includes(ext)));
  }, [builderTools, epubTools, queuedExtensions]);
  const selectedDefault = defaultToolOptions.find((t) => t.id === defaultTool) || defaultToolOptions[0] || tools[0];

  const totalCount = jobs.length;
  const doneCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;
  const queuedCount = jobs.filter((j) => j.status === "queued" || j.status === "error").length;
  const overallProgress = totalCount === 0 ? 0 : Math.round(jobs.reduce((s, j) => s + j.progress, 0) / totalCount);
  const completedJobs = jobs.filter((j) => j.status === "done" && j.result);

  useEffect(() => {
    if (!defaultToolOptions.some((tool) => tool.id === defaultTool)) {
      setDefaultTool((defaultToolOptions[0] || tools[0]).id);
    }
  }, [defaultTool, defaultToolOptions]);

  // Keep a ref to jobs for cleanup on unmount
  const jobsRef = useRef(jobs);
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  // Cleanup any blob URLs we created on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      // Also revoke blob URLs from all parsed EPUB images
      for (const job of jobsRef.current) {
        if (job.parsedEpub?.images) {
          for (const imgData of job.parsedEpub.images.values()) {
            URL.revokeObjectURL(imgData.url);
          }
        }
      }
    };
  }, []);

  function addFiles(files: FileList | File[] | null) {
    if (!files) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    
    const newJobs: Job[] = list.map((file) => {
      const ext = getExtension(file.name);
      const tool = inferTool(ext, defaultTool);
      const accepted = tools.find((t) => t.id === tool)?.accepts.includes(ext);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        tool,
        status: accepted ? "queued" : "skipped",
        progress: 0,
        error: accepted ? undefined : `No matching tool for .${ext || "unknown"}`,
        detectedFormat: "Inspecting bytes...",
      };
    });

    setJobs((prev) => [...prev, ...newJobs]);
    setAnnounce(`${list.length} file${list.length === 1 ? "" : "s"} added to queue.`);

    // Run format detection asynchronously
    newJobs.forEach(async (job) => {
      try {
        const result = await detectFileFormat(job.file);
        let epubData: EpubData | undefined;
        if (result.ext === "epub") {
          try {
            epubData = await parseEpub(await job.file.arrayBuffer());
          } catch {
            /* invalid EPUB shell, ignore */
          }
        }

        setJobs((prev) =>
          prev.map((j) => {
            if (j.id !== job.id) return j;
            // Do not let async auto-detection overwrite a tool the user already selected
            // while detection was still running. This was causing EPUB→PDF selections
            // to revert back to the original EPUB→TXT default.
            const currentTool = tools.find((tool) => tool.id === j.tool);
            const inferred = currentTool?.accepts.includes(result.ext)
              ? j.tool
              : inferTool(result.ext, defaultTool);
            const accepted = tools.find((t) => t.id === inferred)?.accepts.includes(result.ext);
            return {
              ...j,
              tool: inferred,
              status: accepted ? "queued" : "skipped",
              error: accepted ? undefined : `No matching tool for detected .${result.ext}`,
              detectedExt: result.ext,
              detectedFormat: result.label,
              parsedEpub: epubData,
            };
          }),
        );
      } catch {
        // fallback to extension label if inspection fails
        const fallbackExt = getExtension(job.file.name);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, detectedFormat: fallbackExt.toUpperCase() + " File" }
              : j,
          ),
        );
      }
    });
  }

  function removeJob(id: string) {
    setJobs((prev) => {
      const job = prev.find((j) => j.id === id);
      // Revoke blob URLs from parsed EPUB images
      if (job?.parsedEpub?.images) {
        for (const imgData of job.parsedEpub.images.values()) {
          URL.revokeObjectURL(imgData.url);
        }
      }
      return prev.filter((j) => j.id !== id);
    });
    setAnnounce("File removed from queue.");
  }

  function clearAll() {
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    // Revoke blob URLs from all parsed EPUB images
    setJobs((prev) => {
      for (const job of prev) {
        if (job.parsedEpub?.images) {
          for (const imgData of job.parsedEpub.images.values()) {
            URL.revokeObjectURL(imgData.url);
          }
        }
      }
      return [];
    });
    setAnnounce("Queue cleared.");
  }

  function changeJobTool(id: string, toolId: ToolId) {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== id) return job;
        const ext = job.detectedExt || getExtension(job.file.name);
        const tool = tools.find((t) => t.id === toolId);
        const accepted = tool?.accepts.includes(ext);
        return {
          ...job,
          tool: toolId,
          status: accepted ? "queued" : "skipped",
          progress: 0,
          error: accepted ? undefined : `Tool expects ${tool?.input}, file is .${ext || "unknown"}`,
          result: undefined,
        };
      }),
    );
  }

  function changeDefaultTool(toolId: ToolId) {
    setDefaultTool(toolId);
    const selected = tools.find((t) => t.id === toolId);
    if (!selected) return;

    setJobs((prev) =>
      prev.map((job) => {
        if (job.status === "processing") return job;
        const ext = job.detectedExt || getExtension(job.file.name);
        if (!selected.accepts.includes(ext)) return job;
        return {
          ...job,
          tool: toolId,
          status: job.status === "done" ? "queued" : job.status,
          progress: job.status === "done" ? 0 : job.progress,
          result: job.status === "done" ? undefined : job.result,
          error: undefined,
        };
      }),
    );
    setAnnounce(`${selected.name} applied to all compatible queued files.`);
  }

  const clampProgress = (p: number) => Math.max(0, Math.min(100, Math.round(p)));

  async function runAll() {
    if (running) return;
    const queued = jobs.filter((j) => j.status === "queued" || j.status === "error");
    if (queued.length === 0) {
      setAnnounce("Nothing queued. Add files or reset jobs to convert again.");
      return;
    }

    setRunning(true);
    setAnnounce(`Starting conversion of ${queued.length} file${queued.length === 1 ? "" : "s"}.`);

    for (const job of queued) {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "processing", progress: 10, error: undefined } : j)));

      try {
        // Pass a progress callback to convertOne
        const result = await convertOne(job.file, job.tool, job.detectedExt, (p) => {
          setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, progress: clampProgress(p) } : j)));
        });
        
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "done", progress: 100, result } : j,
          ),
        );
        setAnnounce(`Converted ${job.file.name}.`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Conversion failed.";
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: "error", progress: 100, error: message } : j)),
        );
        setAnnounce(`Failed to convert ${job.file.name}: ${message}`);
      }

      // Yield to UI
      await new Promise((r) => setTimeout(r, 0));
    }

    setRunning(false);
    setAnnounce("Conversion complete. Use the download buttons to save your files.");
  }

  function downloadResult(job: Job) {
    if (!job.result) return;

    // Visual feedback: temporarily mark job as downloading
    const originalStatus = job.status;
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "processing" as JobStatus } : j));

    const url = URL.createObjectURL(job.result.blob);
    blobUrlsRef.current.push(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = job.result.fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setAnnounce(`Downloading ${job.result.fileName}.`);

    // Restore status after short delay
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: originalStatus } : j));
    }, 900);
  }

  async function downloadAll() {
    if (completedJobs.length === 0 || downloadingAll) return;

    setDownloadingAll(true);

    try {
      if (completedJobs.length === 1) {
        downloadResult(completedJobs[0]);
        return;
      }

      const zip = new JSZip();
      const seen = new Map<string, number>();

      completedJobs.forEach((job) => {
        if (!job.result) return;
        let name = job.result.fileName;
        const count = seen.get(name) || 0;
        if (count > 0) {
          const dot = name.lastIndexOf(".");
          name = dot === -1 ? `${name}-${count + 1}` : `${name.slice(0, dot)}-${count + 1}${name.slice(dot)}`;
        }
        seen.set(job.result.fileName, count + 1);
        zip.file(name, job.result.blob);
      });

      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/zip" });
      const url = URL.createObjectURL(blob);
      blobUrlsRef.current.push(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `epubforge-batch-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setAnnounce(`Downloading bundle of ${completedJobs.length} files.`);
    } finally {
      // Reset loading state after a short delay so user sees the change
      setTimeout(() => setDownloadingAll(false), 600);
    }
  }

  function statusBadgeClass(status: JobStatus) {
    if (isDark) {
      if (status === "done") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      if (status === "error") return "bg-rose-500/15 text-rose-300 border-rose-500/40";
      if (status === "processing") return "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
      if (status === "skipped") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      return "bg-slate-700/30 text-slate-300 border-slate-600/50";
    }

    if (status === "done") return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (status === "error") return "bg-rose-100 text-rose-700 border-rose-300";
    if (status === "processing") return "bg-indigo-100 text-indigo-700 border-indigo-300";
    if (status === "skipped") return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-slate-200 text-slate-700 border-slate-300";
  }

  function statusLabel(status: JobStatus) {
    if (status === "done") return t.statusDone;
    if (status === "error") return t.statusError;
    if (status === "processing") return t.statusWorking;
    if (status === "skipped") return t.statusNoTool;
    return t.statusQueued;
  }

  return (
    <AppContext.Provider value={{ theme, isDark, locale, setLocale: (v) => setLocale(v as LocaleCode), setTheme }}>
    <div className={`min-h-screen overflow-x-hidden selection:bg-indigo-500 selection:text-white transition-colors duration-300 ${
      theme === "dark" ? "bg-[#09090e] text-slate-100" : "bg-[#f8f7f4] text-slate-900"
    }`}>
      {/* Skip-to-content link for keyboard / screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
      >
        {t.skipToContent}
      </a>

      {/* Live region for screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>

      {/* Decorative cosmic background (hidden from AT) — only in dark mode */}
      {isDark ? (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[50rem] w-[80rem] -translate-x-1/2 animate-drift opacity-40 mix-blend-screen bg-[radial-gradient(ellipse_at_top,rgba(26,115,232,0.45),transparent_60%),radial-gradient(ellipse_at_center,rgba(138,180,248,0.25),transparent_65%),radial-gradient(circle_at_80%_20%,rgba(197,138,249,0.35),transparent_50%)]" />
          <div className="absolute -bottom-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-indigo-950 via-purple-900/20 to-transparent blur-3xl" />
          <div className="absolute top-1/3 right-[-10rem] h-[35rem] w-[35rem] rounded-full bg-gradient-to-br from-blue-900/20 via-indigo-950 to-transparent blur-3xl animate-slow-spin" />
        </div>
      ) : (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[50rem] w-[80rem] -translate-x-1/2 animate-drift opacity-20 bg-[radial-gradient(ellipse_at_top,rgba(99,132,227,0.25),transparent_60%),radial-gradient(ellipse_at_center,rgba(165,180,252,0.2),transparent_65%),radial-gradient(circle_at_80%_20%,rgba(196,167,231,0.2),transparent_50%)]" />
        </div>
      )}

      <NavBar isDark={isDark} theme={theme} setTheme={setTheme} c={c} />

      {useLocation().pathname === '/' ? (
        <>
          <main id="main-content" tabIndex={-1} className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            {/* Hero */}
        <section aria-labelledby="hero-title" className="grid items-start gap-10 py-10 lg:grid-cols-[1fr_1.05fr] lg:py-14">
          <div className="max-w-2xl animate-rise">
            <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${isDark ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-200" : "border-indigo-300 bg-indigo-50 text-indigo-600"}`}>
              <span aria-hidden="true" className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400"></span>
              </span>
              {t.heroBadge}
            </p>
            <h1 id="hero-title" className={`mt-6 text-balance text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl ${c.textStrong}`}>
              {t.heroTitle1}{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {t.heroTitle2}
              </span>
            </h1>
            <p className={`mt-6 max-w-xl text-base leading-relaxed sm:text-lg ${c.textSoft}`}>
              {t.heroDesc}
            </p>
            <p className={`mt-3 max-w-xl text-xs leading-relaxed ${c.textMuted}`}>
              For best results, keep individual files under 50 MB and batch sizes under 10 files. Larger files or bigger batches may take longer to process in your browser.
            </p>
            <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold ${c.textSoft}`}>
              <li className="flex items-center gap-2"><span aria-hidden="true" className="text-indigo-400">✓</span> {t.stat1}</li>
              <li className="flex items-center gap-2"><span aria-hidden="true" className="text-indigo-400">✓</span> {t.stat2}</li>
              <li className="flex items-center gap-2"><span aria-hidden="true" className="text-indigo-400">✓</span> {t.stat3}</li>
            </ul>
          </div>

          {/* Upload + tool defaults card */}
          <div className="animate-rise-delayed relative">
            <div aria-hidden="true" className={`absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 ${isDark ? "opacity-25 blur-xl" : "opacity-15 blur-lg"}`}></div>

            <div
              className={`relative rounded-2xl border p-5 shadow-2xl backdrop-blur-xl sm:p-7 ${c.card}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
            >
              <div className={`mb-5 flex flex-wrap items-center justify-between gap-2 border-b pb-4 text-xs font-bold uppercase tracking-[0.18em] ${c.border}`}>
                <span className={`flex items-center gap-2 ${c.textSoft}`}>
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  {t.uploadQueue}
                </span>
                <span className={`rounded px-2 py-0.5 ${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                  {totalCount} file{totalCount === 1 ? "" : "s"}
                </span>
              </div>

              {/* Drop zone — accessible button */}
              <label htmlFor="epubforge-file-input" className="block">
                <span className="sr-only">Choose files to convert</span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className={`block w-full rounded-xl border-2 border-dashed p-6 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${isDark ? "border-slate-600 bg-slate-950/60 hover:border-indigo-400 hover:bg-slate-950 focus-visible:ring-offset-slate-900" : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-white focus-visible:ring-offset-white"}`}
                >
                  <span className={`block text-xl font-extrabold tracking-tight sm:text-2xl ${c.textStrong}`}>
                    {t.dropBrowse}
                  </span>
                  <span className={`mt-2 block text-sm leading-relaxed ${c.textSoft}`}>
                    {t.dropHelp}
                  </span>
                </button>
                <input
                  id="epubforge-file-input"
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".epub,.pdf,.txt,.html,.htm,.xhtml,.md,.markdown,.docx,.doc,.rtf,.fb2,.mobi,.azw,.azw3,.azw4,.prc,.pdb,.lit,.lrf,.chm,.djvu,.djv,.cbz,.cbr,.jpg,.jpeg,.png,.ppt,.pptx"
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(event.target.files);
                    if (event.target) event.target.value = "";
                  }}
                />
              </label>

              {/* Default tool */}
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="default-tool" className={`block text-xs font-bold uppercase tracking-widest ${c.textSoft}`}>
                    {t.defaultTool}
                  </label>
                  <p className={`mt-1 text-xs ${c.textMuted}`}>{selectedDefault.description}</p>
                </div>
                <select
                  id="default-tool"
                  value={defaultTool}
                  onChange={(event) => changeDefaultTool(event.target.value as ToolId)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400 ${c.input}`}
                >
                  {defaultToolOptions.some((tool) => tool.accepts.includes("epub")) ? (
                    <optgroup label={t.extractFrom}>
                      {defaultToolOptions
                        .filter((tool) => tool.accepts.includes("epub"))
                        .map((tool) => (
                          <option key={tool.id} value={tool.id}>
                            {tool.name}
                          </option>
                        ))}
                    </optgroup>
                  ) : null}
                  {defaultToolOptions.some((tool) => !tool.accepts.includes("epub")) ? (
                    <optgroup label={t.buildFrom}>
                      {defaultToolOptions
                        .filter((tool) => !tool.accepts.includes("epub"))
                        .map((tool) => (
                          <option key={tool.id} value={tool.id}>
                            {tool.name}
                          </option>
                        ))}
                    </optgroup>
                  ) : null}
                </select>
              </div>

              {/* Action row */}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runAll}
                  disabled={running || queuedCount === 0}
                  aria-busy={running}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 py-3 px-4 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/40 ring-1 ring-inset ring-white/15 transition hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 hover:shadow-indigo-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:from-slate-600 disabled:via-slate-600 disabled:to-slate-600 disabled:text-slate-300 disabled:shadow-none disabled:ring-slate-500/40"
                >
                  {running ? `Converting ${doneCount + 1} of ${totalCount}…` : `${t.convertFiles} ${queuedCount || "all"} ${queuedCount === 1 ? "file" : "files"}`}
                </button>
                <button
                  type="button"
                  onClick={downloadAll}
                  disabled={completedJobs.length === 0 || downloadingAll}
                  className={`rounded-xl border px-4 py-3 text-xs font-extrabold uppercase tracking-widest shadow-md transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
                    isDark
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 focus-visible:ring-offset-slate-900"
                      : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-offset-white"
                  }`}
                >
                  {downloadingAll ? (
                    <>
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Downloading...
                    </>
                  ) : (
                    `↓ ${t.downloadReady} ${completedJobs.length > 1 ? "all" : ""}`
                  )}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={totalCount === 0 || running}
                  className={`rounded-xl border px-4 py-3 text-xs font-extrabold uppercase tracking-widest transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "border-slate-500 bg-slate-700 text-slate-100 hover:border-rose-300 hover:bg-slate-600 hover:text-rose-100 focus-visible:ring-offset-slate-900" : "border-slate-300 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-offset-white"}`}
                >
                  {t.clear}
                </button>
              </div>

              {/* Overall progress */}
              {totalCount > 0 ? (
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{t.overallProgress}</span>
                    <span aria-hidden="true">{overallProgress}%</span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={overallProgress}
                    aria-label={`Overall conversion progress: ${overallProgress} percent`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {doneCount} {t.doneCount} · {errorCount} {t.errorCount}{errorCount === 1 ? "" : "s"} · {queuedCount} {t.pendingCount}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Job queue */}
        <section aria-labelledby="queue-title" className="mt-32 sm:mt-40 lg:mt-48">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="queue-title" className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${c.textStrong}`}>
                {t.queueTitle}
              </h2>
              <p className={`mt-1 text-sm ${c.textSoft}`}>
                {totalCount === 0 ? t.queueDescEmpty : t.queueDescFilled}
              </p>
            </div>
          </div>

          {totalCount === 0 ? (
            <div className={`rounded-2xl border border-dashed p-10 text-center ${isDark ? "border-slate-700 bg-slate-900/40" : "border-slate-300 bg-slate-50/50"}`}>
              <p className={`text-sm font-semibold ${c.textSoft}`}>{t.noFiles}</p>
              <p className={`mt-2 text-xs ${c.textMuted}`}>{t.noFilesHint}</p>
            </div>
          ) : (
            <ul className="grid gap-3" aria-label="File conversion queue">
              {jobs.map((job) => {
                const ext = job.detectedExt || getExtension(job.file.name);
                const compat = tools.filter((t) => t.accepts.includes(ext));
                const tool = tools.find((t) => t.id === job.tool);
                return (
                  <li
                    key={job.id}
                    className={`rounded-2xl border p-4 backdrop-blur-md sm:p-5 ${isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"}`}
                  >
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusBadgeClass(job.status)}`}
                          >
                            {statusLabel(job.status)}
                          </span>
                          <span className={`text-xs font-mono ${c.textMuted}`}>.{ext || "?"}</span>
                          <span className={`text-xs ${c.textMuted}`}>{formatBytes(job.file.size)}</span>
                        </div>
                        <p className={`mt-2 break-all text-base font-bold ${c.textStrong}`}>{job.file.name}</p>
                        {job.detectedFormat ? (
                          <p className={`mt-1 text-xs font-medium ${c.accent}`}>
                            🔍 {t.detected}: {job.detectedFormat}
                          </p>
                        ) : null}

                        {/* Per-file tool selector */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <label htmlFor={`tool-${job.id}`} className={`text-xs font-semibold ${c.textSoft}`}>
                            {t.toolLabel}:
                          </label>
                          <select
                            id={`tool-${job.id}`}
                            value={job.tool}
                            disabled={job.status === "processing" || running}
                            onChange={(event) => changeJobTool(job.id, event.target.value as ToolId)}
                            className={`rounded-md border px-2 py-1 text-xs font-semibold outline-none disabled:opacity-50 ${isDark ? "border-slate-700 bg-slate-950 text-indigo-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-400" : "border-slate-300 bg-slate-50 text-indigo-700 focus-visible:border-indigo-500 focus-visible:ring-indigo-500"}`}
                          >
                            {compat.length === 0 ? (
                              <option value={job.tool}>{t.noMatchingTool}</option>
                            ) : (
                              compat.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} → {t.output}
                                </option>
                              ))
                            )}
                          </select>
                          {tool ? (
                            <span className={`text-[11px] ${c.textMuted}`}>
                              {tool.input} → {tool.output}
                            </span>
                          ) : null}
                        </div>

                        {/* Per-file progress bar */}
                        <div className="mt-3">
                          <div
                            className={`h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={job.progress}
                            aria-label={`${job.file.name} progress: ${job.progress} percent`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                job.status === "error"
                                  ? "bg-rose-500"
                                  : job.status === "done"
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
                              }`}
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          {job.error ? (
                            <p className="mt-2 text-xs font-semibold text-rose-500">⚠ {job.error}</p>
                          ) : job.result ? (
                            <p className={`mt-2 text-xs ${c.textSoft}`}>{job.result.summary}</p>
                          ) : null}
                        </div>
                      </div>

                      {/* Per-file actions */}
                      <div className="flex flex-row gap-2 sm:flex-col">
                        {/* Read Ebook viewer trigger */}
                        {(job.detectedExt === "epub" || getExtension(job.file.name) === "epub" || job.detectedFormat === "EPUB Ebook" || job.result?.fileName.endsWith(".epub")) ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (job.result?.blob) {
                                openReaderForBlob(job.result.blob, job.file.name);
                              } else {
                                openReaderForJob(job);
                              }
                            }}
                            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-extrabold uppercase tracking-wider shadow-sm transition sm:flex-none ${isDark ? "border-indigo-300 bg-indigo-500/25 text-indigo-100 shadow-indigo-500/20 hover:bg-indigo-500/40 hover:text-white" : "border-indigo-300 bg-indigo-100 text-indigo-700 shadow-indigo-200/50 hover:bg-indigo-200 hover:text-indigo-800"}`}
                          >
                            📖 {t.readEbook}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => downloadResult(job)}
                          disabled={!job.result}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-extrabold uppercase tracking-wider shadow-sm transition disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-1.5 sm:flex-none ${isDark ? "border-emerald-300 bg-emerald-400/25 text-emerald-50 shadow-emerald-500/20 hover:bg-emerald-400/40 hover:text-white disabled:border-slate-500 disabled:bg-slate-700 disabled:text-slate-300" : "border-emerald-400 bg-emerald-100 text-emerald-800 shadow-emerald-200/50 hover:bg-emerald-200 hover:text-emerald-900 disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"}`}
                        >
                          {job.status === "processing" && job.result ? (
                            <>Downloading…</>
                          ) : (
                            <>↓ {t.download}</>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeJob(job.id)}
                          disabled={job.status === "processing"}
                          aria-label={`Remove ${job.file.name} from queue`}
                          className={`rounded-lg border px-3 py-2 text-xs font-extrabold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "border-slate-500 bg-slate-700 text-slate-100 hover:border-rose-300 hover:bg-slate-600 hover:text-rose-100" : "border-slate-300 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"}`}
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>

                    {/* Preview */}
                    {job.result?.preview ? (
                      <details className={`mt-4 rounded-lg border p-3 ${isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-slate-50"}`}>
                        <summary className={`cursor-pointer text-xs font-bold uppercase tracking-widest outline-none rounded ${c.accent}`}>
                          {t.preview}
                        </summary>
                        <pre className={`mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed ${c.textSoft}`}>
                          {job.result.preview}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Suite overview */}
      <section
        aria-labelledby="suite-title"
        className={`relative border-t px-4 py-16 sm:px-6 lg:px-8 ${c.section}`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className={`inline-block rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${isDark ? "border-indigo-400/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-indigo-200" : "border-indigo-300 bg-indigo-50 text-indigo-600"}`}>
              {t.catalogBadge}
            </p>
            <h2 id="suite-title" className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${c.textStrong}`}>
              {t.catalogTitle}
            </h2>
            <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${c.textSoft}`}>
              {t.catalogDesc}
            </p>
          </div>

          <div className="space-y-12">
            <article>
              <h3 className={`mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-wider ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
                <span className={`h-px flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></span>
                ✦ {t.extractFrom}
                <span className={`h-px flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {epubTools.map((tool) => (
                  <div key={tool.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition hover:scale-[1.02] ${c.cardFlat}`}>
                    <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{tool.name}</span>
                    <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${isDark ? "border-slate-700 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                      {tool.output}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article>
              <h3 className={`mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-wider ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
                <span className={`h-px flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></span>
                ✦ {t.buildFrom}
                <span className={`h-px flex-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {builderTools.map((tool) => (
                  <div key={tool.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition hover:scale-[1.02] ${c.cardFlat}`}>
                    <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{tool.name}</span>
                    <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${isDark ? "border-slate-700 bg-slate-950 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                      {tool.input}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SEO content block — semantic FAQ for crawlers */}
      <section
        aria-labelledby="faq-title"
        className={`border-t px-4 py-16 sm:px-6 lg:px-8 ${c.section}`}
      >
        <div className="mx-auto max-w-5xl">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${c.accent}`}>FAQ</p>
          <h2 id="faq-title" className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${c.textStrong}`}>
            {t.faqTitle}
          </h2>
          <dl className={`mt-8 grid gap-6 sm:grid-cols-2`}>
            <div>
              <dt className={`text-base font-bold ${c.textStrong}`}>{t.faqQ1}</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${c.textSoft}`}>{t.faqA1}</dd>
            </div>
            <div>
              <dt className={`text-base font-bold ${c.textStrong}`}>{t.faqQ2}</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${c.textSoft}`}>{t.faqA2}</dd>
            </div>
            <div>
              <dt className={`text-base font-bold ${c.textStrong}`}>{t.faqQ3}</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${c.textSoft}`}>{t.faqA3}</dd>
            </div>
            <div>
              <dt className={`text-base font-bold ${c.textStrong}`}>{t.faqQ4}</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${c.textSoft}`}>{t.faqA4}</dd>
            </div>
            <div>
              <dt className={`text-base font-bold ${c.textStrong}`}>{t.faqQ5}</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${c.textSoft}`}>{t.faqA5}</dd>
            </div>
            <div>
              <dt className={`text-base font-bold ${c.textStrong}`}>{t.faqQ6}</dt>
              <dd className={`mt-2 text-sm leading-relaxed ${c.textSoft}`}>{t.faqA6}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── EPUB Ebook Reader Overlay Workspace ── */}
      {viewerEpub ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Reading: ${viewerEpub.title}`}
          className="fixed inset-0 z-50 flex flex-col bg-[#09090e] text-slate-100"
        >
          {/* Top Bar */}
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setViewerSidebarOpen(!viewerSidebarOpen)}
                aria-expanded={viewerSidebarOpen}
                aria-label="Toggle table of contents"
                className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h3 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                {viewerEpub.title}
              </h3>
            </div>

            {/* Display & Font Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Font Style */}
              <select
                aria-label="Select font style"
                value={viewerFontFamily}
                onChange={(e) => setViewerFontFamily(e.target.value as "serif" | "sans" | "mono")}
                className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-200 outline-none border border-slate-700 focus:border-indigo-500"
              >
                <option value="serif">Serif (Georgia)</option>
                <option value="sans">Sans-Serif</option>
                <option value="mono">Monospace</option>
              </select>

              {/* Font Sizing */}
              <div className="flex items-center border border-slate-700 rounded overflow-hidden bg-slate-800">
                <button
                  type="button"
                  aria-label="Decrease font size"
                  disabled={viewerFontSize === "sm"}
                  onClick={() => {
                    const sizes: ("sm" | "base" | "lg" | "xl" | "2xl")[] = ["sm", "base", "lg", "xl", "2xl"];
                    const idx = sizes.indexOf(viewerFontSize);
                    if (idx > 0) setViewerFontSize(sizes[idx - 1]);
                  }}
                  className="px-2.5 py-1 text-xs font-bold hover:bg-slate-700 disabled:opacity-30"
                >
                  A-
                </button>
                <button
                  type="button"
                  aria-label="Increase font size"
                  disabled={viewerFontSize === "2xl"}
                  onClick={() => {
                    const sizes: ("sm" | "base" | "lg" | "xl" | "2xl")[] = ["sm", "base", "lg", "xl", "2xl"];
                    const idx = sizes.indexOf(viewerFontSize);
                    if (idx < sizes.length - 1) setViewerFontSize(sizes[idx + 1]);
                  }}
                  className="px-2.5 py-1 text-xs font-bold border-l border-slate-700 hover:bg-slate-700 disabled:opacity-30"
                >
                  A+
                </button>
              </div>

              {/* Theme selection */}
              <div className="flex items-center border border-slate-700 rounded overflow-hidden bg-slate-800">
                {(["light", "sepia", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setViewerTheme(t)}
                    aria-current={viewerTheme === t}
                    aria-label={`${t} reader theme`}
                    className={`px-2 py-1 text-xs font-bold capitalize border-r last:border-r-0 border-slate-700 hover:bg-slate-700 ${
                      viewerTheme === t ? "bg-indigo-600 text-white hover:bg-indigo-600" : "text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Close Reader button */}
              <button
                type="button"
                onClick={() => setViewerEpub(null)}
                aria-label="Close ebook reader"
                className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-xs font-extrabold text-rose-200 transition hover:bg-rose-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                ✕ Exit
              </button>
            </div>
          </header>

          {/* Main Reader Layout Workspace */}
          <div className="relative flex flex-1 overflow-hidden">
            {/* Table of Contents Sidebar */}
            <aside
              aria-label="Table of contents"
              className={`absolute inset-y-0 left-0 z-40 w-72 transform border-r border-slate-850 bg-slate-900 transition-transform duration-300 ease-in-out ${
                viewerSidebarOpen ? "translate-x-0" : "-translate-x-full"
              } lg:relative lg:translate-x-0 lg:block`}
            >
              <div className="flex items-center justify-between border-b border-slate-850 px-4 py-3 lg:hidden">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contents</span>
                <button
                  type="button"
                  onClick={() => setViewerSidebarOpen(false)}
                  aria-label="Close sidebar"
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <nav className="h-full overflow-y-auto p-3">
                <ol className="space-y-1" aria-label="Ebook chapter list">
                  {viewerEpub.chapters.map((chapter, i) => (
                    <li key={chapter.id || i}>
                      <button
                        type="button"
                        onClick={() => {
                          setViewerChapterIdx(i);
                          setViewerSidebarOpen(false);
                        }}
                        aria-current={viewerChapterIdx === i ? "page" : undefined}
                        className={`w-full rounded px-3 py-2 text-left text-xs font-semibold transition break-words ${
                          viewerChapterIdx === i
                            ? "bg-indigo-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {i + 1}. {chapter.title}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            {/* Reader Text container */}
            <main
              id="reader-main"
              tabIndex={-1}
              className={`flex-1 overflow-y-auto px-6 py-10 transition duration-300 ${
                viewerTheme === "light"
                  ? "bg-slate-50 text-slate-900"
                  : viewerTheme === "sepia"
                  ? "bg-[#f4eccf] text-[#433422]"
                  : "bg-[#0c0c14] text-slate-200"
              }`}
            >
              <article
                className={`mx-auto max-w-2xl leading-relaxed ${
                  viewerFontFamily === "serif"
                    ? "font-serif"
                    : viewerFontFamily === "mono"
                    ? "font-mono"
                    : "font-sans"
                } ${
                  viewerFontSize === "sm"
                    ? "text-sm"
                    : viewerFontSize === "base"
                    ? "text-base"
                    : viewerFontSize === "lg"
                    ? "text-lg"
                    : viewerFontSize === "xl"
                    ? "text-xl"
                    : "text-2xl"
                }`}
              >
                {/* Chapter title */}
                <h2
                  className={`mb-8 font-sans font-black tracking-tight border-b pb-4 leading-tight ${
                    viewerTheme === "light"
                      ? "border-slate-300 text-slate-950"
                      : viewerTheme === "sepia"
                      ? "border-[#d7caa5] text-[#2a1d0d]"
                      : "border-slate-800 text-white"
                  }`}
                >
                  {viewerEpub.chapters[viewerChapterIdx]?.title || "Chapter"}
                </h2>

                {/* Chapter HTML / Text with rewritten image sources */}
                <div
                  className="space-y-5"
                  dangerouslySetInnerHTML={{
                    __html: rewriteImageSrc(
                      getBodyHtml(viewerEpub.chapters[viewerChapterIdx]?.html || ""),
                      viewerEpub.chapters[viewerChapterIdx]?.href || "",
                      viewerEpub.images,
                    ),
                  }}
                />

                {/* Bottom Navigation */}
                <nav aria-label="Reader paging" className="mt-14 flex items-center justify-between border-t pt-6 border-slate-700/30">
                  <button
                    type="button"
                    disabled={viewerChapterIdx === 0}
                    onClick={() => {
                      setViewerChapterIdx((prev) => Math.max(0, prev - 1));
                      document.getElementById("reader-main")?.focus();
                    }}
                    className={`rounded-lg px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition ${
                      viewerTheme === "light"
                        ? "bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:opacity-40"
                        : viewerTheme === "sepia"
                        ? "bg-[#e3d7b3] text-[#433422] hover:bg-[#d7caa5] disabled:opacity-40"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                    }`}
                  >
                    ← Previous
                  </button>
                  <span className="text-xs font-bold">
                    Chapter {viewerChapterIdx + 1} of {viewerEpub.chapters.length}
                  </span>
                  <button
                    type="button"
                    disabled={viewerChapterIdx === viewerEpub.chapters.length - 1}
                    onClick={() => {
                      setViewerChapterIdx((prev) => Math.min(viewerEpub.chapters.length - 1, prev + 1));
                      document.getElementById("reader-main")?.focus();
                    }}
                    className={`rounded-lg px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition ${
                      viewerTheme === "light"
                        ? "bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:opacity-40"
                        : viewerTheme === "sepia"
                        ? "bg-[#e3d7b3] text-[#433422] hover:bg-[#d7caa5] disabled:opacity-40"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                    }`}
                  >
                    Next →
                  </button>
                </nav>
              </article>
            </main>
          </div>
        </div>
      ) : null}
        </>
      ) : (
        <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 min-h-[60vh]">
          <Routes>
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
          </Routes>
        </div>
      )}

      <Analytics />
      <SpeedInsights />

      <footer className={`border-t ${isDark ? "bg-[#09090e] border-slate-800 text-slate-400" : "bg-[#f8f9fa] border-slate-200 text-slate-500"}`}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[1px]">
                  <div className={`flex h-full w-full items-center justify-center rounded-[6px] ${isDark ? "bg-[#09090e]" : "bg-white"}`}>
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-xs font-black text-transparent">E</span>
                  </div>
                </div>
                <span className={`text-sm font-extrabold tracking-widest ${isDark ? "text-white" : "text-slate-900"}`}>
                  EPUBFORGE
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">
                Free, private, in-browser ebook converter.
              </p>
              <div className="mt-4 flex gap-3">
                <a href="#" aria-label="Twitter" className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${isDark ? "border-slate-700 hover:text-indigo-400" : "border-slate-300 hover:text-indigo-600"}`}>𝕏</a>
                <a href="#" aria-label="GitHub" className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${isDark ? "border-slate-700 hover:text-indigo-400" : "border-slate-300 hover:text-indigo-600"}`}>⌨</a>
              </div>
            </div>

            {/* Company column */}
            <div>
              <h3 className={`mb-4 text-xs font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white" : "text-slate-900"}`}>Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="transition hover:text-indigo-500">About</Link></li>
                <li><Link to="/blog" className="transition hover:text-indigo-500">Blog</Link></li>
                <li><Link to="/contact" className="transition hover:text-indigo-500">Contact</Link></li>
                <li><Link to="/faq" className="transition hover:text-indigo-500">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <h3 className={`mb-4 text-xs font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white" : "text-slate-900"}`}>Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/privacy" className="transition hover:text-indigo-500">Privacy Policy</Link></li>
                <li><Link to="/terms" className="transition hover:text-indigo-500">Terms of Service</Link></li>
                <li><Link to="/cookies" className="transition hover:text-indigo-500">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Language column */}
            <div>
              <h3 className={`mb-4 text-xs font-extrabold uppercase tracking-[0.15em] ${isDark ? "text-white" : "text-slate-900"}`}>Language</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🌐</span>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as LocaleCode)}
                  className={`bg-transparent font-medium outline-none ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {localeOptions.map((opt) => (
                    <option key={opt.code} value={opt.code} className={isDark ? "bg-slate-800" : "bg-white"}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`border-t px-4 py-4 text-center text-xs sm:px-6 lg:px-8 ${isDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
          Copyright © {new Date().getFullYear()} EPUBForge. {t.copyrightNotice}
        </div>
      </footer>
    </div>
    </AppContext.Provider>
  );
}