"use client";

import { useState, useRef, useCallback } from "react";
import { Edit2, Check, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { updateAnnouncement, checkAnnouncementSlugAvailable } from "@/lib/admin/announcement-actions";

interface Props {
  announcementId: string;
  initialTitle:   string;
  initialBody:    string;
  initialSlug:    string | null;
}

export function EditAnnouncementForm({ announcementId, initialTitle, initialBody, initialSlug }: Props) {
  const [open,    setOpen]    = useState(false);
  const [title,   setTitle]   = useState(initialTitle);
  const [body,    setBody]    = useState(initialBody);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [slug,         setSlug]         = useState(initialSlug ?? "");
  const [slugEditing,  setSlugEditing]  = useState(false);
  const [slugValid,    setSlugValid]    = useState<boolean | null>(initialSlug !== null ? true : null);
  const [slugChecking, setSlugChecking] = useState(false);

  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateSlug = useCallback(async (value: string) => {
    if (value === "") { setSlugValid(null); return; }
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(value)) { setSlugValid(false); return; }
    setSlugChecking(true);
    const { available } = await checkAnnouncementSlugAvailable(value, announcementId);
    setSlugChecking(false);
    setSlugValid(available);
  }, [announcementId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateAnnouncement(
      announcementId,
      title,
      body,
      slug !== "" ? slug : undefined,
    );
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

      {/* Slug */}
      <div>
        <label className="block text-sn-gray-text text-xs mb-1">Slug (URL)</label>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm">
          <span className="text-sn-gray-medium shrink-0 text-xs">csusigmanu.com/announcements/</span>
          {slugEditing ? (
            <input
              value={slug}
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                setSlug(v);
                if (slugDebounceRef.current !== null) clearTimeout(slugDebounceRef.current);
                slugDebounceRef.current = setTimeout(() => void validateSlug(v), 400);
              }}
              className="flex-1 bg-transparent text-white outline-none min-w-0 text-xs"
              placeholder="my-announcement"
            />
          ) : (
            <span className="text-white flex-1 text-xs">{slug !== "" ? slug : "—"}</span>
          )}
          {slugChecking && (
            <span className="w-3 h-3 rounded-full border-2 border-sn-gold/40 border-t-sn-gold animate-spin shrink-0" />
          )}
          {!slugChecking && slugValid === true  && <Check size={12} className="text-green-400 shrink-0" />}
          {!slugChecking && slugValid === false  && <X    size={12} className="text-red-400 shrink-0" />}
          <button
            type="button"
            title={slugEditing ? "Lock slug" : "Edit slug"}
            onClick={() => setSlugEditing((v) => !v)}
            className="text-sn-gray-medium hover:text-white transition-colors ml-1 shrink-0"
          >
            <Edit2 size={11} />
          </button>
        </div>
        {slugValid === false && (
          <p className="text-red-400 text-xs mt-1">This slug is already taken or contains invalid characters.</p>
        )}
      </div>

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
            setSlug(initialSlug ?? "");
            setSlugEditing(false);
            setSlugValid(initialSlug !== null ? true : null);
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
