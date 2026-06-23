ehoGuardians — Frontend Demo Status 2 · June 23, 2026

---

Delta from v1 (June 22): 8 features closed.
2 partial screens promoted to done. 6 missing-important items resolved.
1 missing-critical (Guest Access) resolved. 1 missing-important remains.

Counts: 17 done · 0 partial · 7 missing · 0 blocked

---

✅ Done

┌──────────────────────────────┬──────────────────────────────────────────────────────────┐
│ Feature │ Notes │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Auth — Signup Wizard │ 4-step wizard. Photo step now has "Skip for now" — │
│ │ users can register without uploading an avatar. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Auth — Login │ Email + password via POST /login. AuthContext manages │
│ │ session state. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Token Refresh / │ NEW. Expired token silently refreshed at boot via │
│ Persistent Sessions │ POST /api/v1/token (refresh_token grant). Proactive │
│ │ refresh fires every 15 min — users stay logged in │
│ │ indefinitely without re-authenticating. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Home / Dashboard │ Search, impact badges, challenge carousel, circles list. │
│ │ Note: location pill removal still pending (see below). │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Challenge Creation Wizard │ 7-step wizard. POST /createchallenge. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Circle Creation Wizard │ 5-step wizard with region picker, image upload. │
│ │ POST /createcircle. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Log Evidence Wizard │ Config-driven via stepFormConfig.ts. Draft persistence, │
│ │ file upload, measurement, volunteer hours. │
│ │ + View mode: activity tap opens wizard pre-populated at │
│ │ review step (read-only for members). │
│ │ + Edit mode: facilitator+ sees pencil icons; edits │
│ │ resubmit to PUT /evidences/:id (placeholder — │
│ │ frontend wired, backend building). │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Challenge Detail Screen │ WAS PARTIAL. All gaps resolved: │
│ │ · Step completion indicator (green border + checkmark) │
│ │ · "Join Conversation" gated to members only │
│ │ · Role badge (contextual to this challenge) │
│ │ · Activity rows clickable → evidence view mode │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Circle Detail Screen │ WAS PARTIAL. All gaps resolved: │
│ │ · Step completion on challenge rows │
│ │ · "Join Conversation" gated to members only │
│ │ · Role badge (contextual to this circle) │
│ │ · Activity rows clickable → evidence view mode │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Profile Page │ Identity, impact stats, activity trace, settings sheet. │
│ │ Global role badge (shows all roles across all contexts). │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Discover Page │ Connected to real API via useChallenges() + api.get │
│ │ ("/circles"). Dead mock route deleted. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Invite Link Sharing + │ Invite uses window.location.origin. RecentActivitiesList │
│ Recent Activities │ on profile, challenge, and circle screens. Activity rows │
│ │ now tappable (authenticated users only). │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Role Badge System │ NEW. Three contexts: │
│ │ · Global — profile page (all roles across all circles │
│ │ and challenges) │
│ │ · Circle-scoped — circle screen (roles in that circle) │
│ │ · Challenge-scoped — step screen (roles in that │
│ │ challenge) │
│ │ Roles: Admin · Circle Lead · Facilitator. Multiple │
│ │ badges shown simultaneously. Guest and member get none. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Activity Detail View Mode │ NEW. Tapping a feed item saves its data to sessionStorage │
│ │ and navigates to the log wizard at the review step. │
│ │ Form is pre-populated from the activity record │
│ │ (measurement, hours, contributors, description). │
│ │ Members see read-only. Facilitator+ see edit icons. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Permission Enforcement │ NEW. Evidence editing is role-gated: │
│ (Evidence) │ · canEdit = facilitator of this challenge │
│ │ OR circle lead of the owning circle OR admin │
│ │ · Members: no edit icons, no action buttons │
│ │ · Facilitator+: pencil icons visible; edits route to │
│ │ PUT /evidences/:id │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Guest / Public Access │ WAS MISSING CRITICAL. Route guard implemented. │
│ │ Discover, Circle, Challenge pages readable without │
│ │ login. Join actions prompt auth redirect with return URL. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Profile Photo Skip │ WAS MISSING IMPORTANT. "Skip for now" button on step 3 │
│ (Onboarding) │ of signup. No avatar = valid submit. │
└──────────────────────────────┴──────────────────────────────────────────────────────────┘

---

❌ Missing — Critical (blocks pilot)

Feature: Step 1 Wire-up (Composting Sprint)
Notes: Frontend component done. Needs POST /submitCH004 with
stepID=step1. Backend must also handle stepID=step3 to set
completed=true on mark-complete.
────────────────────────────────────────
Feature: Password Recovery
Notes: Nothing on either side. Fastest path:
supabase.auth.resetPasswordForEmail() + a /reset-password callback
page. No backend endpoint needed if Supabase handles the email.
────────────────────────────────────────
Feature: Edit — Profile
Notes: UI not built. Backend PUT /users/:id is panic("unimplemented").
Blocked until backend is ready.
────────────────────────────────────────
Feature: Edit — Circle
Notes: UI not built. Backend PUT /circles/:id is panic("unimplemented").
Blocked until backend is ready.
────────────────────────────────────────
Feature: Edit — Challenge
Notes: UI not built. Backend PUT /challenges/:id exists and accepts a
JSON map — may already work. Frontend effort only.
────────────────────────────────────────
Feature: Global Impact Toggle
Notes: Homepage shows "My Impact" only. GET /publicMatrix returns counts
only. Blocked until Chucks provides aggregate endpoint + models.

---

❌ Missing — Important

Feature: Remove Location Pill + Debug Block (Dashboard)
Notes: Team agreed to remove. One-line delete in HomeScreen.tsx.
Deferred — no functional impact on demo.

---

🔧 Backend gaps

- POST /submitCH004 stepID=step1 — Step 1 Composting Sprint
- POST /submitCH004 stepID=step3 — mark complete, sets completed=true
- PUT /users/:id — panic("unimplemented")
- PUT /circles/:id — panic("unimplemented")
- PUT /evidences/:id — frontend wired + placeholder ready; backend building
- Global impact aggregate endpoint
- Password reset — no endpoint; can delegate to Supabase built-in

---

📋 Remaining sequence for pilot

1. Remove location pill — 5-min cleanup, no risk
2. Step 1 + Step 3 wire-up — unblocks full composting flow
3. Password recovery — Supabase reset + /reset-password callback page
4. Edit Challenge — backend exists, frontend only
5. Edit Profile + Circle — gated on backend (panic unimplemented)
6. Global impact toggle — gated on Chucks' aggregate endpoint
