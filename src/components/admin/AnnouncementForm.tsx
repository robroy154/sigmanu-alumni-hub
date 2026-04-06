"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createAnnouncement } from "@/lib/admin/announcement-actions";
import { toastSuccess, toastError } from "@/lib/toast";

export function AnnouncementForm() {
  const [title, setTitle]     = useState("");
  const [body, setBody]       = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createAnnouncement(title, body);
    setLoading(false);

    if ("error" in result) {
      toastError(result.error);
    } else {
      setTitle("");
      setBody("");
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
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Announcement content"
          required
          rows={4}
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sn-off-white text-sm placeholder:text-sn-gray-medium focus:outline-none focus:ring-1 focus:ring-sn-gold/50 focus:border-sn-gold/50 resize-none"
        />
      </div>

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
