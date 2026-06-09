"use client";

import { useState } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
// Images must be externally hosted URLs (Supabase Storage public URLs, etc.)
// base64 is disabled to prevent bloated database storage
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  RemoveFormatting,
  Image as ImageIcon,
} from "lucide-react";

// ── Font Size extension ───────────────────────────────────────────────────────
// Adds setFontSize / unsetFontSize commands via TextStyle mark attributes.
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types as string[],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.style.fontSize.replace(/['"]+/g, "") || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              if (attributes.fontSize === null || attributes.fontSize === undefined) return {};
              return { style: `font-size: ${String(attributes.fontSize)}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ── Image Resize extension ────────────────────────────────────────────────────
// Extends the base Image extension to support an inline width style attribute.
const ImageResize = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.style.width || element.getAttribute("width") || null,
        renderHTML: (attributes: Record<string, unknown>) => {
          if (attributes.width === null || attributes.width === undefined) return {};
          return { style: `width: ${String(attributes.width)}` };
        },
      },
    };
  },
});

// ── Font size options ─────────────────────────────────────────────────────────
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

interface Props {
  value:       string;
  onChange:    (html: string) => void;
  placeholder?: string;
  maxLength?:  number;
  className?:  string;
}

export function RichTextEditor({ value, onChange, placeholder, maxLength, className = "" }: Props) {
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [imageWidthInput, setImageWidthInput]  = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Underline,
      TextStyle,
      FontSize,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
      ImageResize.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    onSelectionUpdate: ({ editor: e }) => {
      const active = e.isActive("image");
      setIsImageSelected(active);
      if (active) {
        const w = e.getAttributes("image").width as string | null | undefined;
        setImageWidthInput(w ? w.replace("px", "") : "");
      } else {
        setImageWidthInput("");
      }
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[200px] p-3 text-sm text-white/90 prose prose-invert max-w-none",
      },
    },
  });

  if (editor === null) return null;

  const charCount = editor.storage.characterCount?.characters?.() as number | undefined;
  const currentFontSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined)?.replace("px", "") ?? "16";

  function insertImage() {
    const url = window.prompt("Image URL:");
    if (url === null || url.trim() === "") return;
    editor?.chain().focus().setImage({ src: url.trim() }).run();
  }

  function setLink() {
    const prev = editor?.getAttributes("link").href as string | undefined;
    const url  = window.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function applyImageWidth(px: string) {
    const n = parseInt(px, 10);
    if (!isNaN(n) && n >= 100 && n <= 800) {
      editor?.chain().focus().updateAttributes("image", { width: `${n}px` }).run();
    }
  }

  function resetImageWidth() {
    editor?.chain().focus().updateAttributes("image", { width: null }).run();
    setImageWidthInput("");
  }

  type ToolbarItem =
    | { type: "button"; label: string; icon: React.ReactNode; action: () => void; active: boolean }
    | { type: "sep" };

  const toolbar: ToolbarItem[] = [
    { type: "button", label: "Bold",          icon: <Bold size={14} />,           action: () => editor.chain().focus().toggleBold().run(),          active: editor.isActive("bold") },
    { type: "button", label: "Italic",        icon: <Italic size={14} />,         action: () => editor.chain().focus().toggleItalic().run(),        active: editor.isActive("italic") },
    { type: "button", label: "Underline",     icon: <UnderlineIcon size={14} />,  action: () => editor.chain().focus().toggleUnderline().run(),     active: editor.isActive("underline") },
    { type: "button", label: "Strikethrough", icon: <Strikethrough size={14} />,  action: () => editor.chain().focus().toggleStrike().run(),        active: editor.isActive("strike") },
    { type: "sep" },
    { type: "button", label: "Bullet List",   icon: <List size={14} />,           action: () => editor.chain().focus().toggleBulletList().run(),   active: editor.isActive("bulletList") },
    { type: "button", label: "Ordered List",  icon: <ListOrdered size={14} />,    action: () => editor.chain().focus().toggleOrderedList().run(),  active: editor.isActive("orderedList") },
    { type: "button", label: "Blockquote",    icon: <Quote size={14} />,          action: () => editor.chain().focus().toggleBlockquote().run(),   active: editor.isActive("blockquote") },
    { type: "button", label: "Divider",       icon: <Minus size={14} />,          action: () => editor.chain().focus().setHorizontalRule().run(),  active: false },
    { type: "sep" },
    { type: "button", label: "Link",          icon: <Link2 size={14} />,          action: setLink,                                                  active: editor.isActive("link") },
    { type: "button", label: "Clear Format",  icon: <RemoveFormatting size={14} />, action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(), active: false },
    { type: "sep" },
    { type: "button", label: "Insert Image",  icon: <ImageIcon size={14} />,        action: insertImage,                                                    active: false },
  ];

  return (
    <div className={`rounded-lg bg-sn-surface border border-white/10 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-white/10 bg-sn-gray-dark/50">
        {/* Font size dropdown */}
        <select
          value={currentFontSize}
          onChange={(e) => {
            const size = e.target.value;
            if (size === "16") {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(`${size}px`).run();
            }
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={`h-7 px-1.5 rounded text-xs bg-transparent border border-white/20 cursor-pointer transition-colors ${
            currentFontSize !== "16" ? "text-sn-gold border-sn-gold/40" : "text-white/60"
          } hover:text-white hover:border-white/40`}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={String(s)} className="bg-sn-gray-dark text-white">
              {s}px
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-white/20 mx-0.5" />

        {toolbar.map((item, i) => {
          if (item.type === "sep") {
            return <div key={i} className="w-px h-4 bg-white/20 mx-0.5" />;
          }
          return (
            <button
              key={item.label}
              type="button"
              title={item.label}
              onMouseDown={(e) => {
                e.preventDefault();
                item.action();
              }}
              className={`p-1.5 rounded transition-colors ${
                item.active
                  ? "text-sn-gold bg-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* Image resize control — visible only when an image node is selected */}
      {isImageSelected && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-sn-gray-dark/30">
          <span className="text-xs text-sn-gray-medium">Image width:</span>
          <input
            type="number"
            min={100}
            max={800}
            step={10}
            value={imageWidthInput}
            placeholder="auto"
            onChange={(e) => setImageWidthInput(e.target.value)}
            onBlur={(e) => applyImageWidth(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyImageWidth(imageWidthInput);
              }
            }}
            className="w-20 h-6 px-1.5 rounded text-xs bg-white/5 border border-white/20 text-white focus:outline-none focus:border-sn-gold/50"
          />
          <span className="text-xs text-sn-gray-medium">px</span>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              resetImageWidth();
            }}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Character count */}
      {maxLength !== undefined && (
        <div className="flex justify-end px-3 py-1 border-t border-white/5">
          <span className="text-xs text-sn-gray-medium">
            {charCount ?? editor.getText().length} / {maxLength}
          </span>
        </div>
      )}
    </div>
  );
}
