Guardians — Frontend Demo Status · June 22, 2026

---

Counts: 9 done · 3 partial · 11 missing · 2 blocked

---

✅ Done

┌────────────────┬───────────────────────────────────────────┐
│ Feature │ Notes │
├────────────────┼───────────────────────────────────────────┤
│ Auth — Signup │ 4-step wizard: credentials → profile → │
│ Wizard │ photo → success. Supabase auth │
│ │ integrated. │
├────────────────┼───────────────────────────────────────────┤
│ Auth — Login │ Email + password via POST /token. │
│ │ AuthContext manages session. │
├────────────────┼───────────────────────────────────────────┤
│ Home / │ Search, location pill, impact badges, │
│ Dashboard │ challenge carousel, circles list. │
├────────────────┼───────────────────────────────────────────┤
│ Challenge │ │
│ Creation │ 7-step wizard. POST /createchallenge │
│ Wizard │ │
├────────────────┼───────────────────────────────────────────┤
│ Circle │ 5-step wizard with region picker, image │
│ Creation │ upload. POST /createcircle │
│ Wizard │ │
├────────────────┼───────────────────────────────────────────┤
│ │ Config-driven via stepFormConfig.ts. │
│ Log Evidence │ Draft persistence, file upload, │
│ Wizard │ measurement, volunteer hours. Steps 2 & 3 │
│ │ connected to backend. │
├────────────────┼───────────────────────────────────────────┤
│ Profile Page │ Identity, impact stats, activity trace, │
│ │ settings sheet. │
├────────────────┼───────────────────────────────────────────┤
│ │ Fully connected to real API via │
│ Discover Page │ useChallenges() + api.get("/circles"). A │
│ │ dead /challenges route with hardcoded │
│ │ mock data was found and deleted. │
├────────────────┼───────────────────────────────────────────┤
│ Invite Link │ Invite uses window.location.origin. │
│ Sharing + │ RecentActivitiesList integrated in │
│ Recent │ profile, challenge, and circle screens. │
│ Activities │ │
└────────────────┴───────────────────────────────────────────┘

---

⚠️ Partial

┌───────────────┬────────────────────────────────────────────┐
│ Feature │ What's Missing │
├───────────────┼────────────────────────────────────────────┤
│ Challenge │ Step completion indicator, "Join │
│ Detail Screen │ Conversation" visibility logic, activity │
│ │ detail expansion, role badge. │
├───────────────┼────────────────────────────────────────────┤
│ Circle Detail │ Same gaps as challenge detail. Layout │
│ Screen │ partially complete. │
├───────────────┼────────────────────────────────────────────┤

---

❌ Missing — Critical (blocks pilot)

Feature: Step 1 wire-up (Composting Sprint)
Notes: Frontend component done. Needs to call POST /submitCH004
with stepID=step1.
────────────────────────────────────────
Feature: Password Recovery
Notes: Nothing on either side. Supabase has built-in email reset
—
fastest path is supabase.auth.resetPasswordForEmail() + a
reset-password callback page.
────────────────────────────────────────
Feature: Guest / Public Access
Notes: No route guards exist. Discover, Circle, Challenge pages
must be readable without login; auth prompt only on join.
────────────────────────────────────────
Feature: Edit — Profile
Notes: UI not built. Backend PUT /users/:id is
panic("unimplemented").
────────────────────────────────────────
Feature: Edit — Circle
Notes: UI not built. Backend PUT /circles/:id is
panic("unimplemented").
────────────────────────────────────────
Feature: Edit — Challenge
Notes: UI not built. Backend PUT /challenges/:id exists and
accepts a JSON map — may already work.
────────────────────────────────────────
Feature: Global Impact Toggle
Notes: Homepage shows "My Impact" only. GET /publicMatrix returns
counts only.

---

❌ Missing — Important (contractual / quality)

┌─────────────────────┬──────────────────────────────────────┐
│ Feature │ Notes │
├─────────────────────┼──────────────────────────────────────┤
│ │ No tick/green highlight on completed │
│ Step Completion │ steps. Backend has a boolean │
│ Indicator │ completed flag per step — frontend │
│ │ just needs to read and render it. │
├─────────────────────┼──────────────────────────────────────┤
│ "Join Conversation" │ Button always visible. Must be gated │
│ Visibility │ to challenge/circle members only. │
├─────────────────────┼──────────────────────────────────────┤
│ Activity Detail │ Feed items not expandable. GET │
│ Expansion │ /evidences/:id exists to load detail │
│ │ on click. │
├─────────────────────┼──────────────────────────────────────┤
│ Remove Location │ │
│ Dropdown from │ Team agreed to remove it. │
│ Dashboard │ │ │
├─────────────────────┼──────────────────────────────────────┤
│ Profile Photo Skip │ No skip option on the avatar step; │
│ (Onboarding) │ users should be able to upload │
│ │ later. │
├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Role Badge on │ No visual indicator of user's role (facilitator, member, lead). │
│ Challenge/Circle │ Ndina/Abel to design. │
├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Permission Enforcement │ Only facilitators/business users can submit/delete/edit │
│ (Evidence) │ evidence. Role-based UI gating not implemented. │
└──────────────────────────┴──────────────────────────────────────────────────────────────────┘

---

🔧 Backend gaps (block frontend)

- Needs to call POST /submitCH004 with stepID=step1.
- Needs to call POST /submitCH004 with stepID=step3. mark as complete, changes complete boolean to true.
- PUT /users/:id — panic("unimplemented")
- PUT /circles/:id — panic("unimplemented")
- Global impact endpoint;
- Password reset — no endpoint; can delegate to Supabase built-in

---

📋 Suggested sequence for final sprint

1. Wire Step 1 endpoint — unblocks full composting flow for Monday demo
2. Guest / public access — route guard allowing unauthenticated reads on Discover, Circle,
   Challenge
3. Password recovery — Supabase email reset + callback page
4. Profile photo skip — add skip button to onboarding step 3
5. Step completion indicator — read existing completed flag, render tick/green
6. Remove location dropdown from dashboard
7. "Join Conversation" visibility — member check gate
8. Activity detail expansion — click-to-expand using GET /evidences/:id
9. Edit flows
10. Global impact toggle — unblocked only after Chucks provides aggregate endpoint + models
11. Role badge + permission enforcement
