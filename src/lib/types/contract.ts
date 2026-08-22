export interface Submission {
  id: string;
  circleId: string;
  challengeCode: string;
  thingId: string;
  thingUUID: string;
  activity: string;
  submittedBy: string;
  reviewedBy?: string[];
  dataEnvelope: DataEnvelope | null;
  data: DataEnvelope | null;
  stepId: string;
  stepNumber: number;
  stepType: string;
  status: Status | null;
  submittedAt: string; // ISO 8601
  modifiedAt: string; // ISO 8601
  completionDate?: string; // ISO 8601
  locksOnCompletion: boolean;
  approvalRequired?: boolean;
  comments?: Comment[];
  contributors?: string[];
  volunteerHours?: Measurement;
  impact?: Measurement;
}

export interface SubmissionResponse {
  submissionId: string;
  message: string;
  data: unknown;
}

export interface Status {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string; // ISO 8601
}

export interface Measurement {
  value: number;
  unitOfMeasure: string;
  displayName?: string;
  siUnit?: string;
  shortSummary?: string;
  summary?: string;
  description?: string;
  slug?: string;
  speciesUsed?: string;
}

export interface MediaFile {
  type: string;
  url: string;
  description: string;
  caption: string;
  dateCaptured?: string; // ISO 8601
  mediaFileReferenceId: string;
}

export interface SitePermission {
  obtained: boolean;
  holder: string;
  documents?: MediaFile;
  details?: string;
}

export interface Location {
  mediaFileReferenceId: string;
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
  mediaFile: MediaFile | null;
}

export interface Plant {
  id: unknown;
  name: string;
  quantity: Measurement;
  atRisk: boolean;
  healthStatus: string;
  mediaFile: MediaFile | null;
  survivalStatus: string;
  mediaFileReferenceId: string;
}

export interface Species {
  id?: unknown;
  name?: string;
  quantity?: Measurement;
  atRisk?: boolean;
  health?: string;
  mediaFile?: MediaFile;
  mediaFileReferenceId?: string;
  iNaturalistObsId?: string;
}

export interface AnchorPoint {
  name: string;
  consentMethod?: string;
  outreachMethod?: string;
  waterHarvestingType?: string;
  shadeType?: string;
  orientation?: string;
  notes?: string;
  description?: string;
  coolingCornerType?: string;
  healthatAdaption?: string;
  participationType?: string;
  installationType?: string;
  institutionName?: string;
  drinkingWaterPointType?: string;
  drinkingWaterPointStatus?: string;
  actionType?: string;
  surfaceType?: string;
  season?: string;
  recommendation?: string;
  actionTriggered?: string;
  sunExposure?: string;
  priorityLevel?: string;
  waterSourceTypeConnected?: string;
  droughtReliability?: string;
  mediaFileReferenceId: string;
  location: Location | null;
  region: Location | null;
  mediaFile: MediaFile | null;
  actionPhoto: MediaFile | null;
  dateRegistered?: string; // ISO 8601
  dateCaptured?: string; // ISO 8601
  setupDate?: string; // ISO 8601
  roundDate?: string; // ISO 8601
  plantingDate?: string; // ISO 8601
  installationDate?: string; // ISO 8601
  visitDate?: string; // ISO 8601
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  eventDate?: string; // ISO 8601
  eventStartTime?: string;
  eventEndTime?: string;
  surveyDate?: string; // ISO 8601
  metaData?: unknown;
  categories?: unknown[];
  communicationChannel?: unknown[];
  boundary?: unknown;
  habitatType?: unknown;
  siteMetadata?: unknown;
  opened?: boolean;
  waterAccess?: boolean;
  higherRiskFlag?: boolean;
  vulnerableFlag?: boolean;
  permissionObtained?: boolean;
  atRisk?: boolean;
  supplyShortFall?: boolean;
  compostingActive?: boolean;
  safeToDrink?: boolean;
  mapShared?: boolean;
  irDeviceAvailable?: boolean;
  municipalAgreementObtained?: boolean;
  drainageLayer?: boolean;
  personsInAccessRadius?: Measurement;
  compostMassKg?: Measurement;
  areaMulched?: Measurement;
  depthMulched?: Measurement;
  litresDistributed?: Measurement;
  litresCollected?: Measurement;
  houseHoldsCount?: Measurement;
  eventCapacity?: Measurement;
  shortFall?: Measurement;
  houseHoldsServed?: Measurement;
  householdsReached?: Measurement;
  plantsWatered?: Measurement;
  treeWatered?: Measurement;
  treesPlanted?: Measurement;
  plantsAdapted?: Measurement;
  measurement: Measurement | null;
  openingHours?: Measurement;
  assignedVolunteers?: Measurement;
  vulnerableMembers?: Measurement;
  litresApplied?: Measurement;
  waterLevelReading?: Measurement;
  participantsCount?: Measurement;
  duration?: Measurement;
  areaCovered?: Measurement;
  areaGreened?: Measurement;
  sealedOrRemovedArea?: Measurement;
  estimatedPlantingArea?: Measurement;
  estimatedCapacityPerDay?: Measurement;
  speciesUsed?: Measurement;
  gardenArea?: Measurement;
  speciesPlanted?: Measurement;
  actualGardenArea?: Measurement;
  nativeSpeciesCount?: Measurement;
  harvestEstimate?: Measurement;
  pointsRestoredCreated?: Measurement;
  estimatedLitresPerDay?: Measurement;
  totalTrees?: Measurement;
  catchmentArea?: Measurement;
  excavationDepth?: Measurement;
  plants?: Plant[];
  trees?: Plant[];
  species?: Species[];
}

