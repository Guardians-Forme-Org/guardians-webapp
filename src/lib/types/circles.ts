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
    };
    impact: {
      value: number;
      unitOfMeasure: string;
      displayName: string;
      siUnit: string;
      summary: string;
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
  }> | null;
  template?: {
    targetSDG?: { code: string; title: string; infoUrl?: string } | null;
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
