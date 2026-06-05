export type CircleMember = {
  id: number;
  rank: number;
  name: string;
  joinDate: string;
  locked?: boolean;
};

export type CircleChallenge = {
  id: string;
  rank: number;
  name: string;
  joinedDate: string;
  progress: number;
  locked?: boolean;
};

export type CircleStat = { label: string; value: string };

export type Circle = {
  id: string;
  name: string;
  since: string;
  location: { city: string; region: string };
  description: string;
  lead: { name: string; role: string };
  totalGuardians: number;
  activeChallenges: number;
  members: CircleMember[];
  impactStats: CircleStat[];
  challenges: CircleChallenge[];
};

export const circles: Circle[] = [
  {
    id: "1",
    name: "Green Urban Youth",
    since: "12 March",
    location: { city: "Durban", region: "KwaZulu Natal" },
    description:
      "Green Urban Youth is a youth-led Circle for young Guardians who want to turn everyday care for their neighbourhood into visible environmental impact. Through urban greening, composting, clean-up, and observation challenges, members work together to restore shared spaces, submit proof of action, and grow their collective impact over time. This Circle is built for practical action, shared accountability, and greener streets, one challenge at a time.",
    lead: { name: "Mzi Tau", role: "Circle lead" },
    totalGuardians: 38,
    activeChallenges: 3,
    members: [
      { id: 1, rank: 1, name: "Jabu",     joinDate: "12 March 2026"    },
      { id: 2, rank: 2, name: "Xoliswa",  joinDate: "1 December 2026"  },
      { id: 3, rank: 3, name: "Thabang",  joinDate: "4 April 2026",  locked: true },
      { id: 4, rank: 3, name: "Xavier",   joinDate: "1 December 2026"  },
      { id: 5, rank: 3, name: "Roni",     joinDate: "24 February 2026" },
    ],
    impactStats: [
      { label: "My CO₂ Avoided",          value: "20kg"     },
      { label: "Circles CO₂ Avoided",     value: "1840kg"   },
      { label: "My Area Generated",       value: "750m²"    },
      { label: "Circle's Area Generated", value: "50 000m²" },
      { label: "My Waste Processed",      value: "32kg"     },
      { label: "Circle's Waste Processed",value: "525kg"    },
    ],
    challenges: [
      { id: "1", rank: 1, name: "Re-Greening", joinedDate: "12 March",    progress: 32 },
      { id: "2", rank: 2, name: "Park Watch",  joinedDate: "1 December",  progress: 14 },
      { id: "3", rank: 3, name: "Eco Homes",   joinedDate: "24 February", progress: 87, locked: true },
    ],
  },
];

export function getCircleById(id: string): Circle | undefined {
  return circles.find((c) => c.id === id);
}
