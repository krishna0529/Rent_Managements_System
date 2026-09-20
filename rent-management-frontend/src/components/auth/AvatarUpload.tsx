"use client";

import React, { useRef, useState } from "react";

interface AvatarUploadProps {
  onImageSelected: (file: File | null) => void;
}

export default function AvatarUpload({ onImageSelected }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image file size exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelected(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image file size exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelected(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-mono text-[12px] text-on-surface-variant uppercase tracking-wider">
        Profile Identity Image
      </label>
      <div
        className="dropzone-glow flex flex-col sm:flex-row items-center gap-5 p-4 rounded-lg bg-surface-container-lowest/60 border border-dashed border-outline-variant/40 hover:border-primary/80 transition-all group cursor-pointer active:scale-[0.99]"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="relative w-20 h-20 rounded-full border-2 border-outline-variant/40 overflow-hidden bg-surface-container flex items-center justify-center shrink-0 group-hover:border-primary group-hover:shadow-[0_0_16px_rgba(195,192,255,0.3)] transition-all duration-300">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-outline transition-transform duration-200 group-hover:scale-110">
              <span className="material-symbols-outlined text-4xl">
                account_circle
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-primary backdrop-blur-[2px]">
            <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:scale-125 group-hover:-translate-y-0.5">
              file_upload
            </span>
          </div>
        </div>

        <div className="text-center sm:text-left flex-grow">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              className="font-mono text-[13px] text-primary hover:text-on-primary-container font-medium group-hover:underline cursor-pointer"
            >
              Browse image file
            </button>
            <span className="text-[13px] text-outline">or drag & drop here</span>
          </div>
          <p className="text-[12px] text-on-surface-variant/70 mt-1">
            PNG, JPG, or WEBP (Max 2MB). Auto-cropped to square credential badge.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <span className="font-mono text-[11px] px-2.5 py-1.5 rounded bg-surface-container text-outline-variant border border-outline-variant/30 group-hover:text-primary group-hover:border-primary/50 group-hover:bg-surface-container-high transition-all">
          Upload
        </span>
      </div>
    </div>
  );
}
