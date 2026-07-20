"use client";

import React, { useState, useRef } from "react";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

interface DragDropUploaderProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export default function DragDropUploader({
  onUploadSuccess,
  label = "Drag & Drop Image or Click to Browse",
  accept = "image/*",
  maxSizeMB = 5
}: DragDropUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be smaller than ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      // Read as base64 Data URL
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Upload to server endpoint
          const res = await fetch(`/api/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              base64Data
            })
          });

          const json = await res.json();
          if (res.ok && json.success && json.url) {
            toast.success("Image uploaded successfully!");
            onUploadSuccess(json.url);
          } else {
            toast.error(json.error || "Failed to upload image.");
          }
        } catch (err) {
          console.error("Upload error:", err);
          toast.error("Upload failed due to network error.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read image file.");
        setIsUploading(false);
      };
    } catch (err) {
      console.error(err);
      toast.error("Upload failed due to network error.");
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`w-full min-h-[110px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {isUploading ? (
        <div className="space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
          <p className="text-[10px] text-on-surface-variant font-medium">Uploading and committing image...</p>
        </div>
      ) : (
        <div className="space-y-1.5 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl animate-pulse">
            cloud_upload
          </span>
          <p className="text-xs font-semibold text-white/95">{label}</p>
          <p className="text-[9px] text-on-surface-variant/70 font-light">
            Accepts image files (Max {maxSizeMB}MB)
          </p>
        </div>
      )}
    </div>
  );
}
