import * as Sentry from "@sentry/nextjs";
import { APP_ENV, SENTRY_DSN } from "@/lib/env";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: APP_ENV,
  tracesSampleRate: APP_ENV === "production" ? 0.1 : 1.0,
});
