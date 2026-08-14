import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "forme-fk",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  webpack: { treeshake: { removeDebugLogging: true } },
  sourcemaps: { disable: true },
});
