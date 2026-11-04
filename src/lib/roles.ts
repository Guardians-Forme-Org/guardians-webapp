import type { LoginData } from "./auth";
import type { ApiCircle, ApiCircleChallenge } from "./types/circles";
import type { BadgeRole } from "@/components/ui/RoleBadge";
import { circleLeadIdsOf, isCircleLead, isFacilitator, isWhitelisted } from "./permissions";

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

  if ((loginData?.circles ?? []).some((c) => isCircleLead(userId, c))) {
    roles.push("circle-lead");
  }

  if ((loginData?.challenges ?? []).some((c) => isFacilitator(userId, c))) {
    roles.push("facilitator");
  }

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

  if (circleLeadIdsOf(circle).includes(userId)) {
    roles.push("circle-lead");
  }

  if (circle.challenges.some((c) => isFacilitator(userId, c))) {
    roles.push("facilitator");
  }

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

  if (isFacilitator(userId, challenge)) roles.push("facilitator");

  return roles;
}
