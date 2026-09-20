"use client";

import React, { useRef, useState } from "react";

interface DocumentDropzoneProps {
  onDocumentSelected: (file: File | null) => void;
}

export default function DocumentDropzone({
  onDocumentSelected,
}: DocumentDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert("Document file size exceeds 8MB limit.");
      return;
    }
    setSelectedFile(file);
    onDocumentSelected(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="block font-mono text-[12px] text-on-surface-variant uppercase tracking-wider">
        Aadhaar Verification Document (PDF / JPG / PNG)
      </label>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`dropzone-glow p-5 rounded-lg border border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer group active:scale-[0.99] ${
          isDragging
            ? "border-primary bg-surface-container-high/70 shadow-[0_0_24px_rgba(79,70,229,0.3)]"
            : "border-outline-variant/40 bg-surface-container-lowest/50 hover:border-primary/80"
        }`}
      >
        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(79,70,229,0.4)] transition-all duration-300 mb-2">
          <span className="material-symbols-outlined text-2xl transition-transform duration-300 group-hover:-translate-y-0.5">
            upload_file
          </span>
        </div>

        <div className="text-[14px] text-on-surface">
          <span className="text-primary font-medium group-hover:underline">
            Click to upload document
          </span>{" "}
          or drag & drop
        </div>

        <p className="text-[12px] text-on-surface-variant/70 mt-1">
          Accepts Government e-Aadhaar PDF or scanned front/back images (max 8MB)
        </p>

        {selectedFile && (
          <div className="mt-3 px-3.5 py-1.5 rounded-lg bg-surface-container border border-tertiary/40 font-mono text-[12px] text-tertiary flex items-center gap-2 shadow-[0_0_12px_rgba(78,222,163,0.2)] animate-pulse">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>
              {selectedFile.name} (
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
