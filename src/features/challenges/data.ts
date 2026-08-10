export type Activity = {
  id: number;
  title: string;
  date: string;
  avatarCount: number;
};

export type Step = {
  id: string;
  rank: number;
  title: string;
  description: string;
  phase: string;
  locked?: boolean;
};

export type Challenge = {
  id: string;
  title: string;
  circle: string;
  since: string;
  location: { city: string; region: string };
  distance: string;
  description: string;
  progress: number;
  targetDate: string;
  timeLeft: string;
  facilitator: { name: string; role: string };
  members: { id: number; name: string }[];
  impactStats: { label: string; value: string }[];
  steps: Step[];
  activities: Activity[];
};

export const challenges: Challenge[] = [
  {
    id: "1",
    title: "Durban Green Clean",
    circle: "Urban Greening",
    since: "12 March",
    location: { city: "Durban", region: "KwaZulu Natal" },
    distance: "300m from you",
    description: `"Re-Greening is a challenge focused on environmentalists dedicated to closing the loop on waste in our neighborhood. We believe that street-level action is the only way to solve global problems. We turn our kitchen scraps into soil and our concrete corners into green lungs."`,
    progress: 60,
    targetDate: "27 September 2026",
    timeLeft: "1 week",
    facilitator: { name: "Mzi Tau", role: "Facilitator" },
    members: [
      { id: 1, name: "Jabu" },
      { id: 2, name: "Xoliswa" },
      { id: 3, name: "Thabang" },
      { id: 4, name: "Mpho" },
      { id: 5, name: "Roni" },
    ],
    impactStats: [
      { label: "My CO₂ Avoided",          value: "20kg"      },
      { label: "Circles CO₂ Avoided",     value: "1840kg"    },
      { label: "My Area Generated",       value: "750m²"     },
      { label: "Circle's Area Generated", value: "50 000m²"  },
      { label: "My Waste Processed",      value: "32kg"      },
      { label: "Circle's Waste Processed",value: "525kg"     },
    ],
    steps: [
      {
        id: "1",
        rank: 1,
        title: "Establish Compost Site",
        description: "Choose a semi-shaded, well-drained ground spot in your garden or community space. Set up your compost bin or designate a compost pit (approx. 1m x 1m).",
        phase: "Phase 1",
      },
      {
        id: "2",
        rank: 2,
        title: "Log Organic Waste",
        description: "This is a logging step which consists of logging your organic waste contributions.",
        phase: "Phase 1",
      },
      {
        id: "3",
        rank: 3,
        title: "Manage Moisture",
        description: "Maintenance step which includes several moisture management actions.",
        phase: "Phase 2",
        locked: true,
      },
      {
        id: "4",
        rank: 4,
        title: "Harvest & Consolidate",
        description: "Closure Step",
        phase: "Phase 3",
      },
    ],
    activities: [
      { id: 1, title: "10kg Composted", date: "12 March 2026", avatarCount: 2 },
      { id: 2, title: "5kg Composted",  date: "12 Fev 2026",   avatarCount: 1 },
    ],
  },
];

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}

export function getStepById(challengeId: string, stepId: string): Step | undefined {
  return getChallengeById(challengeId)?.steps.find((s) => s.id === stepId);
}
