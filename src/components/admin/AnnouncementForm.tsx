"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createAnnouncement } from "@/lib/admin/announcement-actions";

export function AnnouncementForm() {
  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await createAnnouncement(title, body);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setTitle("");
      setBody("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label className="block text-white/70 text-sm mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          required
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-sn-gold/50 focus:border-sn-gold/50"
        />
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-1.5">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Announcement content"
          required
          rows={4}
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-sn-gold/50 focus:border-sn-gold/50 resize-none"
        />
      </div>

      {error !== null && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      {success && (
        <p className="text-green-400 text-sm">Announcement posted.</p>
      )}

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
