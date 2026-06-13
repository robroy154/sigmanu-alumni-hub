"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { createAnnouncement } from "@/lib/admin/announcement-actions";
import { sendTestAnnouncement, checkAnnouncementSlugAvailable } from "@/lib/admin/announcement-actions";
import { titleToSlug } from "@/lib/events/slug";
import { toastSuccess, toastError } from "@/lib/toast";

interface Props {
  adminEmail: string;
}

export function AnnouncementForm({ adminEmail }: Props) {
  const [title,         setTitle]         = useState("");
  const [body,          setBody]          = useState("");
  const [notifyMembers, setNotifyMembers] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [previewOpen,   setPreviewOpen]   = useState(false);

  const [slug,          setSlug]          = useState("");
  const [slugEditing,   setSlugEditing]   = useState(false);
  const [slugValid,     setSlugValid]     = useState<boolean | null>(null);
  const [slugChecking,  setSlugChecking]  = useState(false);

  const [testEmail,    setTestEmail]    = useState(adminEmail);
  const [testSending,  setTestSending]  = useState(false);

  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateSlug = useCallback(async (value: string) => {
    if (value === "") { setSlugValid(null); return; }
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(value)) { setSlugValid(false); return; }
    setSlugChecking(true);
    const { available } = await checkAnnouncementSlugAvailable(value);
    setSlugChecking(false);
    setSlugValid(available);
  }, []);

  // Auto-generate slug from title on create (not while manually editing)
  useEffect(() => {
    if (slugEditing) return;
    if (slugDebounceRef.current !== null) clearTimeout(slugDebounceRef.current);
    slugDebounceRef.current = setTimeout(() => {
      const auto = titleToSlug(title);
      setSlug(auto);
      if (auto !== "") void validateSlug(auto);
      else setSlugValid(null);
    }, 400);
    return () => {
      if (slugDebounceRef.current !== null) clearTimeout(slugDebounceRef.current);
    };
  }, [title, slugEditing, validateSlug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const result = await createAnnouncement(title, body, notifyMembers, slug !== "" ? slug : undefined);
    setLoading(false);

    if ("error" in result) {
      toastError(result.error);
    } else {
      setTitle("");
      setBody("");
      setSlug("");
      setSlugEditing(false);
      setSlugValid(null);
      setNotifyMembers(false);
      toastSuccess("Announcement posted.");
    }
  }

  async function handleTestSend() {
    if (title.trim() === "") { toastError("Add a title before sending a test."); return; }
    if (body.trim() === "")  { toastError("Add body content before sending a test."); return; }
    if (testEmail.trim() === "") { toastError("Enter a recipient email."); return; }

    setTestSending(true);
    const result = await sendTestAnnouncement(title, body, testEmail.trim());
    setTestSending(false);

    if ("error" in result) {
      toastError(`Test send failed: ${result.error}`);
    } else {
      toastSuccess(`Test email sent to ${testEmail}.`);
    }
  }

  return (
    <>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sn-gray-text text-sm mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            required
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sn-off-white text-sm placeholder:text-sn-gray-medium focus:outline-none focus:ring-1 focus:ring-sn-gold/50 focus:border-sn-gold/50"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sn-gray-text text-sm mb-1.5">Slug (URL)</label>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm">
            <span className="text-sn-gray-medium shrink-0">csusigmanu.com/announcements/</span>
            {slugEditing ? (
              <input
                value={slug}
                onChange={(e) => {
                  const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setSlug(v);
                  if (slugDebounceRef.current !== null) clearTimeout(slugDebounceRef.current);
                  slugDebounceRef.current = setTimeout(() => void validateSlug(v), 400);
                }}
                className="flex-1 bg-transparent text-white outline-none min-w-0"
                placeholder="my-announcement"
              />
            ) : (
              <span className="text-white flex-1">{slug !== "" ? slug : "—"}</span>
            )}
            {slugChecking && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-sn-gold/40 border-t-sn-gold animate-spin shrink-0" />
            )}
            {!slugChecking && slugValid === true  && <Check size={14} className="text-green-400 shrink-0" />}
            {!slugChecking && slugValid === false  && <X    size={14} className="text-red-400 shrink-0" />}
            <button
              type="button"
              title={slugEditing ? "Lock slug" : "Edit slug"}
              onClick={() => setSlugEditing((v) => !v)}
              className="text-sn-gray-medium hover:text-white transition-colors ml-1 shrink-0"
            >
              <Edit2 size={12} />
            </button>
          </div>
          {slugValid === false && (
            <p className="text-red-400 text-xs mt-1">This slug is already taken or contains invalid characters.</p>
          )}
        </div>

        <div>
          <label className="block text-sn-gray-text text-sm mb-1.5">Body</label>
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Announcement content"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifyMembers}
            onChange={(e) => setNotifyMembers(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 accent-sn-gold"
          />
          <span className="text-sn-gray-text text-sm">
            Notify all members by email
          </span>
        </label>

        {/* Test send section */}
        <div className="rounded-lg border border-white/10 px-4 py-3 space-y-2">
          <p className="text-sn-gray-text text-xs font-medium uppercase tracking-wider">Send test email</p>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Recipient email"
              className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sn-off-white text-sm placeholder:text-sn-gray-medium focus:outline-none focus:ring-1 focus:ring-sn-gold/50 focus:border-sn-gold/50"
            />
            <Button
              type="button"
              variant="outline"
              disabled={testSending}
              onClick={() => void handleTestSend()}
              className="shrink-0 text-xs h-8 px-3"
            >
              {testSending ? "Sending…" : "Send test"}
            </Button>
          </div>
          <p className="text-sn-gray-medium text-xs">
            Sends a preview email without posting the announcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
          >
            {loading ? "Posting…" : "Post Announcement"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
        </div>
      </form>

      {/* Preview modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-sn-surface rounded-xl border border-sn-gold/20 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-sn-gray-medium text-xs uppercase tracking-wider font-medium">Member view preview</p>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-sn-gray-medium hover:text-sn-off-white transition-colors text-lg leading-none"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Announcement card — matches homepage AnnouncementCard */}
            <div className="bg-sn-surface rounded-xl border-t-2 border-t-sn-gold px-5 py-4">
              <p className="text-sn-off-white font-semibold text-base mb-1">
                {title.trim() !== "" ? title : <span className="text-sn-gray-medium italic">Untitled</span>}
              </p>
              {body.trim() !== "" ? (
                <RichTextContent content={body} />
              ) : (
                <p className="text-sn-gray-medium text-sm italic">No body content yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
