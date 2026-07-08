import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize a URL for use in an `href` on user-generated content. Returns the
 * URL only if it is a safe navigable scheme (http/https/mailto), a same-origin
 * relative path, or a fragment; otherwise returns undefined so the caller
 * renders a non-navigable link. Blocks javascript:, data:, vbscript:, etc. —
 * including scheme-smuggling via embedded control characters/whitespace.
 */
export function safeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed
  // Strip control chars/whitespace that can hide a scheme (e.g. "java\tscript:").
  const cleaned = trimmed.replace(/[\x00-\x20\x7f]/g, "")
  return /^(https?:|mailto:)/i.test(cleaned) ? trimmed : undefined
}
