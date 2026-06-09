/**
 * Read-only rich text renderer.
 * Uses DOMPurify (isomorphic-dompurify) for HTML sanitization.
 * Server component safe — isomorphic-dompurify polyfills JSDOM on Node.js.
 */
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "strong", "em", "u", "s", "h2", "h3",
  "ul", "ol", "li", "blockquote", "hr", "a", "br", "img",
  "span",   // Tiptap TextStyle: font-size, color
  "mark",   // Tiptap Highlight
  "table", "thead", "tbody", "tr", "td", "th",
  "div",    // YouTube embed wrapper (data-youtube-video)
  "iframe", // YouTube embed (src restricted to youtube.com/embed by hook below)
  "figure",
];

const ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "alt", "width", "height",
  "style",
  "colspan", "rowspan",
  "frameborder", "allowfullscreen", "allow",
  "data-youtube-video",
];

const YOUTUBE_EMBED = /^https:\/\/(www\.youtube(?:-nocookie)?\.com|youtube\.com)\/embed\//i;

// Module-level hooks run once per environment; safe since we always want these restrictions.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  const el = node as HTMLElement;
  const tag = el.tagName?.toUpperCase();

  // Remove any iframe whose src is not a YouTube embed URL
  if (tag === "IFRAME") {
    const src = el.getAttribute?.("src") ?? "";
    if (!YOUTUBE_EMBED.test(src)) {
      el.parentNode?.removeChild(el);
    }
  }

  // Force all links to open in a new tab safely
  if (tag === "A") {
    el.setAttribute?.("target", "_blank");
    el.setAttribute?.("rel", "noopener noreferrer");
  }
});

interface Props {
  content:    string;
  className?: string;
}

export function RichTextContent({ content, className = "" }: Props) {
  const safe = DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: true,
  }) as string;

  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
