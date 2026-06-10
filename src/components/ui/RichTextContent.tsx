import sanitizeHtml from "sanitize-html";

const YOUTUBE_EMBED = /^https:\/\/(www\.youtube(?:-nocookie)?\.com|youtube\.com)\/embed\//i;
const JAVASCRIPT_SRC = /^\s*javascript:/i;

const STYLE_TAGS = ["p", "h2", "h3", "li", "blockquote", "td", "th", "span", "mark", "div", "figure"];

interface Props {
  content:    string;
  className?: string;
}

export function RichTextContent({ content, className = "" }: Props) {
  const safe = sanitizeHtml(content, {
    allowedTags: [
      "p", "strong", "em", "u", "s", "h2", "h3",
      "ul", "ol", "li", "blockquote", "hr", "a", "br", "img",
      "span", "mark",
      "table", "thead", "tbody", "tr", "td", "th",
      "div", "iframe", "figure",
    ],
    allowedAttributes: {
      a:      ["href", "target", "rel"],
      img:    ["src", "alt", "width", "height"],
      iframe: ["src", "frameborder", "allowfullscreen", "allow"],
      table:  ["style"],
      tr:     ["style"],
      div:    ["style", "data-youtube-video"],
      ...Object.fromEntries(STYLE_TAGS.map((t) => [t, ["style"]])),
      td:     ["style", "colspan", "rowspan"],
      th:     ["style", "colspan", "rowspan"],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
      }),
      img: (tagName, attribs) => {
        if (JAVASCRIPT_SRC.test(attribs.src ?? "")) return { tagName: "", attribs: {} };
        return { tagName, attribs };
      },
      iframe: (tagName, attribs) => {
        if (!YOUTUBE_EMBED.test(attribs.src ?? "")) return { tagName: "", attribs: {} };
        return { tagName, attribs };
      },
    },
  });

  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
