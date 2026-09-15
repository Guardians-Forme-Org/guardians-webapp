"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

const SHORT_LABELS: Record<string, string> = {
  en: "EN",
  af: "AF",
  zu: "ZU",
  fr: "FR",
  hu: "HU",
};

/**
 * Compact language control for the screens shown before sign-in.
 *
 * The switcher in the profile is only reachable once you have an account, so a
 * visitor whose browser is not set to Hungarian had no way to reach the
 * Hungarian version. Opens the same sheet the profile uses; the locale cookie
 * persists for a year, so this only needs touching once.
 */
export default function LocalePill({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("language")}
        className={`flex items-center gap-1.5 text-base font-medium ${className}`}
      >
        <Globe size={17} aria-hidden />
        {SHORT_LABELS[locale] ?? locale.toUpperCase()}
      </button>

      {open && <LanguageSwitcher onClose={() => setOpen(false)} />}
    </>
  );
}
