/**
 * Read-only rich text renderer.
 * Sanitizes HTML before rendering to prevent XSS.
 * Server component safe (no "use client" — pure rendering).
 */

const ALLOWED_TAGS = new Set([
  "p", "strong", "em", "u", "s", "h2", "h3",
  "ul", "ol", "li", "blockquote", "hr", "a", "br",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
};

/**
 * Strips any HTML tags not in the allowlist.
 * Attribute allow-listing prevents href="javascript:" and similar.
 */
function sanitize(html: string): string {
  // Remove script/style blocks first
  let safe = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Replace disallowed tags with their text content (keep content, strip tag)
  safe = safe.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(t)) {
      // Self-closing: drop entirely. Opening/closing: drop tag, keep content.
      return "";
    }
    // For allowed tags, strip disallowed attributes
    const allowedAttrNames = ALLOWED_ATTRS[t] ?? [];
    if (allowedAttrNames.length === 0) {
      return match.startsWith("</") ? `</${t}>` : `<${t}>`;
    }
    // Keep only explicitly allowed attributes
    const attrPairs = [...attrs.matchAll(/(\w[\w-]*)="([^"]*)"/g)];
    const safeAttrs = attrPairs
      .filter(([, name]) => name !== undefined && allowedAttrNames.includes(name.toLowerCase()))
      .map(([, name, val]) => {
        if (name === undefined || val === undefined) return "";
        // Prevent javascript: href
        if (name.toLowerCase() === "href" && /^\s*javascript:/i.test(val)) return "";
        return `${name}="${val}"`;
      })
      .filter(Boolean)
      .join(" ");

    if (match.startsWith("</")) return `</${t}>`;
    // Force external links to open in new tab safely
    if (t === "a") {
      return `<${t} ${safeAttrs} target="_blank" rel="noopener noreferrer">`;
    }
    return safeAttrs ? `<${t} ${safeAttrs}>` : `<${t}>`;
  });

  return safe;
}

interface Props {
  content:    string;
  className?: string;
}

export function RichTextContent({ content, className = "" }: Props) {
  const safe = sanitize(content);

  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
