Guardians — Frontend Demo Status 3 · June 23, 2026

---

Delta from v2 (earlier June 23): 1 feature fully closed (Global Impact Toggle). 3 features
moved from missing → partial (all three edit flows — frontend complete, backend pending).
Impact display polish, role badges, and circle impact section shipped as part of edit work.
Counts: 18 done · 3 partial · 3 missing · 0 blocked

---

✅ Done

┌──────────────────────────────┬──────────────────────────────────────────────────────────┐
│ Feature │ Notes │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Auth — Signup Wizard │ 4-step wizard. Photo step has "Skip for now" — │
│ │ users can register without uploading an avatar. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Auth — Login │ Email + password via POST /login. AuthContext manages │
│ │ session state. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Token Refresh / │ Expired token silently refreshed at boot via │
│ Persistent Sessions │ POST /api/v1/token (refresh_token grant). Proactive │
│ │ refresh fires every 15 min. │
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
│ │ resubmit to PUT /evidences/:id. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Challenge Detail Screen │ Step completion indicator (green border + checkmark), │
│ │ "Join Conversation" gated to members, role badge on │
│ │ header, activity rows clickable → evidence view mode. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Circle Detail Screen │ Same gaps resolved as challenge. Impact records section │
│ │ added (2-col grid, between Stats and Recent Activities). │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Profile Page │ Identity, impact stats, activity trace, settings. │
│ │ Pencil icon + "Account Details" row both navigate to │
│ │ /profile/edit. Global role badge shown. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Discover Page │ Connected to real API via useChallenges() + api.get │
│ │ ("/circles"). Dead mock route deleted. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Invite Link Sharing + │ Invite uses window.location.origin. RecentActivitiesList │
│ Recent Activities │ on profile, challenge, and circle screens. Activity rows │
│ │ tappable (authenticated users only). │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Role Badge System │ Three contexts: Global (profile), Circle-scoped (circle │
│ │ screen), Challenge-scoped (challenge screen + step │
│ │ screen). Roles: Admin · Circle Lead · Facilitator. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Activity Detail View Mode │ Tapping a feed item navigates to the log wizard at the │
│ │ review step, pre-populated from the activity record. │
│ │ Members see read-only. Facilitator+ see edit icons. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Permission Enforcement │ Evidence editing role-gated: facilitator of the │
│ (Evidence) │ challenge OR circle lead OR admin. Members: no edit │
│ │ icons. Facilitator+: pencil icons → PUT /evidences/:id. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Guest / Public Access │ Route guard implemented. Discover, Circle, Challenge │
│ │ pages readable without login. Join actions prompt auth │
│ │ redirect with return URL. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Profile Photo Skip │ "Skip for now" on step 3 of signup. No avatar = valid │
│ (Onboarding) │ submit. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Global Impact Toggle │ NEW. Homepage ImpactSection redesigned with Mine / │
│ │ Global pill toggle. GET /publicMatrix typed correctly │
│ │ ({ impactMatrix, thingsMatrix }). ImpactGrid (3-col), │
│ │ MadeByRow, defaults to Global when data exists. │
│ │ deriveImpactLabel + formatImpactDisplayValue extracted │
│ │ to utils.ts and applied across home, challenge, and │
│ │ circle impact sections. "hrs" → "hours" everywhere. │
└──────────────────────────────┴──────────────────────────────────────────────────────────┘

---

⚠️ Partial — Frontend complete, backend pending

┌──────────────────────────────┬──────────────────────────────────────────────────────────┐
│ Feature │ Status │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Edit — Challenge │ Frontend complete. CreateChallengeWizard accepts │
│ │ editChallenge prop; pre-populates all fields; starts │
│ │ at step 3 (skips template/preview); region not editable; │
│ │ Save Changes → PUT /challenges/:id. Pencil icon in │
│ │ ChallengeScreen (facilitator / circle lead / admin only). │
│ │ Route: /challenges/[id]/edit. │
│ │ Backend: PUT /challenges/:id returns 400 — panic stub. │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Edit — Circle │ Frontend complete. CreateCircleWizard accepts editCircle │
│ │ prop; pre-populates all fields; skips step 2 (location │
│ │ not editable) in both directions; Save Changes → │
│ │ PUT /circles/:id. Pencil icon in CircleScreen │
│ │ (creator / circle lead / admin only). │
│ │ Route: /circles/[id]/edit. │
│ │ Backend: PUT /circles/:id is panic("unimplemented"). │
├──────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Edit — Profile │ Frontend complete. Flat form at /profile/edit: avatar │
│ │ upload (resolves from member records if no meta.avatarUrl)│
│ │ + firstName + lastName + mobile + email (read-only) → │
│ │ PUT /users/:id. Pencil icon next to name on profile page; │
│ │ "Account Details" row navigates to edit page. │
│ │ Change Password: not yet wired — pending decision on │
│ │ Supabase client install (see below). │
│ │ Backend: PUT /users/:id is panic("unimplemented"). │
└──────────────────────────────┴──────────────────────────────────────────────────────────┘

---

❌ Missing — Critical (blocks pilot)

Feature: Step 1 Wire-up (Composting Sprint)
Notes: Frontend component done. Needs POST /submitCH004 with stepID=step1.
Backend must also handle stepID=step3 to set completed=true on mark-complete.
Blocked on backend.
────────────────────────────────────────
Feature: Password Reset + Change Password
Notes: Neither side exists. These share the same prerequisite and should be
built together:

- Install @supabase/supabase-js on the frontend.
- Forgot password (unauthenticated): supabase.auth.resetPasswordForEmail(email)
  → email link → /reset-password callback page → supabase.auth.updateUser({ password }).
- Change password (authenticated, from /profile/edit): supabase.auth.updateUser({ password })
  directly — no current password needed when session is valid.
  No backend endpoint needed; Supabase handles both flows.

---

❌ Missing — Important

Feature: Remove Location Pill (Dashboard)
Notes: Team agreed to remove. One-line delete in HomeScreen.tsx. Deferred — no
functional impact on demo.

---

🔧 Backend gaps

- POST /submitCH004 stepID=step1 — Step 1 Composting Sprint
- POST /submitCH004 stepID=step3 — mark step complete (sets completed=true)

- PUT /users/:id — blocks Edit Profile save
- PUT /circles/:id — blocks Edit Circle save
- PUT /challenges/:id — blocks Edit Challenge save
- PUT /evidences/:id — frontend wired; backend building

- Password reset/change — no endpoint;
- refreshToken endpoint

- favicon images
- send guest to onboarding

---

📋 Remaining sequence for pilot

1. Password Reset + Change Password — install Supabase client, build /reset-password
   callback + in-app change password; closes two items at once, no backend needed
2. Step 1 + Step 3 wire-up — unblocks full Composting Sprint flow; backend must ship first
3. Remove location pill — 5-min cleanup, zero risk, can be done any time
4. Backend: PUT /challenges/:id, PUT /circles/:id, PUT /users/:id — unblocks all three
   edit flows simultaneously once implemented
