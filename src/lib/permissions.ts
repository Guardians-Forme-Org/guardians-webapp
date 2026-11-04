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
    "ricardo@salve.games",
  ],
  development: [
    "tnemalili@gmail.com",
    "abel.siminya@gmail.com",
    "nhlanhla@alignd.co.za",
    "nhlanhlacliq@gmail.com",
    "contato@salve.games",
    "phonti@gmail.com",
    "magomola@gmail.com",
    "majorosanita@gmail.com",
    "ricardo@salve.games",
  ],
  staging: [
    "tnemalili@gmail.com",
    "abel.siminya@gmail.com",
    "nhlanhla@alignd.co.za",
    "nhlanhlacliq@gmail.com",
    "contato@salve.games",
    "phonti@gmail.com",
    "magomola@gmail.com",
    "majorosanita@gmail.com",
    "ricardo@salve.games",
  ],
  production: [
    "tnemalili@gmail.com",
    "abel.siminya@gmail.com",
    "nhlanhla@alignd.co.za",
    "nhlanhlacliq@gmail.com",
    "contato@salve.games",
    "phonti@gmail.com",
    "magomola@gmail.com",
    "majorosanita@gmail.com",
    "ricardo@salve.games",
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
  circleLeads?: { userId?: string }[] | null;
};

type ChallengeRef = {
  facilitator?: unknown;
  facilitators?: { userId?: string }[] | null;
  members?: { userId?: string; role?: string }[] | null;
};

const idOf = (person: unknown): string | undefined => {
  const p = person as { id?: string; userId?: string } | null | undefined;
  return p?.userId ?? p?.id;
};

// The user ids of a circle's leads. The BE lists them all in circleLeads;
// older responses only carry the single circleLead.
export function circleLeadIdsOf(circle: CircleRef): string[] {
  if (circle.circleLeads?.length) {
    return circle.circleLeads.map(idOf).filter((id): id is string => !!id);
  }
  const single = idOf(circle.circleLead);
  return single ? [single] : [];
}

// The user ids of a challenge's facilitators: the BE's facilitators list, else
// members holding the facilitator role, else the single facilitator field
export function facilitatorIdsOf(challenge: ChallengeRef): string[] {
  if (challenge.facilitators?.length) {
    return challenge.facilitators.map(idOf).filter((id): id is string => !!id);
  }
  const byRole = (challenge.members ?? [])
    .filter((m) => m.role === "CHALLENGE_FACILITATOR")
    .map((m) => m.userId)
    .filter((id): id is string => !!id);
  if (byRole.length) return [...new Set(byRole)];
  const single = idOf(challenge.facilitator);
  return single ? [single] : [];
}

export function isCircleLead(
  userId: string | null | undefined,
  circle: CircleRef,
): boolean {
  return !!userId && circleLeadIdsOf(circle).includes(userId);
}

export function isFacilitator(
  userId: string | null | undefined,
  challenge: ChallengeRef,
): boolean {
  return !!userId && facilitatorIdsOf(challenge).includes(userId);
}

export function canManageCircle(
  userEmail: string | null | undefined,
  userId: string | null | undefined,
  circle: CircleRef,
): boolean {
  if (isWhitelisted(userEmail)) return true;
  if (userId && circle.createdBy && userId === circle.createdBy) return true;
  return isCircleLead(userId, circle);
}

// Adding and removing a circle's leads: admins and the circle's creator
export function canManageLeads(
  userEmail: string | null | undefined,
  userId: string | null | undefined,
  circle: CircleRef,
): boolean {
  if (isWhitelisted(userEmail)) return true;
  return !!userId && !!circle.createdBy && userId === circle.createdBy;
}

// Adding and removing a challenge's facilitators: admins, the circle's
// creator and each of its leads
export function canManageFacilitators(
  userEmail: string | null | undefined,
  userId: string | null | undefined,
  circle: CircleRef | null | undefined,
): boolean {
  if (isWhitelisted(userEmail)) return true;
  return !!circle && canManageCircle(userEmail, userId, circle);
}
