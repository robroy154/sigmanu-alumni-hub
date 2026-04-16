"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
// Images must be externally hosted URLs (Supabase Storage public URLs, etc.)
// base64 is disabled to prevent bloated database storage
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  RemoveFormatting,
  Image as ImageIcon,
} from "lucide-react";

interface Props {
  value:       string;
  onChange:    (html: string) => void;
  placeholder?: string;
  maxLength?:  number;
  className?:  string;
}

export function RichTextEditor({ value, onChange, placeholder, maxLength, className = "" }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[200px] p-3 text-sm text-white/90 prose prose-invert max-w-none",
      },
    },
  });

  if (editor === null) return null;

  const charCount = editor.storage.characterCount?.characters?.() as number | undefined;

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

  type ToolbarItem =
    | { type: "button"; label: string; icon: React.ReactNode; action: () => void; active: boolean }
    | { type: "sep" };

  const toolbar: ToolbarItem[] = [
    { type: "button", label: "Bold",          icon: <Bold size={14} />,           action: () => editor.chain().focus().toggleBold().run(),          active: editor.isActive("bold") },
    { type: "button", label: "Italic",        icon: <Italic size={14} />,         action: () => editor.chain().focus().toggleItalic().run(),        active: editor.isActive("italic") },
    { type: "button", label: "Underline",     icon: <UnderlineIcon size={14} />,  action: () => editor.chain().focus().toggleUnderline().run(),     active: editor.isActive("underline") },
    { type: "button", label: "Strikethrough", icon: <Strikethrough size={14} />,  action: () => editor.chain().focus().toggleStrike().run(),        active: editor.isActive("strike") },
    { type: "sep" },
    { type: "button", label: "H2",            icon: <Heading2 size={14} />,       action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { type: "button", label: "H3",            icon: <Heading3 size={14} />,       action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
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
