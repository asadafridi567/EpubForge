import path from "path";
import { fileURLToPath } from "url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { viteSingleFile } from "vite-plugin-singlefile";
import Sitemap from "vite-plugin-sitemap";

import { getBlogRoutes } from "./scripts/getBlogRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async () => {
  const blogRoutes = await getBlogRoutes();

  return {
    plugins: [
      react(),

      tailwindcss(),

      viteSingleFile(),

      Sitemap({
        hostname: "https://epubforge.com",

        dynamicRoutes: [
          "/",
          "/blog",
          ...blogRoutes,
        ],

        // ✅ Fix: explicitly tell the plugin where dist is
        // so it can create robots.txt even when viteSingleFile changes output structure
        outDir: "dist",

        // ✅ Generate robots.txt directly from the plugin
        // instead of relying on it being copied from public/
        robots: [
          {
            userAgent: "*",
            allow: "/",
          },
        ],
      }),
    ],

    build: {
      // ✅ Explicitly set outDir so both plugins agree on the output folder
      outDir: "dist",
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});