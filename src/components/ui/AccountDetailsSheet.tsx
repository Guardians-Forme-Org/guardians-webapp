"use client";

import { X, User } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AuthUser } from "@/lib/types/auth";

type Props = {
  user: AuthUser;
  avatarUrl?: string;
  onClose: () => void;
};

export default function AccountDetailsSheet({ user, avatarUrl, onClose }: Props) {
  const t = useTranslations("common");
  const m = user.user_metadata;
  const fullName = [m.firstName, m.lastName].filter(Boolean).join(" ") || "—";

  const fields = [
    { label: t("fullNameLabel"), value: fullName },
    { label: t("emailLabel"),    value: user.email || "—" },
    { label: t("mobileLabel"),   value: m.mobile || "—" },
    { label: t("usernameLabel"), value: m.username || "—" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] pb-safe-nav">
        <div className="absolute left-1/2 -translate-x-1/2 top-3 w-10 h-1 rounded-full bg-[#e0e0e0]" />

        <div className="flex items-center justify-between px-7.5 pt-5 pb-4">
          <p className="text-base font-semibold text-black mt-3">{t("accountDetails")}</p>
          <button onClick={onClose} aria-label={t("close")} className="text-text-muted mt-3">
            <X size={20} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center pb-5">
          <div className="w-20 h-20 rounded-full bg-surface border-2 border-border overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-text-muted" />
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col divide-y divide-progress-track px-7.5 pb-8">
          {fields.map(({ label, value }) => (
            <div key={label} className="py-4">
              <p className="text-xs text-text-muted mb-1">{label}</p>
              <p className="text-base text-black">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
