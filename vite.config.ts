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
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});