export type AppEnv = "local" | "development" | "staging" | "production";

export const APP_ENV: AppEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as AppEnv | undefined) ?? "local";

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const isProduction = APP_ENV === "production";

// Staging and production are the environments real users touch — anything
// gated here should behave the same as it will after the next deploy, even
// while local/development keep the looser behavior useful for testing.
export const isStagingOrProduction = APP_ENV === "staging" || APP_ENV === "production";
