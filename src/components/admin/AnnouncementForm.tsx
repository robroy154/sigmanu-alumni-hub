"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { createAnnouncement } from "@/lib/admin/announcement-actions";
import { sendTestAnnouncement } from "@/lib/admin/announcement-actions";
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

  const [testEmail,    setTestEmail]    = useState(adminEmail);
  const [testSending,  setTestSending]  = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const result = await createAnnouncement(title, body, notifyMembers);
    setLoading(false);

    if ("error" in result) {
      toastError(result.error);
    } else {
      setTitle("");
      setBody("");
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
