import type {
  ChallengeCategory,
  ChallengeLocation,
  ChallengeRegion,
  ChallengeStatus,
  ValidationTier,
} from "@/types";

export type ChallengeDomain =
  | "mitigation"
  | "resilience"
  | "democratic_infrastructure"
  | "regeneration";

export type ChallengeTimeCommitment =
  | "half_day"
  | "full_day"
  | "multi_day"
  | "multi_week"
  | "ongoing";

export type ChallengeTeamSize =
  | "individual"
  | "small"
  | "circle"
  | "large";

export type ChallengeSetting = "indoor" | "outdoor" | "both";

export type ChallengeSeason =
  | "year_round"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";

export type ChallengeResourceLevel = "low" | "medium" | "high";

export type ChallengeTags = {
  domain: ChallengeDomain[];
  time: ChallengeTimeCommitment;
  team: ChallengeTeamSize;
  setting: ChallengeSetting;
  season: ChallengeSeason;
  resources: ChallengeResourceLevel;
  validation: "L1" | "L2" | "L3";
};

export type MetricDefinition = {
  id: string;
  label: string;
  unit: string;
  required: boolean;
};

export type TaggedChallenge = {
  id: string;
  title: string;
  description: string;
  guardian_id: string;
  circle_id: string | null;
  region: ChallengeRegion;
  location: ChallengeLocation;
  status: ChallengeStatus;
  category: ChallengeCategory;
  tags?: ChallengeTags;
  validation_tier: ValidationTier;
  metric_definitions?: MetricDefinition[];
  completed_date: string | null;
  created_at: string;
  modified_at: string;
};

export type ActiveFilters = {
  domains: ChallengeDomain[];
  time: ChallengeTimeCommitment[];
  team: ChallengeTeamSize[];
  validation: ("L1" | "L2" | "L3")[];
};

export const emptyFilters: ActiveFilters = {
  domains: [],
  time: [],
  team: [],
  validation: [],
};

export type FinderAnswers = {
  domain: ChallengeDomain | null;
  time: ChallengeTimeCommitment | null;
  team: ChallengeTeamSize | null;
};
