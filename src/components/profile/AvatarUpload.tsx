"use client";

import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { createClient } from "@/lib/supabase/client";
import { updateProfilePhoto } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { toastSuccess, toastError } from "@/lib/toast";

interface AvatarUploadProps {
  userId: string;
  currentPhotoUrl: string | null;
}

function centerAspectCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
    width,
    height,
  );
}

// Only allow blob: (local file preview) scheme; rawSrc always comes from URL.createObjectURL
function isSafeBlobUrl(url: string): boolean {
  return url.startsWith("blob:");
}

export function AvatarUpload({ userId, currentPhotoUrl }: AvatarUploadProps) {
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);

  const [previewUrl, setPreviewUrl]   = useState<string | null>(currentPhotoUrl);
  const [uploading, setUploading]     = useState(false);

  // Crop modal state
  const [rawSrc, setRawSrc]           = useState<string | null>(null);
  const [rawFile, setRawFile]         = useState<File | null>(null);
  const [crop, setCrop]               = useState<Crop>({ unit: "%", x: 5, y: 5, width: 90, height: 90 });

  // Called when a file is chosen — open the crop modal.
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file === undefined) return;
    // Reset input so the same file can be re-selected after cancellation.
    e.target.value = "";

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      toastError(`Photo must be under ${MAX_MB} MB.`);
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toastError("Only JPEG, PNG, or WebP photos are accepted.");
      return;
    }
    setRawFile(file);
    setRawSrc(URL.createObjectURL(file));
  }

  // Set initial centered crop when image loads inside the modal.
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(centerAspectCrop(w, h));
  }, []);

  // Crop and upload the image.
  async function handleSaveCrop() {
    if (imgRef.current === null || crop === undefined || rawFile === null) return;

    const img    = imgRef.current;
    const scaleX = img.naturalWidth  / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Resolve pixel values (crop.unit is %).
    const pixelX = (crop.x      / 100) * img.naturalWidth;
    const pixelY = (crop.y      / 100) * img.naturalHeight;
    const pixelW = (crop.width  / 100) * img.naturalWidth;
    const pixelH = (crop.height / 100) * img.naturalHeight;

    const canvas = document.createElement("canvas");
    const SIZE   = 512;
    canvas.width  = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    ctx.drawImage(
      img,
      pixelX  / scaleX * scaleX,
      pixelY  / scaleY * scaleY,
      pixelW,
      pixelH,
      0, 0, SIZE, SIZE,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (blob === null) { toastError("Failed to process image."); return; }

    setUploading(true);
    setRawSrc(null);
    setPreviewUrl(URL.createObjectURL(blob));

    const storagePath = `${userId}/avatar.jpg`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(storagePath, blob, { upsert: true, contentType: "image/jpeg" });

    if (uploadError !== null) {
      toastError("Upload failed. Please try again.");
      setPreviewUrl(currentPhotoUrl);
      setUploading(false);
      return;
    }

    const result = await updateProfilePhoto(storagePath);
    if ("error" in result) {
      toastError(result.error);
    } else {
      toastSuccess("Photo updated.");
    }

    setUploading(false);
  }

  const DEFAULT_CROP: Crop = { unit: "%", x: 5, y: 5, width: 90, height: 90 };

  function handleCancelCrop() {
    setRawSrc(null);
    setRawFile(null);
    setCrop(DEFAULT_CROP);
  }

  // ── Crop modal ────────────────────────────────────────────────────────────
  if (rawSrc !== null && isSafeBlobUrl(rawSrc)) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <p className="text-white/70 text-sm">Drag to adjust crop</p>
        <div className="max-w-sm w-full">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            aspect={1}
            circularCrop
            minWidth={30}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={rawSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-72 w-full object-contain"
            />
          </ReactCrop>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => void handleSaveCrop()}
            className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
          >
            Save photo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelCrop}
            className="bg-transparent border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── Normal state ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-sn-black border-2 border-sn-gold/40 flex items-center justify-center select-none">
        {previewUrl !== null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Profile photo" className="w-full h-full object-cover" />
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
        ref={fileInputRef}
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
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : previewUrl !== null ? "Change photo" : "Upload photo"}
      </Button>

    </div>
  );
}
