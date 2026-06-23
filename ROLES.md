# Guardians App — User Roles & Testing Scenarios

## Role Overview

The app has four user types. Roles are not exclusive — a single user can hold multiple (e.g. an admin who is also a circle lead). Roles are computed at runtime from the user's email and their membership data.

---

### 1. Guest (unauthenticated)

A visitor who has not logged in.

**Can do:**
- Browse the Discover page (challenges + circles tabs, search)
- View any Circle detail page
- View any Challenge detail page and its steps
- See impact records and recent activities

**Cannot do:**
- Join a circle or challenge (redirected to login)
- Upload evidence or mark a step complete
- Access their profile, home feed, or map
- Access any create/edit flows

---

### 2. Member (authenticated, no elevated role)

A logged-in user with no special assignment. The majority of users.

**Can do:**
- Everything a Guest can
- Join any Circle (one-tap from the Circle detail page)
- Join any Challenge (one-tap from the Challenge detail page)
- View their own profile with impact stats and joined circles/challenges
- Edit their profile (name, avatar, location, language)
- See the bottom nav bar and home feed

**Cannot do:**
- Submit evidence or mark a step complete (Upload Evidence / Mark Complete buttons are hidden)
- Edit any circle or challenge
- Create circles or challenges

---

### 3. Facilitator (`CHALLENGE_FACILITATOR` member role on a challenge)

A user assigned as the facilitator of one or more specific challenges. Assigned during challenge creation via the `facilitatorId` field.

**Can do:**
- Everything a Member can
- See a "Facilitator" badge on their profile and on the challenge/step screens
- Edit their assigned challenge (pencil icon on the challenge detail page)
- Upload evidence and mark steps complete on their challenge's steps
- View step log forms (Upload Evidence / Mark Complete buttons are visible)

**Cannot do:**
- Edit circles
- Create circles
- Create new challenges
- Edit challenges they are not the facilitator of

---

### 4. Circle Lead (`circleLead` on a specific circle)

A user designated as the lead of one or more circles. Set via the `circleLeadId` field when a circle is created or edited.

**Can do:**
- Everything a Member can
- See a "Circle Lead" badge on their profile and inside their circle
- Edit their circle(s) (pencil icon on the circle detail page)
- Create new challenges within their circle(s) — "Create Challenge" CTA appears on Discover
- Upload evidence and mark steps complete on any step inside their circle's challenges

**Cannot do:**
- Create new circles (circles tab "Create Circle" button is admin-only)
- Edit circles or challenges they don't lead
- Create challenges for circles they don't lead

---

### 5. Admin (whitelisted email in `permissions.ts`)

A superuser identified by their email address being in the `WHITELISTED_EMAILS` list. Currently: `tnemalili@gmail.com`, `abel.siminya@gmail.com`, `nhlanhla@alignd.co.za`.

**Can do:**
- Everything all roles above can do, across all circles and challenges
- See an "Admin" badge on their profile and anywhere role badges are shown
- Create new circles ("Create Circle" button visible on Discover > Circles tab)
- Edit any circle (pencil icon visible on all circles)
- Create challenges in any circle
- Edit any challenge (pencil icon visible on all challenges)
- Upload evidence and mark steps complete on any step, in any challenge

---

## Testing Scenarios

### Guest

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| G1 | Browse discover without login | Open `/discover` without a session | Page loads; Challenges and Circles tabs work; no login prompt |
| G2 | View a circle detail | Navigate to `/circles/<id>` | Circle loads fully; "Join Circle" button visible but triggers login redirect on tap |
| G3 | View a challenge detail | Navigate to `/challenges/<id>` | Challenge loads; "Join Challenge" button visible but triggers login redirect on tap |
| G4 | Access home page without login | Navigate to `/home` | Redirected to `/` (onboarding/login) |
| G5 | Access profile without login | Navigate to `/profile` | Redirected to `/` |
| G6 | Log evidence without login | Navigate to `/challenges/<id>/steps/<stepId>/log` | Redirected to `/` |

---

