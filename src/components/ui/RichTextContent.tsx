/**
 * Read-only rich text renderer.
 * Sanitizes HTML before rendering to prevent XSS.
 * Server component safe (no "use client" — pure rendering).
 */

const ALLOWED_TAGS = new Set([
  "p", "strong", "em", "u", "s", "h2", "h3",
  "ul", "ol", "li", "blockquote", "hr", "a", "br", "img",
  "span",   // Tiptap TextStyle: font-size, color
  "mark",   // Tiptap Highlight
  "table", "thead", "tbody", "tr", "td", "th", // Tiptap Table
  "div",    // YouTube embed wrapper (data-youtube-video)
  "iframe", // YouTube embed (src restricted to youtube.com/embed)
  "figure", // Optional YouTube wrapper
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a:       ["href", "target", "rel"],
  img:     ["src", "alt", "width", "height", "style"],
  span:    ["style"], // font-size, color from TextStyle/FontSize/Color
  mark:    ["style"], // background-color from Highlight
  table:   ["style"],
  tr:      ["style"],
  td:      ["style", "colspan", "rowspan"],
  th:      ["style", "colspan", "rowspan"],
  p:       ["style"], // text-align from TextAlign
  h2:      ["style"],
  h3:      ["style"],
  li:      ["style"],
  blockquote: ["style"],
  div:     ["data-youtube-video"],
  iframe:  ["src", "width", "height", "frameborder", "allowfullscreen", "allow"],
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

  const SELF_CLOSING = new Set(["hr", "br", "img"]);

  safe = safe.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*?)\s*\/?>/gi, (match, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(t)) {
      return "";
    }

    const allowedAttrNames = ALLOWED_ATTRS[t] ?? [];

    if (allowedAttrNames.length === 0) {
      if (match.startsWith("</")) return `</${t}>`;
      return SELF_CLOSING.has(t) ? `<${t} />` : `<${t}>`;
    }

    // Parse attributes — handle both quoted and unquoted, and data-* attrs
    const attrPairs = [...attrs.matchAll(/([\w-][\w-]*)(?:="([^"]*)")?/g)];
    const safeAttrs = attrPairs
      .filter(([, name]) => name !== undefined && allowedAttrNames.includes(name.toLowerCase()))
      .map(([, name, val]) => {
        if (name === undefined) return "";
        const n = name.toLowerCase();
        const v = val ?? "";

        // Block javascript: in href/src
        if ((n === "href" || n === "src") && /^\s*javascript:/i.test(v)) return "";

        // Restrict iframe src to YouTube embed URLs only
        if (t === "iframe" && n === "src") {
          if (
            !/^https:\/\/(www\.youtube(?:-nocookie)?\.com|youtube\.com)\/embed\//i.test(v)
          ) return "";
        }

        // Block javascript: in style values
        if (n === "style" && /javascript:/i.test(v)) return "";

        return val !== undefined ? `${name}="${v}"` : name;
      })
      .filter(Boolean)
      .join(" ");

    if (match.startsWith("</")) return `</${t}>`;

    if (t === "a") {
      return `<${t} ${safeAttrs} target="_blank" rel="noopener noreferrer">`;
    }
    if (SELF_CLOSING.has(t)) {
      return safeAttrs ? `<${t} ${safeAttrs} />` : `<${t} />`;
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
