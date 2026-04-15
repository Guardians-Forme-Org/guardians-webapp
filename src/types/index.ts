export type ValidationTier = {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  code: "SELF_DECLARED" | "EVIDENCE_BASED" | "PEER_REVIEWED";
};

export type Circle = {
  id: string;
  name: string;
  guardian_id: string;
  description: string;
  member_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ChallengeStatus = {
  id: string;
  name: string;
  code: string;
};

export type ChallengeCategory = {
  id: string;
  name: string;
  code: string;
};

export type ChallengeLocation = {
  id?: string;
  latitude: number;
  longitude: number;
  address?: string;
  what3words?: string;
};

export type ChallengeRegion = {
  id?: string;
  suburb: string;
  city: string;
};

export type Challenge = {
  id: string;
  title: string;
  guardian_id: string;
  circle_id: string | null;
  description: string;
  region: ChallengeRegion;
  location: ChallengeLocation;
  status: ChallengeStatus;
  category: ChallengeCategory;
  completed_date: string | null;
  created_at: string;
  modified_at: string;
  validation_tier: ValidationTier;
};

export type Report = {
  id: string;
  challenge_id: string;
  challenge_title?: string;
  circle_id: string;
  guardian_id: string;
  validation_tier: ValidationTier;
  description: string;
  quantity: number;
  evidence_url?: string;
  verifier_id?: string;
  status: string;
  submitted_at: string;
};

export type User = {
  id: string;
  full_name: string;
  city: string;
  language: string;
};

export type NewCirclePayload = {
  name: string;
  description: string;
};

export type NewReportPayload = {
  challenge_id: string;
  challenge_title?: string;
  description: string;
  quantity: number;
  evidence_url?: string;
  verifier_id?: string;
};

export type AdminReport = {
  id: string;
  circle_name: string;
  challenge_title: string;
  submitted_at: string;
  evidence_url: string;
  status: string;
};
