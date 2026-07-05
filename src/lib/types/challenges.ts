export type ApiTemplateFormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "NUMERIC"
  | "DATE"
  | "IMAGE"
  | "LOCATION"
  | "LOCATION_LIST"
  | "TOGGLE"
  | "BOOLEAN"
  | "SELECT"
  | "MULTISELECT"
  | "GROUP";

export type ApiTemplateFormField = {
  name: string;
  label: string;
  type: ApiTemplateFormFieldType;
  required: boolean;
  displayOrder: number;
  options?: { value: string; label: string }[];
  unitOfMeasureOptions?: { value: string; label: string }[];
  // User can append multiple entries for this field — the value becomes an
  // array of whatever the base input type produces (strings, objects, …)
  addableInput?: boolean;
  // GROUP only: the sub-form rendered for each entry
  fields?: ApiTemplateFormField[];
};

export type ApiTemplateStep = {
  stepId: string;
  stepNumber: number;
  stepType: string;
  title: string;
  description: string;
  isCompleted?: boolean;
  form?: ApiTemplateFormField[];
};

export type ApiTemplateEquipment = {
  name: string;
  description: string;
};

export type ApiSdgAlignment = {
  code: string;
  name: string;
  infoUrl: string;
};

export type ApiImpactDomain = {
  code: string;
  name: string;
  infoUrl: string;
};

export type ApiTemplate = {
  templateId: string;
  name: string;
  description: string;
  SDGAlignments: ApiSdgAlignment[];
  impactDomains: ApiImpactDomain[];
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
  facilitatorId: string;
  equipments: unknown[];
  communicationChannels: { name: string; url: string; icon: string }[];
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
  joinLink?: string;
};
