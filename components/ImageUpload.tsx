"use client";

import { useCallback, useState } from "react";

interface ImageUploadProps {
  onImageUpload: (base64: string, mimeType: string, preview: string) => void;
  isAnalyzing: boolean;
}

export default function ImageUpload({ onImageUpload, isAnalyzing }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(",")[1];
        setPreview(result);
        onImageUpload(base64, file.type, result);
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="w-full">
      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
          ${isDragging
            ? "border-emerald-400 bg-emerald-50 scale-[1.01]"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
          }
          ${preview ? "border-solid border-gray-200 bg-white p-2" : "p-10"}
        `}
      >
        {preview ? (
          <div className="relative w-full">
            <img
              src={preview}
              alt="Uploaded food"
              className="w-full max-h-72 object-contain rounded-xl"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm">
                <div className="flex gap-1 mb-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-white text-sm font-medium">Analyzing nutrition...</p>
              </div>
            )}
            {!isAnalyzing && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                Click to change
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="p-4 bg-emerald-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-1">
              Drop your food photo here
            </p>
            <p className="text-gray-400 text-sm">or click to browse</p>
            <p className="text-gray-300 text-xs mt-3">PNG, JPG, WEBP up to 10MB</p>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />
      </label>
    </div>
  );
}
