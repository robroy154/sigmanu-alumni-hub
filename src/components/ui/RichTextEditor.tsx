"use client";

import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
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
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Video as YoutubeIcon,
  X,
  HelpCircle,
} from "lucide-react";

// ── Font Size extension ───────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

// ── Shared toolbar button style ───────────────────────────────────────────────
function btnClass(active: boolean) {
  return `p-1.5 rounded transition-colors ${
    active
      ? "text-sn-gold bg-white/10"
      : "text-white/60 hover:text-white hover:bg-white/5"
  }`;
}

// ── Toolbar separator ─────────────────────────────────────────────────────────
function Sep() {
  return <div className="w-px h-4 bg-white/20 mx-0.5" />;
}

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
  const [isInTable,       setIsInTable]        = useState(false);

  // Saves the cursor/selection range before native controls (select, color input)
  // steal focus. Restored in their onChange to preserve the selection.
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
      ImageResize.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Youtube.configure({ nocookie: true, width: 560, height: 315 }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    onSelectionUpdate: ({ editor: e }) => {
      const active = e.isActive("image");
      setIsImageSelected(active);
      setIsInTable(e.isActive("table"));
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

  const charCount      = editor.storage.characterCount?.characters?.() as number | undefined;
  const currentFontSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined)?.replace("px", "") ?? "16";
  const currentColor    = editor.getAttributes("textStyle").color as string | undefined;
  const currentHighlight = editor.getAttributes("highlight").color as string | undefined;

  function saveSelection() {
    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
  }

  function insertImage() {
    const url = window.prompt("Image URL:");
    if (url === null || url.trim() === "") return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }

  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url  = window.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function applyImageWidth(px: string) {
    const n = parseInt(px, 10);
    if (!isNaN(n) && n >= 100 && n <= 800) {
      editor.chain().focus().updateAttributes("image", { width: `${n}px` }).run();
    }
  }

  function resetImageWidth() {
    editor.chain().focus().updateAttributes("image", { width: null }).run();
    setImageWidthInput("");
  }

  function insertYouTube() {
    const url = window.prompt("YouTube URL:");
    if (url === null || url.trim() === "") return;
    editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
  }

  // Applies a command after restoring the saved selection.
  // Used for native controls (font-size select, color inputs) that steal focus.
  function withRestoredSelection(apply: () => void) {
    const saved = savedSelectionRef.current;
    savedSelectionRef.current = null;
    if (saved !== null) {
      editor.chain().focus().setTextSelection(saved).run();
    }
    apply();
  }

  // ── Simple toolbar button array (format controls) ─────────────────────────
  type ToolbarButton = { label: string; icon: ReactNode; action: () => void; active: boolean };

  const formatButtons: ToolbarButton[] = [
    { label: "Bold",          icon: <Bold size={14} />,            action: () => editor.chain().focus().toggleBold().run(),          active: editor.isActive("bold") },
    { label: "Italic",        icon: <Italic size={14} />,          action: () => editor.chain().focus().toggleItalic().run(),        active: editor.isActive("italic") },
    { label: "Underline",     icon: <UnderlineIcon size={14} />,   action: () => editor.chain().focus().toggleUnderline().run(),     active: editor.isActive("underline") },
    { label: "Strikethrough", icon: <Strikethrough size={14} />,   action: () => editor.chain().focus().toggleStrike().run(),        active: editor.isActive("strike") },
  ];

  const listButtons: ToolbarButton[] = [
    { label: "Bullet List",  icon: <List size={14} />,          action: () => editor.chain().focus().toggleBulletList().run(),   active: editor.isActive("bulletList") },
    { label: "Ordered List", icon: <ListOrdered size={14} />,   action: () => editor.chain().focus().toggleOrderedList().run(),  active: editor.isActive("orderedList") },
    { label: "Blockquote",   icon: <Quote size={14} />,         action: () => editor.chain().focus().toggleBlockquote().run(),   active: editor.isActive("blockquote") },
    { label: "Divider",      icon: <Minus size={14} />,         action: () => editor.chain().focus().setHorizontalRule().run(),  active: false },
  ];

  const utilButtons: ToolbarButton[] = [
    { label: "Link",         icon: <Link2 size={14} />,             action: setLink,                                                            active: editor.isActive("link") },
    { label: "Clear Format", icon: <RemoveFormatting size={14} />,  action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),   active: false },
  ];

  function renderButtons(buttons: ToolbarButton[]) {
    return buttons.map((btn) => (
      <button
        key={btn.label}
        type="button"
        title={btn.label}
        onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
        className={btnClass(btn.active)}
      >
        {btn.icon}
      </button>
    ));
  }

  return (
    <div className={`rounded-lg bg-sn-surface border border-white/10 overflow-hidden ${className}`}>

      {/* ── Main toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-white/10 bg-sn-gray-dark/50">

        {/* Font size — uses saveSelection / withRestoredSelection pattern to
            preserve the editor selection while the native dropdown is open   */}
        <select
          value={currentFontSize}
          onMouseDown={saveSelection}
          onChange={(e) => {
            const size = e.target.value;
            withRestoredSelection(() => {
              if (size === "16") {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(`${size}px`).run();
              }
            });
          }}
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

        <Sep />

        {/* Formatting */}
        {renderButtons(formatButtons)}

        <Sep />

        {/* Text alignment */}
        <button type="button" title="Align left"   onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("left").run(); }}   className={btnClass(editor.isActive({ textAlign: "left" }))}><AlignLeft size={14} /></button>
        <button type="button" title="Align center" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("center").run(); }} className={btnClass(editor.isActive({ textAlign: "center" }))}><AlignCenter size={14} /></button>
        <button type="button" title="Align right"  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("right").run(); }}  className={btnClass(editor.isActive({ textAlign: "right" }))}><AlignRight size={14} /></button>

        <Sep />

        {/* Text color */}
        <div className="flex items-center gap-0.5" title="Text color">
          <input
            type="color"
            value={currentColor ?? "#ffffff"}
            onMouseDown={saveSelection}
            onChange={(e) => {
              const color = e.target.value;
              withRestoredSelection(() => {
                editor.chain().focus().setColor(color).run();
              });
            }}
            className="w-6 h-6 rounded cursor-pointer p-0.5 bg-transparent border border-white/20 hover:border-white/40"
            title="Text color"
          />
          <button
            type="button"
            title="Remove text color"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={10} />
          </button>
        </div>

        {/* Highlight color */}
        <div className="flex items-center gap-0.5" title="Highlight">
          <input
            type="color"
            value={currentHighlight ?? "#C6A75E"}
            onMouseDown={saveSelection}
            onChange={(e) => {
              const color = e.target.value;
              withRestoredSelection(() => {
                editor.chain().focus().setHighlight({ color }).run();
              });
            }}
            className="w-6 h-6 rounded cursor-pointer p-0.5 bg-transparent border border-amber-400/30 hover:border-amber-400/60"
            style={{ accentColor: "#C6A75E" }}
            title="Highlight color"
          />
          <button
            type="button"
            title="Remove highlight"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={10} />
          </button>
        </div>

        <Sep />

        {/* Lists / structure */}
        {renderButtons(listButtons)}

        <Sep />

        {/* Utilities */}
        {renderButtons(utilButtons)}

        <Sep />

        {/* Insert image */}
        <button
          type="button"
          title="Insert image"
          onMouseDown={(e) => { e.preventDefault(); insertImage(); }}
          className={btnClass(false)}
        >
          <ImageIcon size={14} />
        </button>

        {/* Insert table */}
        <button
          type="button"
          title="Insert table (3×3)"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          }}
          className={btnClass(editor.isActive("table"))}
        >
          <TableIcon size={14} />
        </button>

        {/* YouTube — amber label always visible directly below the button */}
        <div className="flex flex-col items-center gap-0">
          <button
            type="button"
            title="Insert YouTube video"
            onMouseDown={(e) => { e.preventDefault(); insertYouTube(); }}
            className={btnClass(editor.isActive("youtube"))}
          >
            <YoutubeIcon size={14} />
          </button>
          <span className="text-amber-400 whitespace-nowrap leading-none" style={{ fontSize: "8px" }}>
            email: link
          </span>
        </div>

        {/* Spacer — pushes the help button to the far right */}
        <div className="flex-1" />

        {/* Keyboard shortcut reference */}
        <Dialog.Root>
          <Dialog.Trigger
            title="Keyboard shortcuts"
            className="p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <HelpCircle size={14} />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 bg-black/70 z-50" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto bg-sn-surface border border-white/10 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <Dialog.Title className="text-sn-off-white font-semibold text-base">Editor Shortcuts</Dialog.Title>
                <Dialog.Close className="text-sn-gray-medium hover:text-sn-off-white transition-colors text-lg leading-none">✕</Dialog.Close>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
                {[
                  ["Cmd+B",           "Bold"],
                  ["Cmd+I",           "Italic"],
                  ["Cmd+U",           "Underline"],
                  ["Cmd+Shift+X",     "Strikethrough"],
                  ["Cmd+Shift+H",     "Highlight"],
                  ["Cmd+K",           "Set link"],
                  ["Cmd+Z",           "Undo"],
                  ["Cmd+Shift+Z",     "Redo"],
                  ["Enter",           "New paragraph"],
                  ["Shift+Enter",     "Line break (no extra spacing)"],
                  ["Tab",             "Next table cell"],
                  ["Shift+Tab",       "Previous table cell"],
                  ["- + Space",       "Start bullet list"],
                  ["1. + Space",      "Start numbered list"],
                  ["## + Space",      "Heading 2"],
                  ["### + Space",     "Heading 3"],
                  ["> + Space",       "Blockquote"],
                  ["--- + Enter",     "Horizontal rule"],
                ].map(([shortcut, action]) => (
                  <>
                    <code key={`key-${shortcut}`} className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-white/80 whitespace-nowrap self-center">
                      {shortcut}
                    </code>
                    <span key={`desc-${shortcut}`} className="text-sn-gray-text text-sm self-center">{action}</span>
                  </>
                ))}
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* ── Table context toolbar — visible when cursor is inside a table ─── */}
      {isInTable && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-white/10 bg-amber-950/20">
          <span className="text-amber-400/70 text-xs mr-1.5 font-medium">Table:</span>
          <button type="button" title="Add row above"    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }}    className="h-6 px-2 rounded text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">+ Row ↑</button>
          <button type="button" title="Add row below"    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}     className="h-6 px-2 rounded text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">+ Row ↓</button>
          <button type="button" title="Delete row"       onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }}       className="h-6 px-2 rounded text-xs text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors">− Row</button>
          <div className="w-px h-4 bg-white/15 mx-0.5" />
          <button type="button" title="Add column left"  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }} className="h-6 px-2 rounded text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">+ Col ←</button>
          <button type="button" title="Add column right" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}  className="h-6 px-2 rounded text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">+ Col →</button>
          <button type="button" title="Delete column"    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }}    className="h-6 px-2 rounded text-xs text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors">− Col</button>
          <div className="w-px h-4 bg-white/15 mx-0.5" />
          <button type="button" title="Delete table"     onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}     className="h-6 px-2 rounded text-xs text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors">Delete table</button>
        </div>
      )}

      {/* ── Image resize control — visible only when an image node is selected */}
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

      {/* ── Editor area ───────────────────────────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* ── Shift+Enter hint ─────────────────────────────────────────────── */}
      <div className="text-xs text-white/30 px-3 py-1.5">
        Tip: Use Shift+Enter for a line break · Enter for a new paragraph
      </div>

      {/* ── Character count ───────────────────────────────────────────────── */}
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
