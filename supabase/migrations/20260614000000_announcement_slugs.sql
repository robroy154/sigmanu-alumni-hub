-- Add slug column to announcements
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Backfill slugs for existing announcements using title
-- Slugify: lowercase, replace non-alphanumeric with hyphens, collapse multiple hyphens, trim
UPDATE public.announcements
SET slug = regexp_replace(
  regexp_replace(
    regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'),
    '-+', '-', 'g'
  ),
  '^-|-$', '', 'g'
)
WHERE slug IS NULL;

-- Handle slug collisions by appending the first 6 chars of the ID
UPDATE public.announcements a
SET slug = a.slug || '-' || substring(a.id::text, 1, 6)
WHERE (
  SELECT COUNT(*) FROM public.announcements b
  WHERE b.slug = a.slug AND b.id != a.id
) > 0;
