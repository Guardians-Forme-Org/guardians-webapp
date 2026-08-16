import * as Sentry from "@sentry/nextjs";
import { APP_ENV, SENTRY_DSN } from "@/lib/env";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: APP_ENV,
  tracesSampleRate: APP_ENV === "production" ? 0.1 : 1.0,
  // Backend API calls (guardians-api) returning 4xx/5xx are normal fetch
  // responses, not thrown exceptions — without this integration a 500 like
  // CH-004's would never surface as a Sentry issue.
  integrations: [Sentry.httpClientIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
