"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createAnnouncement } from "@/lib/admin/announcement-actions";
import { toastSuccess, toastError } from "@/lib/toast";

export function AnnouncementForm() {
  const [title,         setTitle]         = useState("");
  const [body,          setBody]          = useState("");
  const [notifyMembers, setNotifyMembers] = useState(false);
  const [loading,       setLoading]       = useState(false);

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

  return (
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

      <Button
        type="submit"
        disabled={loading}
        className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
      >
        {loading ? "Posting…" : "Post Announcement"}
      </Button>
    </form>
  );
}
