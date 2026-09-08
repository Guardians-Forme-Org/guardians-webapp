"use client";

import { useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";
import { SaveButton } from "../shared";
import type { ApiCircleChallengeMember } from "@/lib/types/circles";
import type { LogFormData } from "../types";
import type { ApiTemplateFormField } from "@/lib/types/challenges";

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
  // The template's own contributors field, on the BE-derived path — its label
  // ("List Contributors") wins over the generic heading. The static path
  // passes nothing and keeps the translated copy.
  field?: ApiTemplateFormField;
};

export default function ContributorsStep({ form, update, onNext, nextLabel, members, users, field }: Props) {
  const t = useTranslations("challenges");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const people = members.map((m) => {
    const u = users.find((u) => u.id === m.userId);
    const name = u
      ? `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""}`.trim() || m.userId
      : m.userId;
    return { id: m.userId, name, avatarUrl: m.avatarUrl || u?.user_metadata.avatarUrl || "", email: u?.email ?? "" };
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

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">
          {field?.label || t("contributorsHeading")}
        </h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-text-primary">{t("contributorsQuestion")}</label>

          {form.contributors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.contributors.map((id) => {
                const p = people.find((p) => p.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 h-8 bg-[#f5f5f5] border border-[rgba(26,26,24,0.14)] rounded-full pl-1 pr-2"
                  >
                    <Avatar src={p?.avatarUrl} className="size-6 rounded-full shrink-0" />
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
              placeholder={field?.placeholder ?? t("searchContributors")}
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
                      <Avatar src={p.avatarUrl} className="size-8 rounded-full shrink-0" />
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