### Member

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| M1 | Login | Enter valid credentials | Lands on home screen; bottom nav visible; no role badges on profile |
| M2 | Join a circle | Open a circle detail → tap "Join Circle" | Button changes to "Circle joined"; member added to circle |
| M3 | Join a challenge | Open a challenge → tap "Join Challenge" | Button changes to "Joined" |
| M4 | Attempt to upload evidence | Open a step page as a non-facilitator, non-lead member | "Upload Evidence" and "Mark Complete" buttons are **not visible** |
| M5 | Edit profile | Go to Profile → Edit | Can update name, avatar, location, preferred language |
| M6 | No "Create Circle" button | Go to Discover → Circles tab | "Create Circle" button is **not visible** |
| M7 | No "Create Challenge" button | Go to Discover → Challenges tab | "Create Challenge" button is **not visible** |
| M8 | No edit pencil on circles | View any circle | Pencil icon is **not visible** |
| M9 | No edit pencil on challenges | View any challenge | Pencil icon is **not visible** |

---

### Facilitator

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| F1 | Facilitator badge on profile | Login as facilitator → go to Profile | "Facilitator" badge visible |
| F2 | Facilitator badge on challenge | Open the challenge they facilitate | "Facilitator" badge shown next to their name or in the header |
| F3 | Edit assigned challenge | Open challenge → tap pencil icon | Edit wizard opens; can update name, description, banner, channels |
| F4 | Upload evidence on their step | Open a step in their challenge → "Upload Evidence" | Button visible; wizard launches; can submit evidence |
| F5 | Mark step complete | Open a step → "Mark Complete" | Button visible; step marked complete |
| F6 | Cannot edit other challenges | Open a challenge they are NOT facilitating | Pencil icon is **not visible** |
| F7 | Cannot create circles | Discover → Circles tab | "Create Circle" button **not visible** |
| F8 | Cannot create challenges | Discover → Challenges tab | "Create Challenge" button **not visible** |
| F9 | Cannot edit a circle | Open any circle | Pencil icon **not visible** (unless also a circle lead) |

---

### Circle Lead

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| CL1 | Circle Lead badge on profile | Login as circle lead → go to Profile | "Circle Lead" badge visible |
| CL2 | Circle Lead badge inside circle | Open the circle they lead | "Circle Lead" badge shown |
| CL3 | Edit their circle | Open their circle → tap pencil | Edit wizard opens; can update name, description, banner, channels, lead |
| CL4 | Create a challenge | Discover → Challenges tab → "Create Challenge" | Picker shows only their circle(s); can proceed through wizard |
| CL5 | Single circle — no picker | Circle lead of exactly one circle → "Create Challenge" | Navigates directly to `/challenges/create?circleId=<id>` (no picker) |
| CL6 | Multi circle — picker shown | Circle lead of 2+ circles → "Create Challenge" | Circle picker modal appears; must select which circle |
| CL7 | Upload evidence in their circle | Open a step in their circle's challenge | "Upload Evidence" and "Mark Complete" visible and functional |
| CL8 | Cannot edit a circle they don't lead | Open a circle where they are only a member | Pencil icon **not visible** |
| CL9 | Cannot create circles | Discover → Circles tab | "Create Circle" button **not visible** |

---

### Admin

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| A1 | Admin badge on profile | Login with whitelisted email → Profile | "Admin" badge visible |
| A2 | Create a circle | Discover → Circles tab → "Create Circle" | "Create Circle" button visible; wizard opens; circle created |
| A3 | Edit any circle | Open any circle | Pencil icon **always visible**; edit wizard opens |
| A4 | Create a challenge in any circle | Discover → "Create Challenge" → circle picker | All circles visible in picker; can create for any |
| A5 | Edit any challenge | Open any challenge | Pencil icon **always visible** |
| A6 | Upload evidence on any step | Open any step in any challenge | "Upload Evidence" and "Mark Complete" visible and functional |
| A7 | Assign a facilitator during challenge creation | Create Challenge wizard → Facilitator field | Can search and assign any user as facilitator |
| A8 | Assign a circle lead during circle creation | Create Circle wizard → Circle Lead field | Can search and assign any user as circle lead |

---

## Notes

- **Public routes** (no login required to *view*): `/discover`, `/circles/<id>`, `/challenges/<id>` and its step pages. Login is required only when taking an action (join, submit evidence).
- **`canManageCircle`** covers three cases: whitelisted email, circle creator (`createdBy`), or the designated `circleLead`. All three get the same edit + evidence-submission rights.
- A user can hold multiple roles simultaneously (e.g. an admin who is also the circle lead and facilitator of their own challenge).
- The Trello export (`trello_export.json`) was saved as a rendered HTML shell and does not contain readable board data — it requires an authenticated Trello session to render cards.
