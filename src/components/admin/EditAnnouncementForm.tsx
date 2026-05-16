"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { updateAnnouncement } from "@/lib/admin/announcement-actions";

interface Props {
  announcementId: string;
  initialTitle: string;
  initialBody: string;
}

export function EditAnnouncementForm({ announcementId, initialTitle, initialBody }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateAnnouncement(announcementId, title, body);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sn-gray-medium hover:text-sn-off-white text-xs transition-colors px-2 py-1"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold"
      />
      <RichTextEditor
        value={body}
        onChange={setBody}
        placeholder="Body"
      />
      {error !== null && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="h-7 px-3 rounded-sm bg-sn-gold text-sn-black text-xs font-semibold hover:bg-sn-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle(initialTitle);
            setBody(initialBody);
            setError(null);
          }}
          className="text-white/40 hover:text-white text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
