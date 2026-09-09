import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./locales";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // next-intl's default NEXT_LOCALE cookie has no maxAge, so it's a session
  // cookie — the chosen language is lost when the browser closes and detection
  // falls back to Accept-Language. Give it a year so the choice sticks.
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});
