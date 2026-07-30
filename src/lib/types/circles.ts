import type {
  ChallengeSetupAnchorPoint,
  ChallengeSetupLocation,
} from "./challenges";

export type ApiActivityMediaFile = {
  type: string;
  url: string;
  description?: string;
};

export type ApiActivityData = {
  measurement?: {
    value: number;
    unitOfMeasure: string;
    siUnit?: string;
  };
  description?: string;
  location?: ChallengeSetupLocation;
  anchorPoint?: ChallengeSetupAnchorPoint;
  anchorPoints?: ChallengeSetupAnchorPoint[];
  mediaFiles?: ApiActivityMediaFile[];
  capturedAt?: string;
  weatherCondition?: string;
  fields?: Record<string, unknown>;
  // Dynamic-form submissions also merge captured fields into data under
  // their raw template field names
  [key: string]: unknown;
};

export type ApiRecentActivity = {
  id: string;
  circleId: string;
  challengeCode: string;
  activity?: string;
  thingId: string;
  thingUUID: string;
  submittedBy: string;
  contributors: string[];
  data: ApiActivityData;
  // Echo of the payload the FE submitted (data + volunteerHours +
  // contributors merged) — takes precedence over `data` when present, since
  // it's the more complete/up-to-date copy
  dataEnvelope?: ApiActivityData;
  stepId: string;
  stepNumber: number;
  status: {
    id: string;
    name: string;
    code: string;
    color: string;
    createdAt: string;
  };
  submittedAt: string;
  modifiedAt: string;
  locksOnCompletion: boolean;
  volunteerHours: {
    value: number;
    unitOfMeasure: string;
    siUnit: string;
  };
};

export type CreateCircleRequest = {
  name: string;
  description: string;
  createdBy: string;
  creatorAvatarUrl: string;
  communicationChannels: { name: string; url: string; icon: string }[];
  circleLeadId?: string;
  region: {
    placeId: string;
    city: string;
    suburb: string;
    province: string;
    country: string;
    countryCode: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
};

export type ApiImpactRecord = {
  id: string;
  impactRecordId: string;
  thingUUID: string;
  thingId: string;
  impactSummary: {
    contribution: {
      value: number;
      unitOfMeasure: string;
      displayName: string;
      description?: string;
      slug?: string;
    };
    impact: {
      value: number;
      unitOfMeasure: string;
      displayName: string;
      siUnit: string;
      shortSummary?: string;
      summary: string;
      description?: string;
      slug?: string;
    };
  };
  verifiedDate: string | null;
  verifiedBy: string | null;
  verified: boolean;
  impactType: string;
  validationTier: string | null;
  siUnit: string;
  createdAt: string;
  modifiedAt: string;
};

export type CircleCommunicationChannel = {
  name: string;
  url: string;
  icon: string;
};

export type CircleStatus = {
  id: string;
  name: string;
  code: string;
  color: string;
  createdAt: string;
};

export type ApiCircleChallengeMember = {
  userId: string;
  challengeId: string;
  joinedAt: string;
  role: string;
  permissions: string[];
  avatarUrl: string;
};

export type MembersCount = {
  total: number;
  label: string;
  displayValue: string;
};

export type ApiCircleChallenge = {
  id: string;
  challengeId: string;
  challengeCode: string;
  name: string;
  description: string;
  bannerUrl: string;
  circleId: string;
  membersCount: MembersCount | null;
  region: {
    city: string;
    suburb: string;
    province: string;
    country: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
    postalCode: string;
  };
  location: {
    city: string;
    suburb: string;
    province: string;
    country: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
    postalCode: string;
  };
  members: ApiCircleChallengeMember[] | null;
  facilitator: unknown | null;
  duration: unknown | null;
  equipments: unknown[];
  status: CircleStatus;
  templateId: string;
  activatedDate: string | null;
  completedDate: string | null;
  createdAt: string;
  modifiedAt: string;
  partner: unknown | null;
  createdBy: string;
  steps: number;
  currentStep: number;
  impactRecords: ApiImpactRecord[] | null;
  joinLink: string;
  communicationChannels: CircleCommunicationChannel[] | null;
  challengeSteps: Array<{
    stepNumber: number;
    stepType: string;
    stepId: string;
    title: string;
    description: string;
    // Human-readable step label (BE, 2026-07-22) — prefer over stepType
    activity?: string;
    isCompleted: boolean;
    form?: import("@/lib/types/challenges").ApiTemplateFormField[] | null;
    // True when this step's fields are per-registered-anchor-point data
    // entry (select a point from setup, then log against it) rather than a
    // one-off submission that merely reuses the "anchorPoint" field name
    // for BE payload shaping (e.g. CH-004's composting log)
    anchorPointTracking?: boolean;
    // BE core/models/template.go Step.Required / Step.CanComplete (added 2026-07-30)
    required?: boolean;
    canComplete?: boolean;
  }> | null;
  submittedSetupDetail?: import("@/lib/types/challenges").ApiSubmittedSetupDetail | null;
  template?: {
    SDGAlignments?: { code: string; name: string; infoUrl?: string }[] | null;
    impactDomains?: { code: string; name: string; infoUrl?: string }[] | null;
    targetSDG?: { code: string; name?: string; title?: string; infoUrl?: string } | null;
  } | null;
};

export type CircleMember = {
  circleId: string;
  userId: string;
  joinedAt: string;
  role: string;
  avatarUrl: string;
  permissions: string[];
};

export type ApiCircle = {
  id: string;
  circleId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  membersCount: MembersCount | null;
  region: {
    placeId: string;
    suburb: string;
    city: string;
    country: string;
    countryCode: string;
    province: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
    postalCode: string;
  };
  challenges: ApiCircleChallenge[];
  circleLead: null | unknown;
  members: CircleMember[];
  joinLink: string;
  createdBy: string;
  bannerUrl: string;
  communicationChannels: CircleCommunicationChannel[];
  status: CircleStatus;
  impactRecords: ApiImpactRecord[];
};

export type CreateCircleResponse = ApiCircle;

export type CirclesListResponse = ApiCircle[];
