import { parse, Node as HtmlNode, NodeType, HTMLElement as ParsedElement } from "node-html-parser";

// ---------------------------------------------------------------------------
// Inline styles used for email-safe rendering
// ---------------------------------------------------------------------------
const STYLES = {
  p:          `color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;margin:0 0 14px;font-family:Arial,sans-serif;`,
  strong:     `font-weight:600;color:#ffffff;`,
  em:         `font-style:italic;`,
  u:          `text-decoration:underline;`,
  s:          `text-decoration:line-through;`,
  h2:         `color:#C6A75E;font-size:20px;font-weight:700;margin:20px 0 8px;font-family:Arial,sans-serif;`,
  h3:         `color:#C6A75E;font-size:17px;font-weight:700;margin:16px 0 6px;font-family:Arial,sans-serif;`,
  hr:         `border:none;border-top:1px solid rgba(198,167,94,0.2);margin:20px 0;`,
  a:          `color:#C6A75E;text-decoration:underline;`,
  img_base:   `max-width:100%;height:auto;display:block;margin:12px 0;border-radius:6px;`,
  li_bullet:  `color:rgba(255,255,255,0.85);font-size:15px;padding:2px 8px 2px 0;vertical-align:top;font-family:Arial,sans-serif;`,
  li_text:    `color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;padding-bottom:4px;font-family:Arial,sans-serif;`,
  bq_border:  `width:3px;background:#C6A75E;`,
  bq_text:    `color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;padding:2px 0 2px 12px;font-style:italic;font-family:Arial,sans-serif;`,
  span_base:  `color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;`,
  td_base:    `border:1px solid rgba(255,255,255,0.2);padding:6px 10px;font-size:14px;font-family:Arial,sans-serif;color:rgba(255,255,255,0.85);`,
  th_base:    `border:1px solid rgba(255,255,255,0.2);padding:6px 10px;font-size:14px;font-family:Arial,sans-serif;color:#C6A75E;font-weight:700;background:rgba(198,167,94,0.1);`,
  yt_btn:     `display:inline-block;background:#C6A75E;color:#0B0B0C;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:10px 24px;border-radius:8px;text-decoration:none;`,
};

