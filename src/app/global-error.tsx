"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    const eventId = Sentry.captureException(error);
    Sentry.showReportDialog({ eventId });
  }, [error]);

  return (
    <html>
      <body className="h-full bg-white text-zinc-900 antialiased">
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-zinc-500">
            Our team has been notified. Please try refreshing the page.
          </p>
        </div>
      </body>
    </html>
  );
}
