const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Returns a Supabase `.eq()` filter pair for a UUID-or-slug lookup.
 * UUID format → query by `id`. Anything else → query by `slug`.
 * This keeps all event [id] routes backwards-compatible.
 */
export function eventLookupFilter(
  idOrSlug: string
): { column: "id" | "slug"; value: string } {
  return isUuid(idOrSlug)
    ? { column: "id",   value: idOrSlug }
    : { column: "slug", value: idOrSlug };
}

/**
 * Builds the canonical href for an event, preferring the slug when available.
 * Falls back to the UUID id so existing links never break.
 */
export function eventHref(event: { id: string; slug: string | null }): string {
  return `/events/${event.slug ?? event.id}`;
}

/** Generate a URL-safe slug from a title string. */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
