# Guardians App — User Roles & What They Can Do

## Overview

The app has five user types. A single person can hold more than one role at the same time — for example, an admin who is also a circle lead and a facilitator of their own challenge.

---

### 1. Guest (not logged in)

A visitor who has not created an account or signed in.

**Can do:**
- Browse the Discover page — search challenges and circles
- View any Circle's public page
- View any Challenge's public page and its steps
- See impact records and recent activities

**Cannot do:**
- Join a circle or challenge
- Upload evidence or mark a step as complete
- Access their home feed, map, or profile
- Create or edit anything

---

### 2. Member (logged in, no special role)

A logged-in user who has not been assigned any leadership or facilitation role. This is the majority of users.

**Can do:**
- Everything a Guest can
- Join any Circle
- Join any Challenge
- View and edit their own profile (name, photo, location, language)
- See their home feed

**Cannot do:**
- Submit evidence or mark a step as complete
- Edit any circle or challenge
- Create circles or challenges

---

### 3. Facilitator

A user who has been assigned as the facilitator of one or more specific challenges.

**Can do:**
- Everything a Member can
- See a "Facilitator" badge on their profile and on their challenge pages
- Edit the challenges they facilitate
- Upload evidence on steps in their challenge
- Mark steps as complete in their challenge

**Cannot do:**
- Edit circles
- Create circles
- Create new challenges
- Edit or upload evidence on challenges they are not facilitating

---

### 4. Circle Lead

A user designated as the lead of one or more circles.

**Can do:**
- Everything a Member can
- See a "Circle Lead" badge on their profile and inside their circle
- Edit their circle(s)
- Create new challenges within their circle(s)
- Upload evidence and mark steps complete on any challenge inside their circle(s)

**Cannot do:**
- Create new circles (this is admin-only)
- Edit circles or challenges they do not lead

---

### 5. Admin

A superuser with full access across the entire platform.

**Can do:**
- Everything all roles above can do, across all circles and challenges
- See an "Admin" badge on their profile
- Create new circles
- Edit any circle
- Create challenges in any circle
- Edit any challenge
- Upload evidence and mark steps complete on any step, in any challenge

---

## Testing Scenarios

### Guest

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| G1 | Browse Discover without logging in | Open the Discover page | Page loads; Challenges and Circles tabs work; no login prompt |
| G2 | View a circle | Tap on any circle | Circle page loads fully; "Join Circle" button is visible but redirects to login when tapped |
| G3 | View a challenge | Tap on any challenge | Challenge page loads; "Join Challenge" button is visible but redirects to login when tapped |
| G4 | Try to access the home feed | Navigate to the home screen | Redirected to the login/onboarding screen |
| G5 | Try to access a profile | Navigate to the profile screen | Redirected to the login/onboarding screen |
| G6 | Try to log evidence | Navigate to a step's log screen | Redirected to the login/onboarding screen |

---

### Member

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| M1 | Sign in | Enter valid credentials | Lands on home screen; no role badges on profile |
| M2 | Join a circle | Open a circle → tap "Join Circle" | Button updates to confirm; user is added to the circle |
| M3 | Join a challenge | Open a challenge → tap "Join Challenge" | Button updates to confirm |
| M4 | Try to upload evidence | Open a step as a regular member | "Upload Evidence" and "Mark Complete" buttons are **not visible** |
| M5 | Edit profile | Go to Profile → Edit | Can update name, photo, location, and preferred language |
| M6 | No "Create Circle" option | Go to Discover → Circles tab | "Create Circle" button is **not visible** |
| M7 | No "Create Challenge" option | Go to Discover → Challenges tab | "Create Challenge" button is **not visible** |
| M8 | No edit option on circles | View any circle | Edit (pencil) icon is **not visible** |
| M9 | No edit option on challenges | View any challenge | Edit (pencil) icon is **not visible** |

---

### Facilitator

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| F1 | Facilitator badge on profile | Sign in as a facilitator → go to Profile | "Facilitator" badge is visible |
| F2 | Facilitator badge on challenge | Open the challenge they facilitate | "Facilitator" badge is shown |
| F3 | Edit their challenge | Open challenge → tap the edit (pencil) icon | Edit flow opens; can update name, description, banner image, and communication channels |
| F4 | Upload evidence | Open a step in their challenge → tap "Upload Evidence" | Button is visible; evidence form opens; can submit |
| F5 | Mark a step complete | Open a step → tap "Mark Complete" | Button is visible; step is marked as complete |
| F6 | Cannot edit other challenges | Open a challenge they are not facilitating | Edit (pencil) icon is **not visible** |
| F7 | Cannot create circles | Discover → Circles tab | "Create Circle" button is **not visible** |
| F8 | Cannot create challenges | Discover → Challenges tab | "Create Challenge" button is **not visible** |
| F9 | Cannot edit a circle | Open any circle | Edit (pencil) icon is **not visible** |

---

### Circle Lead

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| CL1 | Circle Lead badge on profile | Sign in as a circle lead → go to Profile | "Circle Lead" badge is visible |
| CL2 | Circle Lead badge inside their circle | Open the circle they lead | "Circle Lead" badge is shown |
| CL3 | Edit their circle | Open their circle → tap the edit (pencil) icon | Edit flow opens; can update name, description, banner, channels, and circle lead |
| CL4 | Create a challenge | Discover → Challenges tab → "Create Challenge" | Only their circle(s) are shown as options; can proceed through the creation flow |
| CL5 | One circle — no picker | Circle lead of exactly one circle → "Create Challenge" | Goes directly to challenge creation for that circle |
| CL6 | Multiple circles — picker shown | Circle lead of two or more circles → "Create Challenge" | A circle picker appears; must select which circle the challenge is for |
| CL7 | Upload evidence in their circle | Open a step in any challenge inside their circle | "Upload Evidence" and "Mark Complete" are visible and functional |
| CL8 | Cannot edit a circle they don't lead | Open a circle where they are only a member | Edit (pencil) icon is **not visible** |
| CL9 | Cannot create circles | Discover → Circles tab | "Create Circle" button is **not visible** |

---

### Admin

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| A1 | Admin badge on profile | Sign in with an admin account → go to Profile | "Admin" badge is visible |
| A2 | Create a circle | Discover → Circles tab → "Create Circle" | Button is visible; creation flow opens; circle is created |
| A3 | Edit any circle | Open any circle | Edit (pencil) icon is **always visible**; edit flow opens |
| A4 | Create a challenge in any circle | Discover → "Create Challenge" → circle picker | All circles are shown; can create a challenge for any of them |
| A5 | Edit any challenge | Open any challenge | Edit (pencil) icon is **always visible** |
| A6 | Upload evidence on any step | Open any step in any challenge | "Upload Evidence" and "Mark Complete" are always visible and functional |
| A7 | Assign a facilitator when creating a challenge | Challenge creation flow → Facilitator field | Can search and assign any user as facilitator |
| A8 | Assign a circle lead when creating a circle | Circle creation flow → Circle Lead field | Can search and assign any user as circle lead |

---

## Notes

- Anyone (including guests) can **view** circles, challenges, and their steps without signing in. Signing in is only required when taking an action such as joining, submitting evidence, or creating something.
- A user can hold multiple roles at the same time — for example, someone who is both a circle lead and the facilitator of a challenge inside their own circle.
