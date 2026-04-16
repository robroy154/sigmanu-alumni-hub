"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { getEventImageUploadUrl } from "@/lib/admin/upload-event-banner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

interface Props {
  eventId:     string | null;
  currentUrl?: string | null;
  onUpload:    (url: string) => void;
}

export function EventBannerUpload({ eventId, currentUrl, onUpload }: Props) {
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

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setLoading(true);

    try {
      // Step 1: get a signed upload URL from the server (tiny request, no file data)
      const signed = await getEventImageUploadUrl(eventId ?? "new", ext, false);
      if ("error" in signed) {
        setError(signed.error);
        setPreview(currentUrl ?? null);
        return;
      }

      // Step 2: upload the file directly to Supabase Storage (bypasses Next.js entirely)
      const res = await fetch(signed.uploadUrl, {
        method:  "PUT",
        body:    file,
        headers: { "Content-Type": file.type },
      });

      if (!res.ok) {
        setError(`Upload failed (${res.status}). Please try again.`);
        setPreview(currentUrl ?? null);
        return;
      }

      onUpload(signed.publicUrl);
    } catch (err) {
      console.error("[EventBannerUpload]", err);
      setError("Upload failed. Please try again.");
      setPreview(currentUrl ?? null);
    } finally {
      setLoading(false);
    }
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

  function clearBanner() {
    setPreview(null);
    onUpload("");
    if (inputRef.current !== null) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {preview !== null && preview !== "" ? (
        <div className="relative rounded-lg overflow-hidden border border-white/10 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Banner preview"
            className="w-full h-40 object-cover"
          />
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-sm">Uploading…</span>
            </div>
          )}
          {!loading && (
            <button
              type="button"
              onClick={clearBanner}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove banner"
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
          <span className="text-white/40 text-xs">
            {loading ? "Uploading…" : "Click or drag to upload banner (JPG, PNG, WebP · max 5 MB)"}
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

      {error !== null && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
