/**
 * Sanitize user input for use in Supabase PostgREST filter strings.
 * Escapes characters that have special meaning in PostgREST syntax:
 * commas, parentheses, dots, and percent signs.
 */
export function sanitizeSearch(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .replace(/\./g, "")
    .trim()
    .slice(0, 100); // Limit length
}
