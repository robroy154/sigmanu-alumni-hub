"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadEventBanner } from "@/lib/admin/upload-event-banner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

interface Props {
  eventId:     string | null;
  currentUrl?: string | null;
  onUpload:    (url: string) => void;
}

export function EventFlyerUpload({ eventId, currentUrl, onUpload }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }

    const ext = file.type === "image/jpeg" ? "jpg"
      : file.type === "image/png"  ? "png"
      : "webp";

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setLoading(true);

      // Reuses the event-banners bucket — stored at [eventId]/flyer.[ext]
      try {
        const result = await uploadEventBanner(
          base64,
          file.type,
          `${eventId ?? "new"}-flyer`,
          ext
        );
        if ("error" in result) {
          setError(result.error);
          setPreview(currentUrl ?? null);
        } else {
          onUpload(result.url);
        }
      } catch (err) {
        console.error("[EventFlyerUpload]", err);
        setError("Upload failed. Please try again.");
        setPreview(currentUrl ?? null);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file !== undefined) void handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file !== undefined) void handleFile(file);
  }

  function clearFlyer() {
    setPreview(null);
    onUpload("");
    if (inputRef.current !== null) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {preview !== null && preview !== "" ? (
        <div className="relative rounded-lg overflow-hidden border border-white/10 group bg-sn-gray-dark/30 flex justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Flyer preview"
            className="max-h-48 w-auto object-contain rounded"
          />
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <span className="text-white text-sm">Uploading…</span>
            </div>
          )}
          {!loading && (
            <button
              type="button"
              onClick={clearFlyer}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove flyer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 h-32 rounded-lg border border-dashed border-white/20 bg-sn-gray-dark/30 cursor-pointer hover:border-sn-gold/40 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <ImagePlus size={20} className="text-white/30" />
          <span className="text-white/40 text-xs text-center px-4">
            {loading ? "Uploading…" : "Click or drag to upload flyer (JPG, PNG, WebP · max 5 MB)"}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      <p className="text-white/30 text-xs">
        Upload your event flyer. Will display below the event description.
        Recommended: portrait/letter format.
      </p>

      {error !== null && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
