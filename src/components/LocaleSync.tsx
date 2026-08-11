"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";
import { setCurrentLocale } from "@/lib/locale-store";

// Keeps the module-level locale-store in sync with the active next-intl locale
// so apiFetch can send the correct Accept-Language header without each hook
// needing to call useLocale() individually.
export default function LocaleSync() {
  const locale = useLocale();
  setCurrentLocale(locale); // sync on every render (before effects)
  useEffect(() => { setCurrentLocale(locale); }, [locale]);
  return null;
}
