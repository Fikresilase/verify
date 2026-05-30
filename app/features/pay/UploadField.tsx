"use client";

import Image from "next/image";
import { Icon } from "@/app/components/Icon";

export function UploadField({
  fileName,
  onChange,
  onClear,
  preview,
}: {
  fileName: string;
  onChange: (file: File) => void;
  onClear: () => void;
  preview: string;
}) {
  if (preview) {
    return (
      <div className="relative mb-5 aspect-[3/4] overflow-hidden rounded-lg border border-[#c6c6cd] bg-[#fbfdfb] shadow-sm">
        <Image alt="Top-up receipt preview" className="object-cover" fill sizes="(max-width: 768px) 100vw, 480px" src={preview} unoptimized />
        <button className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#fbfdfb]/95 text-[#ba1a1a] shadow-[0_14px_30px_-18px_rgba(17,24,39,0.7)]" onClick={onClear} type="button">
          x
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-[#fbfdfb]/95 p-4 backdrop-blur">
          <p className="text-sm font-bold">{fileName}</p>
          <p className="text-xs font-semibold text-[#45464d]">Receipt ready for Telebirr verification</p>
        </div>
      </div>
    );
  }

  return (
    <label className="mb-5 block">
      <span className="mb-1 block text-sm font-semibold">Proof of Payment</span>
      <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#c6c6cd] bg-[#f8fbff] p-8 text-center transition-colors hover:bg-[#eff4ff]">
        <Icon className="mb-3 rounded-full bg-[#e5eeff] p-3 text-[#111827]" name="upload_file" size={48} />
        <span className="text-sm font-semibold">{fileName || "Tap to upload or drag and drop"}</span>
        <span className="mt-1 text-xs font-medium text-[#76777d]">JPG, PNG, PDF, max 5MB</span>
        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onChange(file);
          }}
          type="file"
        />
      </div>
    </label>
  );
}
