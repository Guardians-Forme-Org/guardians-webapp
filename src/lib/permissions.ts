// ── Whitelisted emails ────────────────────────────────────────────────────────
// Add or remove emails here to control who can create circles and assign leads.

export const WHITELISTED_EMAILS: string[] = [
  "tnemalili@gmail.com",
  "abel.siminya@gmail.com",
  "nhlanhla@alignd.co.za",
  "nhlanhlacliq@gmail.com",
  "contato@salve.games",
  "phonti@gmail.com",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isWhitelisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return WHITELISTED_EMAILS.map((e) => e.toLowerCase()).includes(
    email.toLowerCase(),
  );
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
