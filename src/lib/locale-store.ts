// Module-level locale tracker so apiFetch can read the current UI locale
// without needing React context. Updated by LocaleSync on every render.
let currentLocale = "en";

export function setCurrentLocale(locale: string) {
  currentLocale = locale;
}

export function getCurrentLocale(): string {
  return currentLocale;
}
