import type { LoginData } from "./auth";
import type { ApiCircle, ApiCircleChallenge } from "./types/circles";
import type { BadgeRole } from "@/components/ui/RoleBadge";
import { isWhitelisted } from "./permissions";

// Global roles across all circles + challenges (for profile page).
// A user can hold multiple roles simultaneously.
export function computeGlobalRoles(
  userId: string | null | undefined,
  userEmail: string | null | undefined,
  loginData: LoginData | null,
): BadgeRole[] {
  if (!userId) return []; // guest — no badge

  const roles: BadgeRole[] = [];

  if (isWhitelisted(userEmail)) roles.push("admin");

  const isCircleLead = (loginData?.circles ?? []).some(
    (c) => (c.circleLead as { userId?: string } | null)?.userId === userId,
  );
  if (isCircleLead) roles.push("circle-lead");

  const isFacilitator = (loginData?.challenges ?? []).some((c) =>
    (c.members ?? []).some(
      (m) => m.userId === userId && m.role === "CHALLENGE_FACILITATOR",
    ),
  );
  if (isFacilitator) roles.push("facilitator");

  return roles;
}

// Roles within a specific circle.
export function computeCircleRoles(
  userId: string | null | undefined,
  userEmail: string | null | undefined,
  circle: ApiCircle,
): BadgeRole[] {
  if (!userId) return [];

  const roles: BadgeRole[] = [];

  if (isWhitelisted(userEmail)) roles.push("admin");

  if ((circle.circleLead as { userId?: string } | null)?.userId === userId) {
    roles.push("circle-lead");
  }

  const isFacilitator = circle.challenges.some(
    (c) => (c.facilitator as { userId?: string } | null)?.userId === userId,
  );
  if (isFacilitator) roles.push("facilitator");

  return roles;
}

// Roles within a specific challenge.
export function computeChallengeRoles(
  userId: string | null | undefined,
  userEmail: string | null | undefined,
  challenge: ApiCircleChallenge,
): BadgeRole[] {
  if (!userId) return [];

  const roles: BadgeRole[] = [];

  if (isWhitelisted(userEmail)) roles.push("admin");

  const isFacilitator = (challenge.members ?? []).some(
    (m) => m.userId === userId && m.role === "CHALLENGE_FACILITATOR",
  );
  if (isFacilitator) roles.push("facilitator");

  return roles;
}
