"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/locales";
import { X, Check } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  af: "Afrikaans",
  zu: "isiZulu",
  fr: "Français",
};

export default function LanguageSwitcher({ onClose }: { onClose: () => void }) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("common");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] pb-safe-nav">
        {/* Handle + header */}
        <div className="flex items-center justify-between px-7.5 pt-5 pb-4">
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-10 h-1 rounded-full bg-[#e0e0e0]" />
          <p className="text-base font-semibold text-black mt-3">{t("language")}</p>
          <button onClick={onClose} aria-label={t("close")} className="text-text-muted mt-3">
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col divide-y divide-progress-track px-7.5 pb-8">
          {locales.map((locale) => {
            const isActive = locale === currentLocale;
            return (
              <Link
                key={locale}
                href={pathname}
                locale={locale}
                onClick={onClose}
                className="flex items-center justify-between py-4"
              >
                <span
                  className={`text-base ${
                    isActive ? "font-semibold text-gotf-green" : "text-black"
                  }`}
                >
                  {LOCALE_LABELS[locale] ?? locale}
                </span>
                {isActive && <Check size={18} className="text-gotf-green" />}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
