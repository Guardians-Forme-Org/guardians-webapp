import { describe, expect, it } from "vitest";
import {
  canManageFacilitators,
  canManageLeads,
  circleLeadIdsOf,
  facilitatorIdsOf,
  isCircleLead,
  isFacilitator,
} from "./permissions";

// An admin email (WHITELISTED_EMAILS, local env)
const ADMIN = "phonti@gmail.com";

const circle = {
  createdBy: "creator",
  circleLead: { userId: "lead1" },
  circleLeads: [{ userId: "lead1" }, { userId: "lead2" }],
};

describe("leads", () => {
  it("lists every lead, falling back to the single field", () => {
    expect(circleLeadIdsOf(circle)).toEqual(["lead1", "lead2"]);
    expect(circleLeadIdsOf({ circleLead: { id: "old" } })).toEqual(["old"]);
    expect(circleLeadIdsOf({ circleLead: null })).toEqual([]);
  });

  it("treats each lead as a lead", () => {
    expect(isCircleLead("lead2", circle)).toBe(true);
    expect(isCircleLead("someone", circle)).toBe(false);
  });

  it("lets admins and the creator manage leads, not the leads themselves", () => {
    expect(canManageLeads(ADMIN, "x", circle)).toBe(true);
    expect(canManageLeads(null, "creator", circle)).toBe(true);
    expect(canManageLeads(null, "lead1", circle)).toBe(false);
  });
});

describe("facilitators", () => {
  it("lists every facilitator: the BE list, else member roles, else the single field", () => {
    expect(facilitatorIdsOf({ facilitators: [{ userId: "f1" }, { userId: "f2" }] })).toEqual(["f1", "f2"]);
    expect(
      facilitatorIdsOf({
        members: [
          { userId: "m", role: "MEMBER" },
          { userId: "f3", role: "CHALLENGE_FACILITATOR" },
          { userId: "f3", role: "CHALLENGE_FACILITATOR" },
        ],
      }),
    ).toEqual(["f3"]);
    expect(facilitatorIdsOf({ facilitator: { userId: "only" }, members: [] })).toEqual(["only"]);
  });

  it("treats each facilitator as a facilitator", () => {
    expect(isFacilitator("f2", { facilitators: [{ userId: "f1" }, { userId: "f2" }] })).toBe(true);
  });

  it("lets admins, the creator and each lead manage facilitators, not facilitators", () => {
    expect(canManageFacilitators(ADMIN, "x", null)).toBe(true);
    expect(canManageFacilitators(null, "creator", circle)).toBe(true);
    expect(canManageFacilitators(null, "lead2", circle)).toBe(true);
    expect(canManageFacilitators(null, "f1", circle)).toBe(false);
    expect(canManageFacilitators(null, "lead1", null)).toBe(false);
  });
});
