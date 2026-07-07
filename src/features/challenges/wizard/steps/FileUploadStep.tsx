"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { FileThumb, SaveButton } from "../shared";
import { compressImage, MAX_UPLOAD_BYTES } from "@/lib/compressImage";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function FileUploadStep({ form, update, onNext, nextLabel }: Props) {
  const t = useTranslations("challenges");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFilesAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    // Phone photos exceed the API's 1MB body limit; compress before storing
    const processed = await Promise.all(
      picked.map((f) =>
        f.type.startsWith("image/") ? compressImage(f).catch(() => f) : f,
      ),
    );
    const added = processed.filter((f) => f.size <= MAX_UPLOAD_BYTES);
    const rejected = processed.find((f) => f.size > MAX_UPLOAD_BYTES);
    setSizeError(rejected ? t("fileTooLarge", { name: rejected.name }) : null);
    if (added.length) update("evidenceFiles", [...form.evidenceFiles, ...added]);
  };

  const removeFile = (index: number) => {
    update("evidenceFiles", form.evidenceFiles.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">{t("uploadEvidence")}</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.csv"
          multiple
          className="hidden"
          onChange={handleFilesAdded}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-[1.5px] border-dashed border-[rgba(26,26,24,0.28)] rounded-[12px] py-8 flex flex-col items-center gap-2"
        >
          <div className="size-10 rounded-full border-2 border-[rgba(26,26,24,0.28)] flex items-center justify-center">
            <Plus size={20} className="text-text-primary" />
          </div>
          <p className="text-base font-semibold text-text-primary">{t("addFile")}</p>
          <p className="text-sm text-[#8f8f8c] text-center px-4">
            {t("fileUploadHint")}
          </p>
        </button>
        {sizeError && (
          <div className="flex items-center gap-1 text-[#a32d2d]">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="text-xs">{sizeError}</span>
          </div>
        )}

        {form.evidenceFiles.map((file, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border border-[rgba(26,26,24,0.14)] rounded-[12px] p-4"
          >
            <div
              className={`size-10 rounded-[8px] overflow-hidden flex items-center justify-center shrink-0 ${
                file.type.startsWith("image/") ? "bg-[#f0f0ee]" : file.type.includes("pdf") ? "bg-red-50" : "bg-[#f5f5f5]"
              }`}
            >
              <FileThumb file={file} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text-primary truncate">{file.name}</p>
            </div>
            <button
              onClick={() => removeFile(i)}
              className="size-8 flex items-center justify-center text-[#8f8f8c] shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
