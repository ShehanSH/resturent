"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { notify } from "@/lib/notify";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { uploadImageAction } from "@/app/actions/admin";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, STORAGE_BUCKETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Bucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export function ImageUploadField({
  label = "Photo",
  description = "JPEG, PNG, WebP or AVIF · max 5 MB",
  bucket,
  value,
  onChange,
}: {
  label?: string;
  description?: string;
  bucket: Bucket;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      notify.error("Images must be 5 MB or smaller.");
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      notify.error("Use a JPEG, PNG, WebP or AVIF image.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setUploading(true);
    try {
      const result = await uploadImageAction(bucket, formData);
      if (!result.success) {
        notify.error(result.error);
        return;
      }
      onChange(result.data.url);
      notify.success("Image uploaded");
    } catch {
      notify.error("Could not upload this image. Try a smaller file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            "relative aspect-square w-full max-w-[11rem] overflow-hidden rounded-xl border border-dashed",
            value ? "border-primary/20 bg-white" : "border-black/15 bg-black/[0.02]",
          )}
        >
          {value ? (
            <Image src={value} alt="Uploaded preview" fill sizes="176px" className="object-cover" />
          ) : (
            <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs">
              <ImagePlus className="size-6 opacity-60" />
              No photo yet
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => void onFileChange(event)}
          />
          <button
            type="button"
            className="btn-admin"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
          </button>
          {value ? (
            <button
              type="button"
              className="btn-admin-outline"
              disabled={uploading}
              onClick={() => onChange(null)}
            >
              <Trash2 className="size-4" />
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
