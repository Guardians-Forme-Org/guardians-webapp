import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { FileThumb, SaveButton } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function FileUploadStep({ form, update, onNext, nextLabel }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const added = Array.from(e.target.files ?? []);
    if (added.length) update("evidenceFiles", [...form.evidenceFiles, ...added]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    update("evidenceFiles", form.evidenceFiles.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">Upload Evidence</h1>
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
          <p className="text-base font-semibold text-text-primary">Add file</p>
          <p className="text-sm text-[#8f8f8c] text-center px-4">
            Select images, PDFs and CSVs from your phone
          </p>
        </button>

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
