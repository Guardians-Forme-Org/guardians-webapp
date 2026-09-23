// ── Whitelisted emails ────────────────────────────────────────────────────────
// Add or remove emails here to control who can create circles and assign leads.
// Kept per-env so each deploy can diverge later — identical for now across all four.

import { APP_ENV, type AppEnv } from "./env";

const WHITELISTED_EMAILS_BY_ENV: Record<AppEnv, string[]> = {
  local: [
    "tnemalili@gmail.com",
    "abel.siminya@gmail.com",
    "nhlanhla@alignd.co.za",
    "nhlanhlacliq@gmail.com",
    "contato@salve.games",
    "phonti@gmail.com",
  ],
  development: [
    "tnemalili@gmail.com",
    "abel.siminya@gmail.com",
    "nhlanhla@alignd.co.za",
    "nhlanhlacliq@gmail.com",
    "contato@salve.games",
    "phonti@gmail.com",
    "magomola@gmail.com",
    "majorosanita@gmail.com"
  ],
  staging: [
    "tnemalili@gmail.com",
    "abel.siminya@gmail.com",
    "nhlanhla@alignd.co.za",
    "nhlanhlacliq@gmail.com",
    "contato@salve.games",
    "phonti@gmail.com",
    "magomola@gmail.com",
    "majorosanita@gmail.com"
  ],
  production: [
    "tnemalili@gmail.com",
    "abel.siminya@gmail.com",
    "nhlanhla@alignd.co.za",
    "nhlanhlacliq@gmail.com",
    "contato@salve.games",
    "phonti@gmail.com",
    "magomola@gmail.com",
    "majorosanita@gmail.com"
  ],
};

export const WHITELISTED_EMAILS: string[] = WHITELISTED_EMAILS_BY_ENV[APP_ENV];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isWhitelisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return WHITELISTED_EMAILS.map((e) => e.toLowerCase()).includes(
    email.toLowerCase(),
  );
}

// ── Minor accounts ────────────────────────────────────────────────────────────
// Seeded with app_metadata.minor = true. /login returns app_metadata as {} (the
// BE's Supabase client drops it), so read it from the access token's claims.

export const MINOR_ALIAS_DOMAIN = "theguardians.world";

export function isMinorToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload)) as { app_metadata?: { minor?: unknown } };
    return claims.app_metadata?.minor === true;
  } catch {
    return false;
  }
}

export function isMinorUser(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return user?.app_metadata?.minor === true;
}

// Minors log in as "first.last@school"; complete the domain so they don't have
// to type it. Real emails always have a dot in the domain, so they pass through.
export function expandMinorAlias(credential: string): string {
  const at = credential.lastIndexOf("@");
  if (at === -1 || credential.slice(at + 1).includes(".")) return credential;
  return `${credential}.${MINOR_ALIAS_DOMAIN}`.toLowerCase();
}

export function isMinorAlias(email: string): boolean {
  return expandMinorAlias(email.trim()).toLowerCase().endsWith(`.${MINOR_ALIAS_DOMAIN}`);
}

type CircleRef = {
  createdBy?: string;
  circleLead?: unknown;
};

export function isCircleLead(
  userId: string | null | undefined,
  circle: CircleRef,
): boolean {
  if (!userId) return false;
  const lead = circle.circleLead as { id?: string; userId?: string } | null;
  return !!(lead && (userId === lead.id || userId === lead.userId));
}

export function canManageCircle(
  userEmail: string | null | undefined,
  userId: string | null | undefined,
  circle: CircleRef,
): boolean {
  if (isWhitelisted(userEmail)) return true;
  if (userId && circle.createdBy && userId === circle.createdBy) return true;
  const lead = circle.circleLead as { id?: string; userId?: string } | null;
  if (userId && lead && (userId === lead.id || userId === lead.userId))
    return true;
  return false;
}
