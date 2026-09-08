import type { AnchorPoint, DataEnvelope } from "./contract";

// Runtime mirrors of contract.ts's interfaces — TS types are erased, so the
// payload builders need an actual key list to check dynamically-named template
// fields against. Kept in a sibling file so regenerating contract.ts from the Go
// models never clobbers them; the assertions below fail the typecheck if the two
// drift apart in either direction.

export const ANCHOR_POINT_KEYS = [
  "name", "consentMethod", "outreachMethod", "waterHarvestingType", "shadeType",
  "orientation", "notes", "description", "coolingCornerType", "healthatAdaption",
  "participationType", "installationType", "institutionName",
  "drinkingWaterPointType", "drinkingWaterPointStatus", "actionType",
  "surfaceType", "season", "recommendation", "actionTriggered", "sunExposure",
  "priorityLevel", "waterSourceTypeConnected", "droughtReliability",
  "opensAt", "closedAt",
  "mediaFileReferenceId", "location", "region", "suburb", "mediaFile", "actionPhoto",
  "dateRegistered", "dateCaptured", "setupDate", "roundDate", "plantingDate",
  "installationDate", "visitDate", "startDate", "endDate", "eventDate",
  "eventStartTime", "eventEndTime", "surveyDate", "metaData", "categories",
  "communicationChannel", "mulchingType", "techniquesCovered", "boundary",
  "habitatType", "siteMetadata", "compostIncluded", "opened",
  "waterAccess", "higherRiskFlag", "vulnerableFlag", "permissionObtained",
  "atRisk", "supplyShortFall", "compostingActive", "safeToDrink", "mapShared",
  "irDeviceAvailable", "municipalAgreementObtained", "drainageLayer",
  "personsInAccessRadius", "compostMassKg", "areaMulched", "depthMulched",
  "litresDistributed", "litresCollected", "houseHoldsCount", "eventCapacity",
  "shortFall", "houseHoldsServed", "householdsReached", "plantsWatered",
  "treeWatered", "treesPlanted", "plantsAdapted", "measurement",
  "assignedVolunteers", "vulnerableMembers", "litresApplied",
  "waterLevelReading", "participantsCount", "duration", "areaCovered",
  "areaGreened", "sealedOrRemovedArea", "estimatedPlantingArea",
  "estimatedCapacityPerDay", "speciesUsed", "gardenArea", "speciesPlanted",
  "actualGardenArea", "nativeSpeciesCount", "harvestEstimate",
  "pointsRestoredCreated", "estimatedLitresPerDay", "totalTrees",
  "catchmentArea", "excavationDepth", "plants", "trees", "species",
] as const satisfies readonly (keyof AnchorPoint)[];

export const DATA_ENVELOPE_KEYS = [
  "measurement", "count", "checkinCount", "shortFall", "volunteerHours",
  "assignedVolunteers", "vulnerableMembers", "membersAssisted",
  "householdsReached", "litresDistributed", "litresCollected", "houseHoldsCount",
  "houseHoldsServed", "waterSourceMonitored", "capacity", "level",
  "openingHours", "baselineReading", "areaCovered", "areaGreened", "treePlanted",
  "speciesPlanted", "sealedOrRemovedArea", "estimatedPlantingArea",
  "speciesUsed", "participantsCount", "duration", "plantsSurvived",
  "areaMulched", "compostMassKg", "plantingArea", "greeningArea", "gardenArea",
  "nativeSpeciesCount", "sitePermission", "anchorPoints", "anchorPoint",
  "baselinePhoto", "sitePhoto", "referenceImage", "mediaFiles", "receipt",
  "installationPhoto", "report", "mediaFile", "plantingPhoto",
  "techniquesCovered", "contributors", "flagSpecies", "leadFacilitator",
  "lessonsLearned", "currentCondition", "currentActivity", "description",
  "comment", "weatherConditions", "iNaturalistObsId", "landAccess",
  "habitatType", "location", "region", "addresses", "capturedAt", "registeredAt",
  "installedAt", "dateRegistered", "plantingDate", "installationDate",
  "setupDate", "visitDate", "startDate", "endDate", "eventDate", "eventStart",
  "eventEnd", "confirm", "completed", "toggle", "reportShared", "alertReceived",
  "welfareFlagged", "assistanceProvided", "hasWaterAccess", "open",
  "permissionObtained", "metaData", "communicationChannel", "consentMethod",
  "outreachMethod", "outreachMethods", "institutionType", "verificationMethod",
  "dateVerified", "confirmAccessible", "openingHour", "closingHour",
  "caption", "category", "notes", "name",
  "shadeType", "activationMode", "activationModel", "surfaceType", "plants",
  "usedSpecies", "species",
] as const satisfies readonly (keyof DataEnvelope)[];

// `satisfies` above catches a key that contract.ts dropped; these catch one it
// gained. Both resolve to `never` while the lists are complete.
type MissingAnchorPointKeys = Exclude<keyof AnchorPoint, (typeof ANCHOR_POINT_KEYS)[number]>;
type MissingDataEnvelopeKeys = Exclude<keyof DataEnvelope, (typeof DATA_ENVELOPE_KEYS)[number]>;
const _anchorPointKeysComplete: MissingAnchorPointKeys[] = [];
const _dataEnvelopeKeysComplete: MissingDataEnvelopeKeys[] = [];
void _anchorPointKeysComplete;
void _dataEnvelopeKeysComplete;

const anchorPointKeySet: ReadonlySet<string> = new Set(ANCHOR_POINT_KEYS);

export const isAnchorPointKey = (name: string) => anchorPointKeySet.has(name);

// Dev-only: a template field nested under "anchorPoint" whose name has no slot on
// the Go AnchorPoint struct is silently dropped by the BE on submit. Surfacing it
// here turns that into something visible while developing rather than something
// discovered later in the database.
export function warnUnmappedAnchorPointKey(name: string, challengeCode?: string) {
  if (process.env.NODE_ENV === "production" || isAnchorPointKey(name)) return;
  console.warn(
    `[anchorPoint] "${name}"${challengeCode ? ` (${challengeCode})` : ""} has no matching field on models.AnchorPoint — the BE will drop it. Needs a BE struct field.`,
  );
}
