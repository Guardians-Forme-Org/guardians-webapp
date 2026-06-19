import { useEffect, useRef, useState } from "react";
import { ChevronRight, FileText, Plus, Search, X } from "lucide-react";
import { SaveButton } from "../shared";
import type { ApiCircleChallengeMember } from "@/lib/types/circles";
import type { LogFormData } from "../types";

type UserLike = {
  id: string;
  email?: string;
  user_metadata: { firstName?: string; lastName?: string; avatarUrl?: string };
};

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
  members: ApiCircleChallengeMember[];
  users: UserLike[];
};

function FileThumb({ file }: { file: File }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (file.type.startsWith("image/")) {
    return src ? <img src={src} alt="" className="w-full h-full object-cover" /> : null;
  }
  if (file.type.includes("pdf")) {
    return <FileText size={20} className="text-red-500" />;
  }
  return <FileText size={20} className="text-[#8f8f8c]" />;
}

export default function FileUploadStep({ form, update, onNext, nextLabel, members, users }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const people = members.map((m) => {
    const u = users.find((u) => u.id === m.userId);
    const name = u
      ? `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""}`.trim() || m.userId
      : m.userId;
    return { id: m.userId, name, avatarUrl: u?.user_metadata.avatarUrl ?? "", email: u?.email ?? "" };
  });

  const filtered = people.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    const next = form.contributors.includes(id)
      ? form.contributors.filter((c) => c !== id)
      : [...form.contributors, id];
    update("contributors", next);
  };

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
              <p className="text-sm text-[#8f8f8c]">Done by individual</p>
            </div>
            <button
              onClick={() => removeFile(i)}
              className="size-8 flex items-center justify-center text-[#8f8f8c] shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        <div className="h-px bg-[rgba(26,26,24,0.08)]" />

        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-text-primary">Impact</label>
          <textarea
            value={form.impactDescription}
            onChange={(e) => update("impactDescription", e.target.value)}
            placeholder="e.g. Planted x3 50cm indigenous trees with compost and water."
            rows={4}
            className="border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 py-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-text-primary">Who performed the action?</label>

          {form.contributors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.contributors.map((id) => {
                const p = people.find((p) => p.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 h-8 bg-[#f5f5f5] border border-[rgba(26,26,24,0.14)] rounded-full pl-1 pr-2"
                  >
                    <div className="size-6 rounded-full bg-[#d9d9d9] overflow-hidden shrink-0">
                      {p?.avatarUrl && (
                        <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-sm text-text-primary">{p?.name ?? id}</span>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => toggle(id)}
                      className="text-[#8f8f8c]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search contributors"
              className="w-full h-[44px] border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 pr-10 text-base placeholder:text-[rgba(26,26,24,0.5)] outline-none"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f8f8c] pointer-events-none" />

            {open && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[rgba(26,26,24,0.14)] rounded-[8px] shadow-lg z-50 max-h-[220px] overflow-y-auto">
                {filtered.map((p) => {
                  const selected = form.contributors.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { toggle(p.id); setSearch(""); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#f5f5f5]"
                    >
                      <div className="size-8 rounded-full bg-[#d9d9d9] overflow-hidden shrink-0">
                        {p.avatarUrl && (
                          <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${selected ? "text-gotf-green" : "text-text-primary"}`}>
                          {p.name}
                        </p>
                        {p.email && (
                          <p className="text-xs text-[#8f8f8c] truncate">{p.email}</p>
                        )}
                      </div>
                      {selected ? (
                        <div className="size-5 rounded-full border-2 border-gotf-green flex items-center justify-center shrink-0">
                          <div className="size-2.5 rounded-full bg-gotf-green" />
                        </div>
                      ) : (
                        <ChevronRight size={16} className="text-[#8f8f8c] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
