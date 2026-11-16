# 6. Roles and permissions

## Roles

| Role | Where it's stored |
| --- | --- |
| **Admin** | The API's admin list (configuration per environment). The API tells the app whether the signed-in user is an admin in the login data. |
| **Creator** | `circleMembers.role = CREATOR` for the person who created the circle. |
| **Circle Lead** | `circleMembers.role = CIRCLE_LEAD`. A circle can have several. |
| **Facilitator** | `challengeMembers.role = CHALLENGE_FACILITATOR`. A challenge can have several. |
| **Member** | `circleMembers` / `challengeMembers` with `role = MEMBER`. |
| **Minor** | `app_metadata.minor = true` on the Supabase Auth account. Set when the account is created; users can't change `app_metadata`. |

`circleMembers.circleId` and `challengeMembers.challengeId` hold the short codes
(`circles.circleId`, `challenges.challengeId`, e.g. `7C106B3`), not the row UUIDs.

## What each role can do

| Action | Admin | Creator | Lead | Facilitator | Member | Minor |
| --- | --- | --- | --- | --- | --- | --- |
| Create a circle | ✓ | | | | | |
| Edit a circle | ✓ | ✓ | ✓ | | | |
| Add or remove circle leads | ✓ | ✓ | | | | |
| Create a challenge in the circle | ✓ | ✓ | ✓ | | | |
| Edit a challenge | ✓ | ✓ | ✓ | ✓ | | |
| Add or remove facilitators | ✓ | ✓ | ✓ | | | |
| Log evidence, complete and reopen steps | ✓ | ✓ | ✓ | ✓ | | |
| Join a circle | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Join a challenge | ✓ | ✓ | ✓ | ✓ | ✓ | own circle only |
| Be made a lead or facilitator | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Edit own profile, reset own password | ✓ | ✓ | ✓ | ✓ | ✓ | |

"Lead" and "Facilitator" mean of that circle or challenge. Leads and the creator
also act on every challenge in their circle.

Further rules:

- A circle keeps at least one lead, and a challenge at least one facilitator.
  Removing the last is refused (`circle_last_lead`, `challenge_last_facilitator`).
- Removing a lead or facilitator, or stepping down, sets their role back to
  `MEMBER`. They keep their membership and their entries.
- Joining a challenge also makes the person a member of its circle.

## How it's enforced

**In the API.** The API is the only place these rules are enforced.

1. **Login check.** Every request that changes something needs
   `Authorization: Bearer <access token>`. The API verifies the token's
   signature against the Supabase project's signing keys, and its expiry, then
   takes the acting user from it. Who is acting never comes from a header or the
   request body. A missing, forged or expired token gets `401`.
2. **Permission check.** The API loads the circle or challenge and the acting
   user's roles, and checks the table above. A refused action gets `403`.
3. **Minors.** `middlewares.DenyMinors` refuses minors on the routes they're
   excluded from, including when someone tries to make a minor a lead or
   facilitator.

Reading circles, challenges, templates and the Home totals doesn't need a login,
so those pages work for visitors.

**In the app.** `lib/permissions.ts` and `lib/roles.ts` hold the same rules, so the
app shows only the buttons a person can use (`isCircleLead`, `isFacilitator`,
`canManageCircle`, `canManageLeads`, `canManageFacilitators`). That's for display
only. If the app and the API ever disagree, the API wins and the person sees an
error. When a rule changes, change both and update `lib/permissions.test.ts`.

## Sessions

- Supabase Auth issues an access token, valid for about an hour, and a refresh
  token. The app keeps both and renews the access token before it expires.
- If renewal fails (for example, the account was deleted), the API's `401` makes
  the app sign the person out.
- Minors are read from the token's `app_metadata.minor`. The app uses it to
  hide joining, role pickers and profile editing; the API uses it to refuse
  those actions.
