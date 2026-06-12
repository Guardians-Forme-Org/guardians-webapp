export type ApiTemplateStep = {
  stepId: string;
  stepNumber: number;
  stepType: string;
  title: string;
  description: string;
};

export type ApiTemplateEquipment = {
  name: string;
  description: string;
};

export type ApiTemplate = {
  templateId: string;
  name: string;
  description: string;
  targetSDG: {
    code: string;
    title: string;
  };
  steps: ApiTemplateStep[];
  equipments: ApiTemplateEquipment[];
  minCompletedCycles: number;
  maxCompletedCycles: number;
  library: unknown[];
  createdAt: string;
};

export type TemplatesListResponse = ApiTemplate[];

// ── Challenge creation ─────────────────────────────────────────────────────────

export type ChallengeLocation = {
  placeId: string;
  address: string;
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

export type CreateChallengeRequest = {
  name: string;
  description: string;
  circleId: string;
  templateId: string;
  challengeCode: string;
  createdBy: string;
  equipments: unknown[];
  location: ChallengeLocation | null;
  region: ChallengeLocation | null;
};

export type ApiChallenge = {
  id: string;
  challengeId: string;
  name: string;
  templateId: string;
  circleId: string;
  status: string;
  createdAt: string;
};