export interface DataEnvelope {
  measurement?: Measurement;
  count?: Measurement;
  checkinCount?: Measurement;
  shortFall?: Measurement;
  volunteerHours?: Measurement;
  assignedVolunteers?: Measurement;
  vulnerableMembers?: Measurement;
  membersAssisted?: Measurement;
  householdsReached?: Measurement;
  litresDistributed?: Measurement;
  litresCollected?: Measurement;
  houseHoldsCount?: Measurement;
  houseHoldsServed?: Measurement;
  waterSourceMonitored?: Measurement;
  capacity?: Measurement;
  level?: Measurement;
  openingHours?: Measurement;
  baselineReading?: Measurement;
  areaCovered?: Measurement;
  areaGreened?: Measurement;
  treePlanted?: Measurement;
  speciesPlanted?: Measurement;
  sealedOrRemovedArea?: Measurement;
  estimatedPlantingArea?: Measurement;
  speciesUsed?: Measurement;
  participantsCount?: Measurement;
  duration?: Measurement;
  plantsSurvived?: Measurement;
  areaMulched?: Measurement;
  compostMassKg?: Measurement;
  plantingArea?: Measurement[];
  greeningArea?: Measurement[];
  gardenArea?: Measurement;
  nativeSpeciesCount?: Measurement;
  sitePermission?: SitePermission;
  anchorPoints?: AnchorPoint[];
  anchorPoint?: AnchorPoint;
  baselinePhoto?: MediaFile;
  sitePhoto?: MediaFile;
  referenceImage?: MediaFile;
  mediaFiles?: MediaFile[];
  receipt?: MediaFile;
  installationPhoto?: MediaFile;
  report?: MediaFile;
  mediaFile?: MediaFile;
  plantingPhoto?: MediaFile;
  techniquesCovered?: unknown[];
  contributors?: string[];
  flagSpecies?: string[];
  leadFacilitator?: string;
  lessonsLearned?: string;
  currentCondition?: string;
  currentActivity?: string;
  description?: string;
  comment?: string;
  weatherConditions?: string;
  iNaturalistObsId?: string;
  landAccess?: string;
  habitatType?: string;
  location?: Location;
  region?: Location;
  addresses?: Location[];
  capturedAt?: string; // ISO 8601
  registeredAt?: string; // ISO 8601
  installedAt?: string; // ISO 8601
  dateRegistered?: string; // ISO 8601
  plantingDate?: unknown;
  installationDate?: string; // ISO 8601
  setupDate?: string; // ISO 8601
  visitDate?: string; // ISO 8601
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  eventDate?: string; // ISO 8601
  eventStart?: string;
  eventEnd?: string;
  confirm?: boolean;
  completed?: boolean;
  toggle?: boolean;
  reportShared?: boolean;
  alertReceived?: boolean;
  welfareFlagged?: boolean;
  assistanceProvided?: boolean;
  hasWaterAccess?: boolean;
  open?: boolean;
  permissionObtained?: boolean;
  metaData?: unknown;
  communicationChannel?: unknown[];
  consentMethod?: string;
  outreachMethod?: string;
  outreachMethods?: unknown[];
  caption?: string;
  category?: unknown[];
  notes?: string;
  name?: string;
  shadeType?: string;
  activationMode?: string;
  activationModel?: string;
  surfaceType?: string;
  plants?: Plant[];
  usedSpecies?: Species[];
  species?: Species[];
}
