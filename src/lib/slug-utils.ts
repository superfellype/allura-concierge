import slugifyLib from "slugify";

/**
 * Generate a URL-friendly slug from a string
 * Uses slugify library for consistent, safe slug generation
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: "pt",
    trim: true,
  });
}

/**
 * Sanitize an existing slug to ensure it's valid
 */
export function sanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== "string") {
    return "";
  }

  return slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
