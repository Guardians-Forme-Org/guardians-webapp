import { APP_ENV, isProduction, type AppEnv } from "@/lib/env";

const COLORS: Record<AppEnv, string> = {
  local: "bg-env-badge-local",
  development: "bg-env-badge-development",
  staging: "bg-env-badge-staging",
  production: "",
};

export default function EnvBadge() {
  if (isProduction) return null;

  return (
    <span
      className={`fixed top-2 right-2 z-50 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md pointer-events-none ${COLORS[APP_ENV]}`}
    >
      {APP_ENV}
    </span>
  );
}
