"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { dismissAnnouncement } from "@/lib/auth/actions";

interface Props {
  announcementId: string;
  title:          string;
  body:           string;
}

export function AnnouncementSplash({ announcementId, title, body }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  async function handleDismiss() {
    setLoading(true);
    await dismissAnnouncement(announcementId);
    setVisible(false);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-sn-black border border-sn-gold/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-start justify-between gap-4">
          <h2 className="text-sn-off-white text-lg font-bold leading-tight">{title}</h2>
          <button
            type="button"
            onClick={() => void handleDismiss()}
            aria-label="Dismiss"
            className="text-white/30 hover:text-white transition-colors shrink-0 mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-80 overflow-y-auto">
          <RichTextContent content={body} className="text-sn-gray-text text-sm leading-relaxed" />
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => void handleDismiss()}
            disabled={loading}
            className="h-9 px-5 rounded-sm bg-sn-gold text-sn-black text-sm font-semibold hover:bg-sn-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? "Dismissing…" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
