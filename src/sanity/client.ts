import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const projectId = env?.VITE_SANITY_PROJECT_ID || "";
const dataset = env?.VITE_SANITY_DATASET || "production";

export const isSanityConfigured = Boolean(projectId);

export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion: "2024-01-01",
  useCdn: true,
});

const builder = imageUrlBuilder(client);

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source);
}