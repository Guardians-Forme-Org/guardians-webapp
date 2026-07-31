export type ApiTemplateFormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "NUMERIC"
  | "DATE"
  | "TIME"
  | "IMAGE"
  | "FILE"
  | "LOCATION"
  | "LOCATION_LIST"
  | "TOGGLE"
  | "BOOLEAN"
  | "SELECT"
  | "MULTISELECT"
  | "GROUP"
  | "ITEM"; //Same as GROUP

export type ApiTemplateFormField = {
  name: string;
  label: string;
  placeholder?: string;
  type: ApiTemplateFormFieldType;
  required: boolean;
  displayOrder: number;
  options?: { value: string; label: string }[];
  unitOfMeasureOptions?: { value: string; label: string }[];
  // User can append multiple entries for this field — the value becomes an
  // array of whatever the base input type produces (strings, objects, …)
  addableInput?: boolean;
  // GROUP/ITEM only: the sub-form rendered for each entry
  fields?: ApiTemplateFormField[];
  // BE sometimes ships the anchor-point reference wrapped under this key
  // instead of as a properly-typed field (CH-001/CH-008A/CH-004 EXECUTION
  // steps) — see deriveWizardConfig's wrapper normalization
  anchorPoint?: {
    name?: string;
    label?: string;
    fields?: ApiTemplateFormField[];
  };
};

export type ApiTemplateStep = {
  stepId: string;
  stepNumber: number;
  stepType: string;
  title: string;
  description: string;
  // Human-readable step label (BE, 2026-07-22) — prefer over stepType
  activity?: string;
  isCompleted?: boolean;
  form?: ApiTemplateFormField[];
  // See ApiCircleChallenge.challengeSteps[].anchorPointTracking
  anchorPointTracking?: boolean;
  // BE core/models/template.go Step.Required / Step.CanComplete (added 2026-07-30)
  required?: boolean;
  canComplete?: boolean;
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

// ── Setup submissions (/challengeSetup) ────────────────────────────────────────

export type ChallengeSetupLocation = {
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

export type ChallengeSetupAnchorPoint = {
  name: string;
  location?: ChallengeSetupLocation;
  higherRiskFlag?: boolean;
  measurement?: { value: number; unitOfMeasure: string };
};

// Attached to the challenge by the BE after a successful setup-step
// submission; later steps re-measure the registered entries
export type ApiSubmittedSetupDetail = {
  id: string;
  circleId: string;
  challengeCode: string;
  thingId: string;
  thingUUID: string;
  submittedBy: string;
  contributors: string[] | null;
  stepId: string;
  stepNumber: number;
  submittedAt: string;
  modifiedAt: string;
  locksOnCompletion: boolean;
  volunteerHours?: { value: number; unitOfMeasure: string; siUnit: string };
  data: {
    anchorPoints?: ChallengeSetupAnchorPoint[] | null;
    location?: ChallengeSetupLocation;
    mediaFiles?: { type: string; url: string; description: string }[];
    volunteerHours?: { value: number; unitOfMeasure: string; siUnit: string };
  };
};

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
