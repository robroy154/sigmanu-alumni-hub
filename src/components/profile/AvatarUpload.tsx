"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfilePhoto } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  userId: string;
  currentPhotoUrl: string | null;
}

export function AvatarUpload({ userId, currentPhotoUrl }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file === undefined) return;

    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Photo must be under ${MAX_MB} MB.`);
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, or WebP photos are accepted.");
      return;
    }

    setError(null);
    setUploading(true);

    // Show local preview immediately while upload proceeds.
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `${userId}/avatar.${ext}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(storagePath, file, { upsert: true });

    if (uploadError !== null) {
      setError("Upload failed. Please try again.");
      setPreviewUrl(currentPhotoUrl);
      setUploading(false);
      return;
    }

    const result = await updateProfilePhoto(storagePath);
    if ("error" in result) {
      setError(result.error);
    }

    setUploading(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar display */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-sn-black border-2 border-sn-gold/40 flex items-center justify-center select-none">
        {previewUrl !== null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Profile photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sn-gold text-3xl font-bold">ΣΝ</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs">Uploading…</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-transparent border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : previewUrl !== null ? "Change photo" : "Upload photo"}
      </Button>

      {error !== null && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  );
}