// ---------------------------------------------------------------------------
// Extract a specific CSS property value from an inline style string
// ---------------------------------------------------------------------------
function getStyleProp(style: string, prop: string): string | null {
  const re = new RegExp(`${prop}:\\s*([^;]+)`, "i");
  return re.exec(style)?.[1]?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// Serialize a single DOM node to email-safe HTML
// ---------------------------------------------------------------------------
function serializeNode(node: HtmlNode): string {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return node.rawText;
  }

  if (node.nodeType !== NodeType.ELEMENT_NODE) return "";

  const el    = node as ParsedElement;
  const tag   = el.tagName?.toLowerCase() ?? "";
  const inner = () => el.childNodes.map((c) => serializeNode(c)).join("");

  switch (tag) {
    case "p": {
      // Preserve text-align if present
      const style     = el.getAttribute("style") ?? "";
      const textAlign = getStyleProp(style, "text-align");
      const align     = textAlign !== null ? `text-align:${textAlign};` : "";
      return `<p style="${STYLES.p}${align}">${inner()}</p>`;
    }

    case "strong":
      return `<strong style="${STYLES.strong}">${inner()}</strong>`;

    case "em":
      return `<em style="${STYLES.em}">${inner()}</em>`;

    case "u":
      return `<u style="${STYLES.u}">${inner()}</u>`;

    case "s":
      return `<s style="${STYLES.s}">${inner()}</s>`;

    case "h2": {
      const style     = el.getAttribute("style") ?? "";
      const textAlign = getStyleProp(style, "text-align");
      const align     = textAlign !== null ? `text-align:${textAlign};` : "";
      return `<p style="${STYLES.h2}${align}">${inner()}</p>`;
    }

    case "h3": {
      const style     = el.getAttribute("style") ?? "";
      const textAlign = getStyleProp(style, "text-align");
      const align     = textAlign !== null ? `text-align:${textAlign};` : "";
      return `<p style="${STYLES.h3}${align}">${inner()}</p>`;
    }

    case "hr":
      return `<hr style="${STYLES.hr}">`;

    case "br":
      return `<br>`;

    case "a": {
      const href = el.getAttribute("href") ?? "#";
      if (/^\s*javascript:/i.test(href)) return inner();
      return `<a href="${href}" style="${STYLES.a}">${inner()}</a>`;
    }

    case "img": {
      // Images uploaded via the rich text editor use the CDN URL pattern
      // (/cdn/rich-text-images/...) which resolves correctly in email clients
      // since it maps to the production domain via Next.js rewrite.
      const src = el.getAttribute("src") ?? "";
      if (/^\s*javascript:/i.test(src)) return "";
      const alt          = el.getAttribute("alt") ?? "";
      const inlineStyle  = el.getAttribute("style") ?? "";
      const widthMatch   = /width:\s*(\d+)px/i.exec(inlineStyle);
      if (widthMatch?.[1] !== undefined) {
        const w = widthMatch[1];
        return `<img src="${src}" alt="${alt}" width="${w}" style="${STYLES.img_base}width:${w}px;">`;
      }
      return `<img src="${src}" alt="${alt}" style="${STYLES.img_base}max-width:560px;">`;
    }

    case "ul": {
      const rows = el.childNodes
        .filter((c): c is ParsedElement => c.nodeType === NodeType.ELEMENT_NODE && (c as ParsedElement).tagName?.toLowerCase() === "li")
        .map((li) => {
          const liInner = li.childNodes.map((c) => serializeNode(c)).join("");
          return `<tr><td style="${STYLES.li_bullet}" valign="top">·</td><td style="${STYLES.li_text}">${liInner}</td></tr>`;
        })
        .join("");
      return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">${rows}</table>`;
    }

    case "ol": {
      let counter = 0;
      const rows = el.childNodes
        .filter((c): c is ParsedElement => c.nodeType === NodeType.ELEMENT_NODE && (c as ParsedElement).tagName?.toLowerCase() === "li")
        .map((li) => {
          counter++;
          const liInner = li.childNodes.map((c) => serializeNode(c)).join("");
          return `<tr><td style="${STYLES.li_bullet}" valign="top">${counter}.</td><td style="${STYLES.li_text}">${liInner}</td></tr>`;
        })
        .join("");
      return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">${rows}</table>`;
    }

    case "li":
      return inner();

    case "blockquote": {
      return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;width:100%;">
  <tr>
    <td style="${STYLES.bq_border}">&nbsp;</td>
    <td style="${STYLES.bq_text}">${inner()}</td>
  </tr>
</table>`;
    }

    case "span": {
      const style         = el.getAttribute("style") ?? "";
      const fontSizeMatch = /font-size:\s*(\d+px)/i.exec(style);
      const colorMatch    = /(?:^|;)\s*color:\s*([^;]+)/i.exec(style);

      if (fontSizeMatch !== null) {
        const fontSize = fontSizeMatch[1] ?? "";
        const colorPart = (colorMatch !== null && colorMatch[1] !== undefined)
          ? `color:${colorMatch[1].trim()};`
          : `color:rgba(255,255,255,0.85);`;
        return `<span style="${colorPart}font-size:${fontSize};font-family:Arial,sans-serif;">${inner()}</span>`;
      }
      if (colorMatch !== null && colorMatch[1] !== undefined) {
        return `<span style="color:${colorMatch[1].trim()};font-family:Arial,sans-serif;">${inner()}</span>`;
      }
      return inner();
    }

    case "mark": {
      // Tiptap Highlight — convert to <span> with background-color
      const style    = el.getAttribute("style") ?? "";
      const bgMatch  = /background(?:-color)?:\s*([^;]+)/i.exec(style);
      const bgColor  = bgMatch?.[1]?.trim() ?? "#C6A75E";
      return `<span style="background-color:${bgColor};color:#0B0B0C;padding:1px 3px;border-radius:2px;">${inner()}</span>`;
    }

    case "table": {
      return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:0 0 14px;">${inner()}</table>`;
    }

    case "thead":
    case "tbody":
      return `<${tag}>${inner()}</${tag}>`;

    case "tr":
      return `<tr>${inner()}</tr>`;

    case "td": {
      const style     = el.getAttribute("style") ?? "";
      const textAlign = getStyleProp(style, "text-align");
      const align     = textAlign !== null ? `text-align:${textAlign};` : "";
      return `<td style="${STYLES.td_base}${align}">${inner()}</td>`;
    }

    case "th": {
      const style     = el.getAttribute("style") ?? "";
      const textAlign = getStyleProp(style, "text-align");
      const align     = textAlign !== null ? `text-align:${textAlign};` : "";
      return `<th style="${STYLES.th_base}${align}">${inner()}</th>`;
    }

    case "div": {
      // YouTube embed: <div data-youtube-video><iframe src="..."></iframe></div>
      if (el.getAttribute("data-youtube-video") !== null) {
        // Extract the iframe src to derive the original YouTube watch URL
        const iframeEl = el.querySelector("iframe");
        const src      = iframeEl?.getAttribute("src") ?? "";
        // Extract video ID from embed URL (e.g. /embed/dQw4w9WgXcQ?...)
        const videoIdMatch = /\/embed\/([^?&]+)/i.exec(src);
        const videoId      = videoIdMatch !== null ? videoIdMatch[1] : "";
        const watchUrl     = videoId !== ""
          ? `https://www.youtube.com/watch?v=${videoId}`
          : "https://www.youtube.com";
        return `<p style="text-align:center;margin:16px 0;"><a href="${watchUrl}" style="${STYLES.yt_btn}">&#9654; Watch on YouTube &#8594;</a></p>`;
      }
      // Generic div — strip tag, keep content
      return inner();
    }

    case "figure":
      return inner();

    case "script":
    case "style":
      return "";

    default:
      return inner();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts Tiptap HTML (stored in announcements.body) to email-safe HTML with
 * all styles inlined. Email clients strip <style> blocks and CSS classes, so
 * every element carries its own inline style attribute.
 */
export function serializeRichTextToEmail(html: string): string {
  if (!html || html.trim() === "") return "";

  const root = parse(html, {
    blockTextElements: { script: false, style: false },
  });

  return root.childNodes.map((node) => serializeNode(node)).join("");
}
