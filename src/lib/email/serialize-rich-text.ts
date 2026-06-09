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
};

// ---------------------------------------------------------------------------
// Serialize a single DOM node to email-safe HTML
// ---------------------------------------------------------------------------
function serializeNode(node: HtmlNode): string {
  // Text nodes — return escaped text
  if (node.nodeType === NodeType.TEXT_NODE) {
    return node.rawText;
  }

  if (node.nodeType !== NodeType.ELEMENT_NODE) return "";

  const el = node as ParsedElement;
  const tag = el.tagName?.toLowerCase() ?? "";
  const inner = () => el.childNodes.map((c) => serializeNode(c)).join("");

  switch (tag) {
    case "p":
      return `<p style="${STYLES.p}">${inner()}</p>`;

    case "strong":
      return `<strong style="${STYLES.strong}">${inner()}</strong>`;

    case "em":
      return `<em style="${STYLES.em}">${inner()}</em>`;

    case "u":
      return `<u style="${STYLES.u}">${inner()}</u>`;

    case "s":
      return `<s style="${STYLES.s}">${inner()}</s>`;

    case "h2":
      return `<p style="${STYLES.h2}">${inner()}</p>`;

    case "h3":
      return `<p style="${STYLES.h3}">${inner()}</p>`;

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
      const src = el.getAttribute("src") ?? "";
      if (/^\s*javascript:/i.test(src)) return "";
      const alt = el.getAttribute("alt") ?? "";
      // Parse width from inline style or width attribute
      const inlineStyle = el.getAttribute("style") ?? "";
      const widthMatch = /width:\s*(\d+px)/i.exec(inlineStyle);
      if (widthMatch?.[1] !== undefined) {
        const w = widthMatch[1];
        return `<img src="${src}" alt="${alt}" width="${w.replace("px","")}" style="${STYLES.img_base}width:${w};">`;
      }
      return `<img src="${src}" alt="${alt}" style="${STYLES.img_base}max-width:560px;">`;
    }

    case "ul": {
      const rows = el.childNodes
        .filter((c): c is ParsedElement => c.nodeType === NodeType.ELEMENT_NODE && (c as ParsedElement).tagName?.toLowerCase() === "li")
        .map((li) => {
          const liEl = li as ParsedElement;
          const liInner = liEl.childNodes.map((c) => serializeNode(c)).join("");
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
          const liEl = li as ParsedElement;
          const liInner = liEl.childNodes.map((c) => serializeNode(c)).join("");
          return `<tr><td style="${STYLES.li_bullet}" valign="top">${counter}.</td><td style="${STYLES.li_text}">${liInner}</td></tr>`;
        })
        .join("");
      return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">${rows}</table>`;
    }

    case "li":
      // li handled by parent ul/ol — if encountered standalone, just render content
      return inner();

    case "blockquote": {
      const bqInner = inner();
      return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;width:100%;">
  <tr>
    <td style="${STYLES.bq_border}">&nbsp;</td>
    <td style="${STYLES.bq_text}">${bqInner}</td>
  </tr>
</table>`;
    }

    case "span": {
      // Pass through font-size spans from TextStyle extension
      const inlineStyle = el.getAttribute("style") ?? "";
      const fontSizeMatch = /font-size:\s*(\d+px)/i.exec(inlineStyle);
      if (fontSizeMatch) {
        const fontSize = fontSizeMatch[1];
        return `<span style="${STYLES.span_base}font-size:${fontSize};">${inner()}</span>`;
      }
      return inner();
    }

    case "script":
    case "style":
      return "";

    default:
      // Unknown tags: strip the tag, keep content
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
