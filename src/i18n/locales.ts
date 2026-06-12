export const locales = ["en", "af", "zu", "fr"] as const;
export const defaultLocale = "en" as const;
export type Locale = (typeof locales)[number];

export const namespaces = [
  "common",
  "onboarding",
  "get-started",
  "login",
  "signup",
  "splash",
  "home",
  "discover",
  "circles",
  "challenges",
  "profile",
] as const;

export type Namespace = (typeof namespaces)[number];
