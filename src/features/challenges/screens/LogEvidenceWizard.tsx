"use client";

import WizardSuccessScreen from "@/components/ui/WizardSuccessScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useEvidence } from "@/lib/hooks/activities";
import {
  useChallenge,
  useMarkStepComplete,
  useSubmitEvidence,
  useSubmitRegistration,
  useTemplates,
  useUpdateEvidence,
  type CH001SetupPayload,
  type ChallengeSetupAnchorPoint,
  type ChallengeSetupLocation,
  type SetupUpdateEvidencePayload,
  type SubmitEvidenceResponse,
} from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { canManageCircle } from "@/lib/permissions";
import { computeChallengeRoles } from "@/lib/roles";
import type { ApiActivityData, ApiRecentActivity } from "@/lib/types/circles";
import type { ApiSubmittedSetupDetail, ApiTemplateFormField } from "@/lib/types/challenges";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DerivedStep, DerivedWizardConfig } from "../lib/deriveWizardConfig";
import {
  ANCHOR_POINT_DATA_NAMES,
  COMPLETION_NAMES,
  DEDICATED_MEASUREMENT_NAMES,
  deriveWizardConfig,
  findAnchorLeaves,
  findAnchorReference,
  normalizeFieldName,
  preNormalizeAnchorFields,
  shapeFieldValue,
  toDataKey,
  withMediaFileReferenceId,
} from "../lib/deriveWizardConfig";
import { DEFAULT_FORM_CONFIG, STEP_FORM_CONFIGS } from "../stepFormConfig";
import { WizardHeader } from "../wizard/shared";
import ContributorsStep from "../wizard/steps/ContributorsStep";
import type { DynamicValues } from "../wizard/steps/DynamicFieldsStep";
import DynamicFieldsStep from "../wizard/steps/DynamicFieldsStep";
import FileUploadStep from "../wizard/steps/FileUploadStep";
import ImpactStep from "../wizard/steps/ImpactStep";
import InterventionsStep from "../wizard/steps/InterventionsStep";
import LocationPhotosStep from "../wizard/steps/LocationPhotosStep";
import MarkCompleteStep from "../wizard/steps/MarkCompleteStep";
import MeasurementStep from "../wizard/steps/MeasurementStep";
import MetricsStep from "../wizard/steps/MetricsStep";
import RegionStep from "../wizard/steps/RegionStep";
import ReviewStep, { type SetupUpdateRow } from "../wizard/steps/ReviewStep";
import SetupUpdateStep, { type SetupUpdateEntry } from "../wizard/steps/SetupUpdateStep";
import SiteConditionStep from "../wizard/steps/SiteConditionStep";
import SiteDetailsStep from "../wizard/steps/SiteDetailsStep";
import VolunteerHoursStep from "../wizard/steps/VolunteerHoursStep";
import { initForm, type LogFormData } from "../wizard/types";

const STORAGE_KEY = (stepId: string) => `log-evidence-draft-${stepId}`;

// File objects aren't JSON-serializable — JSON.stringify silently turns one
// into "{}" (Files have no own enumerable properties). Saved verbatim inside
// a GROUP entry (e.g. an anchor point's photo subfield), that corrupts the
// draft: on restore, "{}" is a truthy value that's neither a File nor a URL
// string, and ImageField's URL.createObjectURL(value) throws on it. Strip
// Files recursively before persisting so a draft can never carry one.
function stripFiles(value: unknown): unknown {
  if (value instanceof File) return undefined;
  if (Array.isArray(value)) return value.map(stripFiles);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const stripped = stripFiles(v);
      if (stripped !== undefined) out[k] = stripped;
    }
    return out;
  }
  return value;
}

const AREA_UNITS: LogFormData["areaUnit"][] = ["m²", "ha", "km²", "acres"];

function activityToForm(activity: ApiRecentActivity): LogFormData {
  // dataEnvelope, when present, is the more complete echo of what was
  // submitted — merge per-field so a dataEnvelope missing a given key (still
  // being rolled out BE-side) falls back to the legacy `data` bag
  const data = mergeActivityData(activity);
  const m = data.measurement;
  const siUnit = (m?.siUnit ?? "").toUpperCase();
  const measurementType =
    siUnit === "VOLUME" ? "VOLUME" : siUnit === "AREA" ? "AREA" : "MASS";
  return {
    ...initForm(),
    measurementValue: m?.value != null ? String(m.value) : "",
    measurementType,
    ...(measurementType === "AREA" && m?.value != null
      ? {
          estimatedArea: String(m.value),
          areaUnit: AREA_UNITS.includes(m.unitOfMeasure as LogFormData["areaUnit"])
            ? (m.unitOfMeasure as LogFormData["areaUnit"])
            : "m²",
        }
      : {}),
    impactDescription: data.description ?? "",
    locationResult: data.location ?? null,
    volunteerHours:
      activity.volunteerHours?.value != null
        ? String(activity.volunteerHours.value)
        : "",
    contributors: activity.contributors,
  };
}

// {value, unitOfMeasure} objects are how dynamic submissions store numeric
// fields (the API returns "unitOfMeasure", not "unit")
function isValueUnit(v: unknown): v is { value: number; unit?: string; unitOfMeasure?: string } {
  return (
    v !== null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    "value" in v &&
    ("unit" in v || "unitOfMeasure" in v)
  );
}

function valueUnitOf(v: { unit?: string; unitOfMeasure?: string }): string | undefined {
  return v.unit ?? v.unitOfMeasure;
}

// Same shape as isValueUnit but for a field already known to be NUMBER/
// NUMERIC — unit-less counts (e.g. CH-011 species.quantity: {"value": 1},
// no unit/unitOfMeasure key at all) still need stringifying, so the unit key
// can't be required here the way isValueUnit requires it to disambiguate
// from other object-shaped fields (LOCATION, mediaFile, …).
function isNumericFieldValue(
  v: unknown,
): v is { value: number; unit?: string; unitOfMeasure?: string } {
  return v !== null && typeof v === "object" && !Array.isArray(v) && "value" in v;
}

// Reverses shapeEntry's per-subfield shaping (buildDynamicPayload) for one
// nested GROUP/ITEM entry — recurses so a nested leaf (e.g. CH-011's
// species.quantity) comes back as a form-usable string+unit instead of the
// raw {value, unitOfMeasure} object, which ReviewStep would otherwise render
// directly as a React child and crash on.
function unshapeSubEntry(
  subFields: ApiTemplateFormField[],
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  for (const sub of subFields) {
    const v = raw[sub.name];
    if (v === undefined || v === null || v === "") continue;
    if (sub.type === "IMAGE") {
      const url = (v as { url?: string } | undefined)?.url;
      if (url) entry[sub.name] = url;
      continue;
    }
    if (sub.type === "GROUP" || sub.type === "ITEM") {
      const nestedArr = Array.isArray(v)
        ? (v as Record<string, unknown>[])
        : [v as Record<string, unknown>];
      entry[sub.name] = nestedArr.map((n) => unshapeSubEntry(sub.fields ?? [], n));
      continue;
    }
    if ((sub.type === "NUMBER" || sub.type === "NUMERIC") && isNumericFieldValue(v)) {
      entry[sub.name] = String(v.value);
      const unit = valueUnitOf(v);
      if (unit) entry[`${sub.name}__unit`] = unit;
      continue;
    }
    entry[sub.name] = v;
  }
  return entry;
}

// dataEnvelope is being rolled out BE-side field by field — merge it over
// `data` rather than picking one bag wholesale, so fields still missing from
// dataEnvelope (e.g. mediaFiles) keep falling back to `data`.
function mergeActivityData(activity: ApiRecentActivity): ApiActivityData {
  return { ...activity.data, ...activity.dataEnvelope };
}

// Same dataEnvelope rollout as activities, but on submittedSetupDetail — the
// BE has been seen sending `data: null` with everything (anchorPoints
// included) living in dataEnvelope instead. Also folds `region` in as
// `location` since the setup endpoint's LOCATION field is keyed either way
// depending on template (see toDataKey's locationKey comment).
function mergeSetupDetailData(
  setupDetail: ApiSubmittedSetupDetail,
): NonNullable<ApiSubmittedSetupDetail["data"]> {
  const { region, ...envelope } = setupDetail.dataEnvelope ?? {};
  return {
    ...setupDetail.data,
    ...envelope,
    location: envelope.location ?? region ?? setupDetail.data?.location ?? undefined,
  };
}

// Reverses buildAnchorSetupPayload's entry → ChallengeSetupAnchorPoint
// mapping. The BE replaces submittedSetupDetail wholesale on every
// /challengeSetup call (no merge) — so reopening step one has to prefill the
// addable GROUP with the already-registered points, editable in place,
// otherwise resubmitting to add a far-away point silently drops the earlier
// ones instead of appending to them.
const TEMP_UNIT_LABELS_REVERSE: Record<string, string> = { "°C": "C", "°F": "F", K: "K" };

function anchorPointToEntry(
  point: ChallengeSetupAnchorPoint,
  groupField: ApiTemplateFormField,
): Record<string, unknown> {
  const subFields = groupField.fields ?? [];
  const nameSub = subFields.find((f) => f.type === "TEXT");
  const locSub = subFields.find((f) => f.type === "LOCATION");
  const numberSubFields = subFields.filter(
    (f) => f.type === "NUMBER" || f.type === "NUMERIC",
  );
  const tempSub =
    numberSubFields.length === 1 &&
    !DEDICATED_MEASUREMENT_NAMES.has(normalizeFieldName(numberSubFields[0].name))
      ? numberSubFields[0]
      : undefined;

  const entry: Record<string, unknown> = {};
  if (nameSub) entry[nameSub.name] = point.name;
  if (locSub && point.location) {
    const { mediaFileReferenceId: _drop, ...loc } = point.location;
    entry[locSub.name] = loc;
  }
  if (tempSub && point.measurement) {
    entry[tempSub.name] = String(point.measurement.value);
    entry[`${tempSub.name}__unit`] =
      TEMP_UNIT_LABELS_REVERSE[point.measurement.unitOfMeasure] ??
      point.measurement.unitOfMeasure;
  }

  // Remaining subfields were passed through shaped (see buildAnchorSetupPayload)
  // — undo just enough shaping to feed them back into FieldControl inputs.
  for (const sub of subFields) {
    if (sub === nameSub || sub === locSub || sub === tempSub) continue;
    if (sub.type === "IMAGE") {
      // Carry the mediaFile object through as-is — untouched, it goes back
      // out verbatim in buildAnchorSetupPayload; replaced with a File if the
      // user picks a new photo, or cleared to drop it.
      if (point.mediaFile) entry[sub.name] = point.mediaFile;
      continue;
    }
    const raw = (point as Record<string, unknown>)[sub.name];
    if (raw === undefined || raw === null) continue;
    if (
      (sub.type === "NUMBER" || sub.type === "NUMERIC") &&
      isNumericFieldValue(raw)
    ) {
      // Unit-less counts (e.g. Households Served: {"value": 45}, no
      // unit/unitOfMeasure key) fail isValueUnit below and would otherwise
      // fall through to the raw-object branch, rendering as "[object Object]"
      entry[sub.name] = String(raw.value);
      const unit = valueUnitOf(raw);
      if (unit) entry[`${sub.name}__unit`] = unit;
    } else if (isValueUnit(raw)) {
      entry[sub.name] = String(raw.value);
      const unit = valueUnitOf(raw);
      if (unit) entry[`${sub.name}__unit`] = unit;
    } else if (raw && typeof raw === "object" && "description" in raw) {
      entry[sub.name] = (raw as { description?: string }).description ?? "";
    } else if (sub.type === "DATE" && typeof raw === "string") {
      // BE returns a full ISO timestamp; <input type="date"> needs YYYY-MM-DD
      entry[sub.name] = raw.slice(0, 10);
    } else {
      entry[sub.name] = raw;
    }
  }
  return entry;
}

// CH-011's weeklyCareRounds and CH-015's greening ship their later-step
// "anchorPoint" GROUP as addable (log several entries) AND
// anchorPointTracking:true (each entry is against one previously-registered
// point) — a combination the normal anchor-reference idiom doesn't support:
// findAnchorReference only ever adopts a NON-addable GROUP as a point
// selector (see deriveWizardConfig.ts), and reworking that shared matcher to
// also flatten an addable+tracking GROUP would have to run CH-015's nested
// species/greeningArea ITEM arrays through findAnchorLeaves, which flattens
// nested containers into sibling leaf fields — colliding CH-015's two
// same-named "speciesUsed" fields (one inside greeningArea, one alongside
// it) and losing the per-species array shape entirely. Instead, splice a
// synthetic "select a registered point" SELECT subfield into the GROUP so
// the existing addable-entries editor (GroupField) captures the choice per
// entry like any other subfield, scoped to just these two challenges.
const ADDABLE_POINT_SELECT_CODES = new Set(["CH-011", "CH-015"]);
export const REGISTERED_POINT_FIELD_NAME = "__registeredPoint";

function withPointSelectSubfield(
  fields: ApiTemplateFormField[],
  challengeCode: string | undefined,
  stepType: string | undefined,
  anchorPoints: ChallengeSetupAnchorPoint[],
): ApiTemplateFormField[] {
  if (
    !challengeCode ||
    !ADDABLE_POINT_SELECT_CODES.has(challengeCode) ||
    normalizeFieldName(stepType) === "REGISTRATION" ||
    !anchorPoints.length
  )
    return fields;
  return fields.map((f) =>
    f.type === "GROUP" &&
    f.addableInput &&
    normalizeFieldName(f.name) === "ANCHORPOINT"
      ? {
          ...f,
          fields: [
            {
              name: REGISTERED_POINT_FIELD_NAME,
              label: "Select Registered Point",
              type: "SELECT",
              required: true,
              displayOrder: -1,
              options: anchorPoints.map((p) => ({ value: p.name, label: p.name })),
            },
            ...(f.fields ?? []),
          ],
        }
      : f,
  );
}

// Reverses buildAnchorSetupPayload's `vhUnit === "H" ? "hours" : vhUnit.toLowerCase()`
// — matches the stored unit string back to one of the field's own option
// codes (falls back to the field's first/default option, "H" in practice).
function reverseUnitCode(
  field: ApiTemplateFormField | undefined,
  storedUnit: string | undefined,
): string | undefined {
  if (!storedUnit) return undefined;
  const opt = field?.unitOfMeasureOptions?.find(
    (u) =>
      u.value.toLowerCase() === storedUnit.toLowerCase() ||
      u.label.toLowerCase() === storedUnit.toLowerCase() ||
      (u.value === "H" && storedUnit.toLowerCase() === "hours"),
  );
  return opt?.value ?? field?.unitOfMeasureOptions?.[0]?.value;
}

function activityToDynamic(
  activity: ApiRecentActivity,
  vhFieldName: string,
  contribFieldName: string,
  stepForm?: import("@/lib/types/challenges").ApiTemplateFormField[] | null,
  anchorPointTracking?: boolean,
): DynamicValues {
  const result: DynamicValues = {};
  // dataEnvelope, when present, is the more complete echo of what was
  // submitted — merge per-field so a dataEnvelope missing a given key (still
  // being rolled out BE-side) falls back to the legacy `data` bag
  const data = mergeActivityData(activity);
  // Same flattening deriveWizardConfig/buildDynamicPayload apply for
  // rendering/collection — reading back must agree, or a non-tracking step's
  // typeless "anchorPoint" wrapper (e.g. CH-004's composting log, reused
  // purely for BE payload shaping) gets misread as a real anchor-point
  // reference by findAnchorReference below instead of yielding its flattened
  // fields (measurement, description) directly.
  const fields = preNormalizeAnchorFields(stepForm ?? [], anchorPointTracking);

  // Generic reverse of buildDynamicPayload: captured fields were merged into
  // data under their raw template field names
  for (const field of fields) {
    if (field.name === vhFieldName || field.name === contribFieldName) continue;
    // IMAGE fields are hydrated below from data.mediaFile(s) — when a
    // template names its IMAGE field "mediaFile" (CH-015), data.mediaFile is
    // the raw MediaFile object, not a URL string, and would otherwise
    // clobber the field before the dedicated logic below can set it
    if (field.type === "IMAGE") continue;
    const raw = data[field.name];
    if (raw === undefined || raw === null || raw === "") continue;

    if (
      (field.type === "GROUP" || field.type === "ITEM") &&
      (Array.isArray(raw) || typeof raw === "object")
    ) {
      // An unadopted/singular GROUP (e.g. CH-007's anchorPoint, sent as
      // entries[0] rather than an array — see buildDynamicPayload) is
      // echoed back as one plain object, not an array. GroupField/
      // GroupEntryCard always expect an array, so normalize it to one.
      const rawArr = Array.isArray(raw)
        ? (raw as Record<string, unknown>[])
        : [raw as Record<string, unknown>];
      const numSubs = (field.fields ?? []).filter(
        (f) => f.type === "NUMBER" || f.type === "NUMERIC",
      );
      const imageSubNames = new Set(
        (field.fields ?? []).filter((f) => f.type === "IMAGE").map((f) => f.name),
      );

      // Current shape: each numeric subfield is its own flat Measurement
      // entry in the array ({value, unitOfMeasure, siUnit, speciesUsed,
      // description}) — models.Data.GreeningArea/PlantingArea are
      // []Measurement, not an object keyed by subfield name. `description`
      // says which subfield the entry belongs to (older records, from
      // before that tag existed, fall back to the group's first numeric
      // subfield). Merge them all back into one GroupEntryCard entry.
      const isFlatMeasurementArray =
        numSubs.length > 0 && rawArr.length > 0 && rawArr.every((e) => isValueUnit(e));
      if (isFlatMeasurementArray) {
        const merged: Record<string, unknown> = {};
        for (const entry of rawArr as {
          value: number;
          unit?: string;
          unitOfMeasure?: string;
          description?: string;
          speciesUsed?: string;
        }[]) {
          const sub =
            numSubs.find((s) => s.name === entry.description) ?? numSubs[0];
          if (sub) {
            merged[sub.name] = String(entry.value);
            merged[`${sub.name}__unit`] = valueUnitOf(entry);
          }
          if (entry.speciesUsed !== undefined) {
            const speciesSub = (field.fields ?? []).find(
              (f) => normalizeFieldName(f.name) === "SPECIESUSED",
            );
            if (speciesSub) merged[speciesSub.name] = entry.speciesUsed;
          }
        }
        result[field.name] = [merged];
        continue;
      }

      // Legacy/generic shape: array of GROUP entries already keyed by
      // subfield name (e.g. anchor-point-style groups)
      result[field.name] = rawArr.map((entry) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(entry)) {
          // A GROUP-nested IMAGE subfield's value (uploaded media) arrives
          // as a MediaFile object — pull out the URL the same way the
          // top-level mediaFile is handled below
          if (imageSubNames.has(k) && v && typeof v === "object" && "url" in v) {
            out[k] = (v as { url?: string }).url ?? "";
            continue;
          }
          // A sub-field can itself be a GROUP/ITEM (e.g. CH-011's species
          // inside anchorPoint) — recurse the same way buildDynamicPayload's
          // shapeEntry does on submit, or the nested leaf rides through as
          // the raw API object and crashes the review screen's renderer.
          const subDef = (field.fields ?? []).find((f) => f.name === k);
          if ((subDef?.type === "GROUP" || subDef?.type === "ITEM") && v) {
            const nestedArr = Array.isArray(v)
              ? (v as Record<string, unknown>[])
              : [v as Record<string, unknown>];
            out[k] = nestedArr.map((n) => unshapeSubEntry(subDef.fields ?? [], n));
            continue;
          }
          const isNumberSubDef = subDef?.type === "NUMBER" || subDef?.type === "NUMERIC";
          if (isValueUnit(v) || (isNumberSubDef && isNumericFieldValue(v))) {
            out[k] = String((v as { value: number }).value);
            const unit = valueUnitOf(v as { unit?: string; unitOfMeasure?: string });
            if (unit) out[`${k}__unit`] = unit;
          } else {
            out[k] = v;
          }
        }
        return out;
      });
    } else if (Array.isArray(raw)) {
      // Addable numeric fields hold one {value, unit} per entry
      if (raw.length && isValueUnit(raw[0])) {
        result[field.name] = (
          raw as { value: number; unit?: string; unitOfMeasure?: string }[]
        ).map((v) => String(v.value));
        result[`${field.name}__unit`] = valueUnitOf(
          raw[0] as { unit?: string; unitOfMeasure?: string },
        );
      } else {
        result[field.name] = raw;
      }
    } else if (isValueUnit(raw)) {
      result[field.name] = String(raw.value);
      result[`${field.name}__unit`] = valueUnitOf(raw);
    } else {
      result[field.name] = raw;
    }
  }

  // Re-measured registered point (setup-update steps): data.anchorPoint +
  // data.measurement feed the SELECT "locations" (or "anchorPoint" — CH-001's
  // BASELINE_OBSERVATION shape) entry. A type-less field, or a typed GROUP
  // with no direct usable leaves (CH-007: only its identity subfield), is
  // the same "reference" shape — deriveWizardConfig adopts it under the
  // name "locations", so mirror that key here. Its nested fields — found
  // via findAnchorLeaves, wherever they actually live — render inline per
  // point; echo their prior values back by name so re-opening a submission
  // shows what was entered.
  const refField = findAnchorReference(fields, anchorPointTracking);
  const nestedDetailFields = refField ? findAnchorLeaves(refField) : [];
  const primaryFieldName = nestedDetailFields.find(
    (f) => f.type === "NUMBER" || f.type === "NUMERIC",
  )?.name;
  const pointsField =
    fields.find(
      (f) =>
        f.type === "SELECT" &&
        (f.name.toLowerCase() === "locations" ||
          normalizeFieldName(f.name) === "ANCHORPOINT"),
    ) ?? (refField ? { name: "locations" } : undefined);
  if (pointsField && (data.anchorPoint || data.measurement)) {
    const anchorPointData = data.anchorPoint as Record<string, unknown> | undefined;
    result[pointsField.name] = {
      selected: data.anchorPoint?.name ?? "",
      higherRiskFlag: data.anchorPoint?.higherRiskFlag ?? false,
      values: {
        ...(primaryFieldName && data.measurement?.value != null
          ? { [primaryFieldName]: String(data.measurement.value) }
          : {}),
        ...Object.fromEntries(
          nestedDetailFields
            .filter((f) => f.name !== primaryFieldName && f.type !== "IMAGE")
            .map((f) => [f.name, anchorPointData?.[f.name] ?? data[f.name]])
            .filter(([, v]) => v !== undefined && v !== null && v !== ""),
        ),
      },
    } satisfies SetupUpdateEntry;
  } else if (data.measurement && !fields.some((f) => f.name === "measurement")) {
    // data.measurement belongs to the first free numeric field, or the
    // legacy MEASUREMENT name when the template has none — skipped when a
    // field is literally named "measurement" (e.g. CH-004), since the
    // generic loop above already captured it under that name
    const numField = fields.find(
      (f) =>
        (f.type === "NUMBER" || f.type === "NUMERIC") &&
        f.name !== vhFieldName &&
        result[f.name] === undefined,
    );
    const key = numField?.name ?? "MEASUREMENT";
    result[key] = String(data.measurement.value);
    result[`${key}__unit`] = data.measurement.unitOfMeasure;
  }

  if (data.description !== undefined) {
    const descField = fields.find((f) => f.name.toUpperCase().includes("DESCRIPTION"));
    result[descField?.name ?? "ACTIVITY_DESCRIPTION"] = data.description;
  }

  // Registered anchor points (setup steps) → the GROUP field's entries.
  // Every subfield — whatever its type, TOGGLE/SELECT/IMAGE/NUMBER — is read
  // back by its own name off the point, same as buildAnchorSetupPayload
  // submits it, instead of being silently dropped for not being one of a
  // fixed few types. A NUMBER subfield with nothing under its own name
  // falls back to the shared p.measurement slot only when it's the sole
  // NUMBER subfield — older submissions stored a dedicated-slot field like
  // capacity there before that had its own key; new ones use their own key
  // directly and never hit the fallback.
  if (data.anchorPoints?.length) {
    const groupField = fields.find((f) => f.type === "GROUP");
    if (groupField && result[groupField.name] === undefined) {
      const subs = groupField.fields ?? [];
      const nameSub = subs.find((f) => f.type === "TEXT");
      const locSub = subs.find((f) => f.type === "LOCATION");
      const numberSubs = subs.filter((f) => f.type === "NUMBER" || f.type === "NUMERIC");
      result[groupField.name] = data.anchorPoints.map((p) => {
        const entry: Record<string, unknown> = {};
        if (nameSub) entry[nameSub.name] = p.name;
        if (locSub && p.location) entry[locSub.name] = p.location;
        for (const sub of subs) {
          if (sub === nameSub || sub === locSub) continue;
          const isNumberSub = sub.type === "NUMBER" || sub.type === "NUMERIC";
          let raw = (p as unknown as Record<string, unknown>)[sub.name];
          if (
            (raw === undefined || raw === null || raw === "") &&
            isNumberSub &&
            numberSubs.length === 1 &&
            p.measurement
          ) {
            raw = p.measurement;
          }
          if (raw === undefined || raw === null || raw === "") continue;
          if (sub.type === "IMAGE") {
            const url = (raw as { url?: string } | undefined)?.url;
            if (url) entry[sub.name] = url;
            continue;
          }
          if (isNumberSub && isNumericFieldValue(raw)) {
            entry[sub.name] = String(raw.value);
            const unit = valueUnitOf(raw);
            if (unit) entry[`${sub.name}__unit`] = unit;
            continue;
          }
          if (sub.type === "GROUP" || sub.type === "ITEM") {
            const rawArr = Array.isArray(raw)
              ? (raw as Record<string, unknown>[])
              : [raw as Record<string, unknown>];
            entry[sub.name] = rawArr.map((r) => unshapeSubEntry(sub.fields ?? [], r));
            continue;
          }
          entry[sub.name] = raw;
        }
        return entry;
      });
    }
  }

  if (data.location) {
    const locField = fields.find((f) => f.type === "LOCATION");
    if (locField && result[locField.name] === undefined) {
      result[locField.name] = data.location;
    }
  }

  // First uploaded media file → the IMAGE field (as a URL string). BE has
  // used both "mediaFiles" (array) and "mediaFile" (singular) — check both.
  // Older submissions (pre CH-015 mediaFiles[refId] upload parity) can still
  // contain URL-less placeholders ahead of the real one, so find the first
  // entry that actually has a url rather than assuming index 0.
  const mediaFileSingle = data.mediaFile as
    | { url?: string }
    | { url?: string }[]
    | undefined;
  const firstMediaFile = data.mediaFiles?.find((m) => m.url)
    ?? (Array.isArray(mediaFileSingle)
      ? mediaFileSingle.find((m) => m.url)
      : mediaFileSingle);
  if (firstMediaFile?.url) {
    // Prefer a top-level IMAGE field; older templates have one. CH-015's
    // current template nests each photo inside a GROUP/ITEM entry instead —
    // fall back to the first one with an IMAGE subfield so the photo shows
    // *somewhere* (the BE only tracks one url per submission today, so
    // which entry it truly came from can't be recovered)
    const imgField = fields.find((f) => f.type === "IMAGE");
    if (imgField && result[imgField.name] === undefined) {
      result[imgField.name] = firstMediaFile.url;
    } else if (!imgField) {
      const groupWithImage = fields.find(
        (f) =>
          (f.type === "GROUP" || f.type === "ITEM") &&
          f.fields?.some((s) => s.type === "IMAGE"),
      );
      const imageSub = groupWithImage?.fields?.find((s) => s.type === "IMAGE");
      if (groupWithImage && imageSub) {
        const existing = Array.isArray(result[groupWithImage.name])
          ? (result[groupWithImage.name] as Record<string, unknown>[])
          : [{}];
        const [first, ...rest] = existing;
        result[groupWithImage.name] = [
          { ...first, [imageSub.name]: firstMediaFile.url },
          ...rest,
        ];
      }
    }
  }

  if (data.weatherCondition) {
    const weatherField = fields.find((f) => f.name.toUpperCase().includes("WEATHER"));
    if (weatherField && result[weatherField.name] === undefined) {
      result[weatherField.name] = data.weatherCondition;
    }
  }

  if (data.capturedAt) {
    const dateField = fields.find(
      (f) => f.type === "DATE" && result[f.name] === undefined,
    );
    // ISO timestamp → yyyy-mm-dd so the date input can render it on edit
    if (dateField) result[dateField.name] = String(data.capturedAt).slice(0, 10);
  }

  // Legacy shape: data.fields
  for (const [key, val] of Object.entries(data.fields ?? {})) {
    if (isValueUnit(val)) {
      result[key] = String(val.value);
      result[`${key}__unit`] = valueUnitOf(val);
    } else {
      result[key] = val;
    }
  }

  if (activity.volunteerHours?.value != null) {
    result[vhFieldName] = String(activity.volunteerHours.value);
    result[`${vhFieldName}__unit`] = activity.volunteerHours.unitOfMeasure;
  }

  if (activity.contributors?.length) {
    result[contribFieldName] = activity.contributors;
  }

  return result;
}

type Props = { challengeId: string; stepId: string; viewId?: string };

export default function LogEvidenceWizard({
  challengeId,
  stepId,
  viewId,
}: Props) {
  const t = useTranslations("challenges");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user, loginData } = useAuth();
  const { data: challenge } = useChallenge(challengeId);
  const { data: users = [] } = useUsers();
  const submitEvidence = useSubmitEvidence();
  const updateEvidence = useUpdateEvidence();
  const submitRegistration = useSubmitRegistration();
  const markStepComplete = useMarkStepComplete();

  // ── Resolve step form fields ───────────────────────────────────────────────
  // Priority: challengeSteps.form (if non-null) → template.steps.form (fallback)
  const stepMeta = challenge?.challengeSteps?.find((s) => s.stepId === stepId);
  const { data: templates } = useTemplates();
  const templateStep = useMemo(() => {
    if (!challenge?.templateId || !templates) return null;
    const tmpl = templates.find((t) => t.templateId === challenge.templateId);
    return tmpl?.steps?.find((s) => s.stepId === stepId) ?? null;
  }, [challenge?.templateId, templates, stepId]);

  const rawStepForm =
    (stepMeta?.form?.length ? stepMeta.form : null) ??
    templateStep?.form ??
    null;

  // Setup-step data (anchor points) feeds the update screens of later steps —
  // never the setup step itself
  const setupDetail = challenge?.submittedSetupDetail;
  // Memoized: mergeSetupDetailData returns a fresh object, and setupData is a
  // dep of the derivedConfig memo below
  const setupData = useMemo(
    () =>
      setupDetail && stepMeta && setupDetail.stepId !== stepMeta.stepId
        ? mergeSetupDetailData(setupDetail)
        : undefined,
    [setupDetail, stepMeta],
  );

  // CH-011/CH-015 splice a synthetic point-select subfield into their
  // addable anchorPoint GROUP — see withPointSelectSubfield
  const stepForm = useMemo(
    () =>
      rawStepForm
        ? withPointSelectSubfield(
            rawStepForm,
            challenge?.challengeCode,
            stepMeta?.stepType,
            setupData?.anchorPoints ?? [],
          )
        : rawStepForm,
    [rawStepForm, challenge?.challengeCode, stepMeta?.stepType, setupData],
  );

  // BE form takes precedence over FE config whenever form fields are present.
  const isDerived = !!stepForm?.length;

  // Setup is whichever step sits first in challengeSteps (array position,
  // not a stepNumber/stepType field).
  const isSetupStep = challenge?.challengeSteps?.[0]?.stepId === stepId;
  // Already-registered anchor points, visible only while sitting on the
  // setup step itself — used to prefill/resume the addable GROUP below
  // instead of starting blank and losing them on resubmit. Memoized so the
  // empty-array fallback doesn't change identity every render and retrigger
  // the prefill effect below.
  const existingAnchorPoints = useMemo(
    () => (isSetupStep && setupDetail ? (mergeSetupDetailData(setupDetail).anchorPoints ?? []) : []),
    [isSetupStep, setupDetail],
  );

  const anchorPointTracking =
    stepMeta?.anchorPointTracking ?? templateStep?.anchorPointTracking;

  const derivedConfig: DerivedWizardConfig | null = useMemo(() => {
    if (!isDerived || !stepForm) return null;
    return deriveWizardConfig(stepForm, setupData, stepMeta?.stepType, anchorPointTracking);
  }, [isDerived, stepForm, setupData, stepMeta?.stepType, anchorPointTracking]);

  const setupUpdateStep = useMemo(
    () => derivedConfig?.steps.find((s) => s.kind === "setup-update"),
    [derivedConfig],
  );

  // ── Static config — FE fallback (also used for synchronous step init) ──────
  const feConfig = STEP_FORM_CONFIGS[stepId] ?? DEFAULT_FORM_CONFIG;
  const staticConfig = isDerived ? null : feConfig;

  const totalSteps =
    derivedConfig?.steps.length ?? staticConfig?.wizardSteps.length ?? 1;

  const shouldMarkComplete = isDerived
    ? !!derivedConfig?.steps.some((s) => s.kind === "mark-complete")
    : !!staticConfig?.wizardSteps.some((s) => s.type === "mark-complete");

  // BE stepId/stepType casing is migrating (SETUP_AND_REGISTRATION →
  // setupAndRegistration, REGISTRATION → registration, per-template) —
  // normalize before comparing, everywhere
  const isRegistrationStep =
    normalizeFieldName(stepId) === "SETUPANDREGISTRATION";

  // ── Step position ──────────────────────────────────────────────────────────
  // Use FE config length for initial mount (synchronous); correct via effect
  // once BE-derived config resolves (challenge data is async).
  const [step, setStep] = useState(() =>
    viewId ? feConfig.wizardSteps.length : 1,
  );

  useEffect(() => {
    if (viewId && derivedConfig) setStep(derivedConfig.steps.length);
  }, [viewId, derivedConfig]);
  const [isViewMode, setIsViewMode] = useState(!!viewId);
  const [submitted, setSubmitted] = useState(false);
  const [impactMessage, setImpactMessage] = useState<string | null>(null);
  const [viewActivity, setViewActivity] = useState<ApiRecentActivity | null>(
    null,
  );

  // ── Static form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState<LogFormData>(() =>
    isRegistrationStep
      ? { ...initForm(), measurementType: "AREA" }
      : initForm(),
  );

  // ── Dynamic form state ─────────────────────────────────────────────────────
  const [dynamicValues, setDynamicValues] = useState<DynamicValues>({});
  const updateDynamic = (name: string, value: unknown) =>
    setDynamicValues((prev) => ({ ...prev, [name]: value }));

  const currentStep = isDerived
    ? derivedConfig?.steps[step - 1]
    : staticConfig
      ? { kind: staticConfig.wizardSteps[step - 1]?.type, fields: [] }
      : null;

  const nextStepKind = isDerived
    ? derivedConfig?.steps[step]?.kind
    : staticConfig?.wizardSteps[step]?.type;

  const nextLabel =
    nextStepKind === "review" ? t("review") : tCommon("continue");
  const members = challenge?.members ?? [];

  // ── Draft: static path ─────────────────────────────────────────────────────
  useEffect(() => {
    if (viewId || isDerived) return;
    const saved = localStorage.getItem(STORAGE_KEY(stepId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((f) => ({ ...f, ...parsed, evidenceFiles: [] }));
      } catch {
        /* ignore */
      }
    }
  }, [stepId, viewId, isDerived]);

  useEffect(() => {
    if (viewId || isDerived) return;
    const { evidenceFiles: _files, ...serializable } = form;
    localStorage.setItem(STORAGE_KEY(stepId), JSON.stringify(serializable));
  }, [form, stepId, viewId, isDerived]);

  // ── Draft: dynamic path ────────────────────────────────────────────────────
  useEffect(() => {
    if (viewId || !isDerived) return;
    const saved = localStorage.getItem(STORAGE_KEY(stepId));
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.dynamic) setDynamicValues(parsed.dynamic);
    } catch {
      /* ignore */
    }
  }, [stepId, viewId, isDerived]);

  useEffect(() => {
    if (viewId || !isDerived) return;
    // Exclude File values (not serializable) — including ones nested inside
    // a GROUP entry's array (e.g. an anchor point's photo subfield)
    const serializable: DynamicValues = {};
    for (const [k, v] of Object.entries(dynamicValues)) {
      if (v instanceof File) continue;
      serializable[k] = stripFiles(v);
    }
    localStorage.setItem(
      STORAGE_KEY(stepId),
      JSON.stringify({ dynamic: serializable }),
    );
  }, [dynamicValues, stepId, viewId, isDerived]);

  // ── View mode: fetch the submission — refresh and shared links work too ────
  // Only applied while still in view mode so it can't clobber in-progress edits.
  const { data: fetchedEvidence, isError: evidenceFetchFailed } = useEvidence(
    viewId ?? "",
  );
  useEffect(() => {
    if (fetchedEvidence && isViewMode) setViewActivity(fetchedEvidence);
  }, [fetchedEvidence, isViewMode]);

  // Loading until the fetched submission has been applied to local state
  // (viewActivity feeds form/dynamicValues via effects). Stops on fetch error
  // rather than skeleton-ing forever.
  const isViewLoading = isViewMode && !viewActivity && !evidenceFetchFailed;

  // ── Edit permissions ───────────────────────────────────────────────────────
  const isCircleLead =
    !!challenge &&
    (loginData?.circles ?? []).some(
      (c) =>
        c.circleId === challenge.circleId &&
        canManageCircle(user?.email, user?.id, c),
    );
  const canEdit =
    !!challenge &&
    (computeChallengeRoles(user?.id, user?.email, challenge).length > 0 ||
      isCircleLead);

  // Redirect unauthorised users away from the wizard once the challenge loads.
  // viewId (view-only mode) is exempt — anyone with the link can view a submission.
  useEffect(() => {
    if (challenge && !canEdit && !viewId) {
      router.replace(`/challenges/${challengeId}`);
    }
  }, [challenge, canEdit, viewId, challengeId, router]);

  // Every step after setup re-measures or builds on submittedSetupDetail —
  // block direct-URL access to the wizard for later steps until setup has
  // actually been submitted.
  const setupRequired = !isSetupStep && !challenge?.submittedSetupDetail;

  useEffect(() => {
    if (challenge && !viewId && setupRequired) {
      router.replace(`/challenges/${challengeId}/steps/${stepId}`);
    }
  }, [challenge, viewId, setupRequired, challengeId, stepId, router]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const update = (key: keyof LogFormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const next = () => {
    if (step >= totalSteps) submit();
    else setStep((s) => s + 1);
  };

  const back = () => {
    if (step <= 1 || isViewMode) router.back();
    else setStep((s) => s - 1);
  };

  const close = () => router.back();

  const handleGoToStep = useCallback((targetStep: number) => {
    setIsViewMode(false);
    setStep(targetStep);
  }, []);

  // ── Bridge: feed dynamicValues into existing VolunteerHoursStep / ContributorsStep ──
  const vhFieldName = useMemo(
    () =>
      derivedConfig?.steps.find((s) => s.kind === "volunteer-hours")?.fields[0]
        ?.name ?? "VOLUNTEER_HOURS",
    [derivedConfig],
  );
  const contribFieldName = useMemo(
    () =>
      derivedConfig?.steps.find((s) => s.kind === "contributors")?.fields[0]
        ?.name ?? "CONTRIBUTORS",
    [derivedConfig],
  );

  // ── Prefill: resume the previously submitted setup step ────────────────────
  // The BE replaces submittedSetupDetail wholesale on every /challengeSetup
  // call (no merge) — reopening step one has to seed every field it carries
  // (region, anchor points, volunteer hours, contributors) from what was
  // already submitted, or resubmitting to add a far-away anchor point
  // silently wipes the rest of the step, not just the missing point. Only
  // ever fills in a field that's still empty, so an in-progress local draft
  // (restored by the effect above) always wins, and this never re-fires
  // once seeded.
  useEffect(() => {
    if (viewId || !isDerived || !isSetupStep || !setupDetail) return;
    const merged = mergeSetupDetailData(setupDetail);
    const groupField = stepForm?.find((f) => f.type === "GROUP");
    const locationField = stepForm?.find(
      (f) => f.type === "LOCATION" && !f.addableInput,
    );
    const vhField = derivedConfig?.steps.find((s) => s.kind === "volunteer-hours")
      ?.fields[0];

    setDynamicValues((prev) => {
      const isEmpty = (v: unknown) =>
        v === undefined || v === null || v === "" ||
        (Array.isArray(v) && v.length === 0);
      const next: DynamicValues = { ...prev };
      let changed = false;

      if (groupField && merged.anchorPoints?.length && isEmpty(prev[groupField.name])) {
        next[groupField.name] = merged.anchorPoints.map((p) =>
          anchorPointToEntry(p, groupField),
        );
        changed = true;
      }
      if (locationField && merged.location && isEmpty(prev[locationField.name])) {
        const { mediaFileReferenceId: _drop, ...loc } = merged.location;
        next[locationField.name] = loc;
        changed = true;
      }
      if (vhField && setupDetail.volunteerHours && isEmpty(prev[vhFieldName])) {
        next[vhFieldName] = String(setupDetail.volunteerHours.value);
        const unit = reverseUnitCode(vhField, setupDetail.volunteerHours.unitOfMeasure);
        if (unit) next[`${vhFieldName}__unit`] = unit;
        changed = true;
      }
      if (setupDetail.contributors?.length && isEmpty(prev[contribFieldName])) {
        next[contribFieldName] = setupDetail.contributors;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    viewId,
    isDerived,
    isSetupStep,
    setupDetail,
    stepForm,
    derivedConfig,
    vhFieldName,
    contribFieldName,
  ]);

  // ── View mode: populate form/dynamicValues once config resolves ────────────
  useEffect(() => {
    if (!viewActivity) return;
    setForm(activityToForm(viewActivity));
    if (isDerived) {
      setDynamicValues(
        activityToDynamic(
          viewActivity,
          vhFieldName,
          contribFieldName,
          stepForm,
          anchorPointTracking,
        ),
      );
    }
  }, [viewActivity, isDerived, vhFieldName, contribFieldName, stepForm, anchorPointTracking]);

  const bridgeForm: LogFormData = useMemo(
    () => ({
      ...initForm(),
      volunteerHours: (dynamicValues[vhFieldName] as string) ?? "",
      contributors: Array.isArray(dynamicValues[contribFieldName])
        ? (dynamicValues[contribFieldName] as string[])
        : [],
    }),
    [dynamicValues, vhFieldName, contribFieldName],
  );

  const updateBridge = (k: keyof LogFormData, v: unknown) => {
    if (k === "volunteerHours") updateDynamic(vhFieldName, v);
    else if (k === "contributors") updateDynamic(contribFieldName, v);
  };

  // CH-015 only: one measurement per submission — filling an area field
  // disables the trees count field and vice versa
  const disabledFields = useMemo(() => {
    const disabled = new Set<string>();
    if (challenge?.challengeCode !== "CH-015" || !stepForm) return disabled;
    const knownNames = new Set([
      vhFieldName,
      contribFieldName,
      "CONFIRM_COMPLETION",
      "CONFIRMATION",
    ]);
    const filled = (name: string) => {
      const v = dynamicValues[name];
      return v !== undefined && v !== null && v !== "";
    };
    const numeric = stepForm.filter(
      (f) =>
        !knownNames.has(f.name) &&
        (f.type === "NUMBER" || f.type === "NUMERIC"),
    );
    const areaFields = numeric.filter((f) => f.unitOfMeasureOptions?.length);
    const countFields = numeric.filter(
      (f) => !f.unitOfMeasureOptions?.length && f.name.includes("COUNT"),
    );
    if (areaFields.some((f) => filled(f.name)))
      countFields.forEach((f) => disabled.add(f.name));
    else if (countFields.some((f) => filled(f.name)))
      areaFields.forEach((f) => disabled.add(f.name));
    return disabled;
  }, [
    challenge?.challengeCode,
    stepForm,
    dynamicValues,
    vhFieldName,
    contribFieldName,
  ]);

  // ── Payload builders ───────────────────────────────────────────────────────
  const buildPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");
    const description = form.impactDescription || form.siteCondition;
    const volunteerHours = {
      value: parseFloat(form.volunteerHours) || 0,
      unitOfMeasure: "hours",
      siUnit: "TIME",
    };
    const data = {
      measurement: {
        value: parseFloat(form.measurementValue) || 0,
        unitofMeasure: form.measurementType === "VOLUME" ? "L" : "kg",
        siUnit: form.measurementType,
      },
      description,
    };
    return {
      stepId: stepMeta.stepId,
      activity: stepMeta.activity,
      stepNumber: stepMeta.stepNumber,
      challengeCode: challenge.challengeCode,
      circleId: challenge.circleId,
      thingId: challenge.challengeId,
      thingUUID: challenge.id,
      submittedBy: user.id,
      approvalRequired: false,
      volunteerHours,
      contributors: form.contributors,
      // data: already fully inside dataEnvelope — uncomment to send both
      // data,
      dataEnvelope: { ...data, volunteerHours, contributors: form.contributors },
    };
  };

  const buildRegistrationPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");
    const volunteerHours = {
      value: parseFloat(form.volunteerHours) || 0,
      unitOfMeasure: "hours",
      siUnit: "TIME",
    };
    const data = {
      unitOfMeasure: "LOCATION" as const,
      currentActivity: "",
      permission: {
        obtained: form.permissionConfirmed,
        holder: form.permissionHolder,
      },
      currentCondition: form.siteCondition,
      measurement: {
        value: parseFloat(form.measurementValue) || 0,
        unitOfMeasure: form.areaUnit,
        siUnit: "AREA" as const,
      },
      location: form.locationResult
        ? withMediaFileReferenceId({
            placeId: form.locationResult.placeId,
            suburb: form.locationResult.suburb,
            city: form.locationResult.city,
            country: form.locationResult.country,
            countryCode: form.locationResult.countryCode,
            province: form.locationResult.province,
            latitude: form.locationResult.latitude,
            longitude: form.locationResult.longitude,
            formattedAddress: form.locationResult.formattedAddress,
            postalCode: form.locationResult.postalCode,
          })
        : null,
    };
    return {
      stepId: stepMeta.stepId,
      activity: stepMeta.activity,
      circleId: challenge.circleId,
      stepNumber: stepMeta.stepNumber,
      stepType: stepMeta.stepType,
      challengeCode: challenge.challengeCode,
      challengeId: challenge.challengeId,
      thingId: challenge.challengeId,
      submittedBy: user.id,
      volunteerHours,
      contributors: form.contributors,
      // data: already fully inside dataEnvelope — uncomment to send both
      // data,
      dataEnvelope: { ...data, volunteerHours, contributors: form.contributors },
    };
  };

  // CH-015 (urban greening) only: the API parses exactly data.measurement +
  // data.description — any other key is silently dropped by its body parser
  // and produces no impact. Map the dynamic form fields into that shape.
  const buildCH015Payload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");

    const vhValue = parseFloat(dynamicValues[vhFieldName] as string) || 0;
    const vhUnit = (dynamicValues[`${vhFieldName}__unit`] as string) ?? "H";
    const contributors = Array.isArray(dynamicValues[contribFieldName])
      ? (dynamicValues[contribFieldName] as string[])
      : [];
    const knownNames = new Set([
      vhFieldName,
      contribFieldName,
      "CONFIRM_COMPLETION",
      "CONFIRMATION",
    ]);

    // The AREA impact formula assumes square metres — convert before sending
    const areaToSqm: Record<string, number> = {
      SQM: 1,
      SQFT: 0.09290304,
      ACRES: 4046.8564224,
      HECTARES: 10000,
    };

    const sorted = [...(stepForm ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const hasValue = (name: string) => {
      const v = dynamicValues[name];
      return v !== undefined && v !== null && v !== "";
    };

    // Measurement source: the last numeric field with unit options — the
    // form's outcome metric (AREA_GREENED, after AREA_SEALED_OR_REMOVED)
    const numericFields = sorted.filter(
      (f) =>
        !knownNames.has(f.name) &&
        (f.type === "NUMBER" || f.type === "NUMERIC") &&
        f.unitOfMeasureOptions?.length &&
        hasValue(f.name),
    );
    const measurementField = numericFields[numericFields.length - 1];

    let measurement:
      | {
          value: number;
          unitofMeasure: string;
          siUnit: string;
          description?: string;
        }
      | undefined;
    if (measurementField) {
      const value =
        parseFloat(dynamicValues[measurementField.name] as string) || 0;
      const unit =
        (dynamicValues[`${measurementField.name}__unit`] as string) ??
        measurementField.unitOfMeasureOptions?.[0]?.value ??
        "SQM";
      measurement = {
        value: value * (areaToSqm[unit] ?? 1),
        unitofMeasure: "m²",
        siUnit: "AREA",
      };
    } else {
      // Tree-planting variant: no area filled — the count field becomes a
      // COUNT measurement (drives the trees-planted impact formula)
      const countField = sorted.find(
        (f) =>
          !knownNames.has(f.name) &&
          (f.type === "NUMBER" || f.type === "NUMERIC") &&
          !f.unitOfMeasureOptions?.length &&
          f.name.includes("COUNT") &&
          hasValue(f.name),
      );
      if (countField) {
        const value = parseFloat(dynamicValues[countField.name] as string) || 0;
        measurement = { value, unitofMeasure: "count", siUnit: "COUNT" };
      }
    }

    // Description: an explicit DESCRIPTION field, else the species free-text field
    const descriptionField =
      sorted.find((f) => f.name.includes("DESCRIPTION") && hasValue(f.name)) ??
      sorted.find(
        (f) =>
          f.name.includes("SPECIES") && f.type === "TEXT" && hasValue(f.name),
      );
    const description = descriptionField
      ? String(dynamicValues[descriptionField.name])
      : "";
    if (measurement && description) measurement.description = description;

    // Also send every captured field under its raw name (original values,
    // pre-conversion). Most of these are ignored by the API today, but
    // data.greeningArea/plantingArea are []Measurement on the BE
    // (models.Data) — a flat {value, unitOfMeasure, siUnit, speciesUsed,
    // description} struct, not an object keyed by subfield name. A group
    // can hold more than one numeric subfield (e.g. greeningArea has both
    // sealedOrRemovedArea and areaGreened), so each becomes its OWN flat
    // Measurement entry in the array, tagged via `description` with the
    // subfield name so the two can still be told apart on view/edit.
    const unitToSiUnit: Record<string, string> = { "m²": "AREA", COUNT: "COUNT" };
    const rawFields: Record<string, unknown> = {};
    // GROUP/ITEM subfields of type IMAGE (CH-015 nests each entry's photo
    // inside it, rather than a single top-level IMAGE field) — collected
    // here, each tagged with a fresh mediaFileReferenceId (same idiom as the
    // generic builder's entries.map, see buildDynamicPayload), so every
    // photo travels as its own multipart part instead of only the first
    // surviving as the legacy mediaFile part. Note: the Go Measurement
    // struct has no mediaFileReferenceId slot, so today the BE can't
    // correlate a given entry's row back to its photo by that id — the id
    // still rides along for whenever that lands.
    const groupMediaFiles: { file: File; mediaFileReferenceId: string }[] = [];
    for (const field of sorted) {
      if (
        knownNames.has(field.name) ||
        field.type === "IMAGE" ||
        !hasValue(field.name)
      )
        continue;
      if (field.type === "GROUP" || field.type === "ITEM") {
        // CH-015's greening step: each addable entry names which registered
        // site it's for (see withPointSelectSubfield) — one AnchorPoint per
        // entry, its fields folded onto the point by name (matching
        // AnchorPoint.AreaGreened/SealedOrRemovedArea/SpeciesUsed/Species/
        // PlantingDate directly), instead of the flat, unscoped Measurement
        // array below, which has no way to say which registered point a
        // reading belongs to.
        const hasPointSelect = (field.fields ?? []).some(
          (sub) => sub.name === REGISTERED_POINT_FIELD_NAME,
        );
        if (hasPointSelect) {
          const rawEntries = Array.isArray(dynamicValues[field.name])
            ? (dynamicValues[field.name] as Record<string, unknown>[])
            : [];
          const anchorPoints: Record<string, unknown>[] = [];
          for (const entry of rawEntries) {
            const selectedName = entry[REGISTERED_POINT_FIELD_NAME] as string | undefined;
            const point = (setupData?.anchorPoints ?? []).find((p) => p.name === selectedName);
            if (!point) continue;
            const mediaFileReferenceId = crypto.randomUUID();
            const out: Record<string, unknown> = {
              name: point.name,
              ...(point.location ? { location: point.location } : {}),
              mediaFileReferenceId,
            };
            for (const sub of field.fields ?? []) {
              if (sub.name === REGISTERED_POINT_FIELD_NAME) continue;
              const sv = entry[sub.name];
              if (sv === undefined || sv === null || sv === "") continue;
              if (sub.type === "IMAGE") {
                if (sv instanceof File) groupMediaFiles.push({ file: sv, mediaFileReferenceId });
                continue;
              }
              if (sub.type === "GROUP" || sub.type === "ITEM") {
                const nestedEntries = Array.isArray(sv) ? (sv as Record<string, unknown>[]) : [];
                const nestedNumberSubs = (sub.fields ?? []).filter(
                  (f) => f.type === "NUMBER" || f.type === "NUMERIC",
                );
                // Both greeningArea and species have exactly one NUMBER
                // subfield, so "has a NUMBER subfield" alone can't tell them
                // apart — a TEXT subfield (species' name/id) marks a genuine
                // per-record identity, same convention GroupField/
                // anchorPointToEntry use elsewhere to find an entry's title.
                const hasIdentity = (sub.fields ?? []).some((f) => f.type === "TEXT");
                if (nestedNumberSubs.length && !hasIdentity) {
                  // A per-entry area container (greeningArea): its own
                  // NUMBER subfields become their own flat Measurement,
                  // named after the subfield — matching the point's
                  // dedicated AreaGreened/SealedOrRemovedArea fields
                  for (const nestedEntry of nestedEntries) {
                    for (const nSub of nestedNumberSubs) {
                      const nv = nestedEntry[nSub.name];
                      if (nv === undefined || nv === null || nv === "") continue;
                      const unit =
                        (nestedEntry[`${nSub.name}__unit`] as string) ??
                        nSub.unitOfMeasureOptions?.[0]?.value ??
                        "SQM";
                      out[nSub.name] = {
                        value: (parseFloat(String(nv)) || 0) * (areaToSqm[unit] ?? 1),
                        unitOfMeasure: "m²",
                      };
                    }
                  }
                } else {
                  // A genuine repeating sub-entity (species): keep as an
                  // array — AnchorPoint.Species is []any, not a Measurement
                  out[sub.name] = nestedEntries
                    .map((ne) => {
                      const shaped: Record<string, unknown> = {};
                      for (const nSub of sub.fields ?? []) {
                        const nv = ne[nSub.name];
                        if (nv === undefined || nv === null || nv === "" || nSub.type === "IMAGE")
                          continue;
                        shaped[nSub.name] =
                          nSub.type === "NUMBER" || nSub.type === "NUMERIC"
                            ? parseFloat(String(nv)) || 0
                            : nv;
                      }
                      return shaped;
                    })
                    .filter((s) => Object.keys(s).length > 0);
                }
                continue;
              }
              if (sub.type === "NUMBER" || sub.type === "NUMERIC") {
                const unit =
                  (entry[`${sub.name}__unit`] as string) ??
                  sub.unitOfMeasureOptions?.[0]?.value ??
                  "";
                out[sub.name] = { value: parseFloat(String(sv)) || 0, unitOfMeasure: unit };
                continue;
              }
              // Route every other scalar (DATE in particular) through
              // shapeFieldValue instead of passing the raw form value —
              // plantingDate otherwise rode through as the bare "YYYY-MM-DD"
              // string the <input type="date"> produces, which the BE's
              // RFC3339 time.Parse rejects ("cannot parse "" as "T"").
              const shapedSv = shapeFieldValue(sub, sv, undefined);
              if (shapedSv !== undefined) out[sub.name] = shapedSv;
            }
            anchorPoints.push(out);
          }
          if (anchorPoints.length) rawFields["anchorPoints"] = anchorPoints;
          continue;
        }
        const numberSubs = (field.fields ?? []).filter(
          (f) => f.type === "NUMBER" || f.type === "NUMERIC",
        );
        const speciesSub = (field.fields ?? []).find(
          (f) => normalizeFieldName(f.name) === "SPECIESUSED",
        );
        const rawEntries = Array.isArray(dynamicValues[field.name])
          ? (dynamicValues[field.name] as Record<string, unknown>[])
          : [];
        const measurements: Record<string, unknown>[] = [];
        for (const entry of rawEntries) {
          const mediaFileReferenceId = crypto.randomUUID();
          const species = speciesSub ? entry[speciesSub.name] : undefined;
          for (const sub of field.fields ?? []) {
            if (sub.type === "IMAGE") {
              const sv = entry[sub.name];
              if (sv instanceof File) groupMediaFiles.push({ file: sv, mediaFileReferenceId });
              continue;
            }
            if (!numberSubs.includes(sub)) continue;
            const sv = entry[sub.name];
            if (sv === undefined || sv === null || sv === "") continue;
            const unit =
              (entry[`${sub.name}__unit`] as string) ??
              sub.unitOfMeasureOptions?.[0]?.value ??
              "";
            measurements.push({
              value: parseFloat(String(sv)) || 0,
              unitOfMeasure: unit,
              siUnit: unitToSiUnit[unit] ?? unit,
              description: sub.name,
              ...(species ? { speciesUsed: species } : {}),
            });
          }
        }
        if (measurements.length) rawFields[field.name] = measurements;
        continue;
      }
      if (
        (field.type === "NUMBER" || field.type === "NUMERIC") &&
        field.unitOfMeasureOptions?.length
      ) {
        const unit =
          (dynamicValues[`${field.name}__unit`] as string) ??
          field.unitOfMeasureOptions[0].value;
        rawFields[field.name] = {
          value: parseFloat(dynamicValues[field.name] as string) || 0,
          unit,
        };
      } else {
        rawFields[field.name] = dynamicValues[field.name];
      }
    }

    // A top-level IMAGE field (older templates) or a GROUP/ITEM-nested one
    // (CH-015's current template) can supply the legacy single mediaFile
    // part (still the only file the BE reads today); every uploaded file,
    // including that same one, also travels in mediaFiles tagged by its own
    // mediaFileReferenceId — mirrors buildDynamicPayload's assembly.
    const topLevelImageField = stepForm?.find((f) => f.type === "IMAGE");
    const topLevelImageValue = topLevelImageField
      ? dynamicValues[topLevelImageField.name]
      : undefined;
    const topLevelMediaFile =
      topLevelImageValue instanceof File ? topLevelImageValue : undefined;
    const mediaFile = topLevelMediaFile ?? groupMediaFiles[0]?.file;
    const mediaFiles = topLevelMediaFile
      ? [{ file: topLevelMediaFile, mediaFileReferenceId: crypto.randomUUID() }, ...groupMediaFiles]
      : groupMediaFiles;

    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: vhUnit === "H" ? "hours" : vhUnit.toLowerCase(),
      siUnit: "TIME",
    };
    const data = {
      ...rawFields,
      ...(measurement ? { measurement } : {}),
      description,
    };
    return {
      payload: {
        stepId: stepMeta.stepId,
        activity: stepMeta.activity,
        stepNumber: stepMeta.stepNumber,
        stepType: stepMeta.stepType,
        challengeCode: challenge.challengeCode,
        challengeId: challenge.challengeId,
        circleId: challenge.circleId,
        thingId: challenge.challengeId,
        thingUUID: challenge.id,
        submittedBy: user.id,
        approvalRequired: false,
        volunteerHours,
        contributors,
        // data: already fully inside dataEnvelope — uncomment to send both
        // data,
        dataEnvelope: { ...data, volunteerHours, contributors },
      },
      mediaFile,
      mediaFiles,
    };
  };

  // Anchor-point registration steps (CH-001, CH-008A/B): the setup endpoint
  // expects camelCase data keys — anchorPoints[{name, location, measurement}]
  // — and drops the raw ANCHOR_POINT group shape entirely. Template fields the
  // builder doesn't consume (e.g. SOURCE_TYPE, DATE_REGISTERED) pass through
  // into data under their raw names.
  const buildAnchorSetupPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");

    const tempUnitLabels: Record<string, string> = { C: "°C", F: "°F", K: "K" };

    const vhValue = parseFloat(dynamicValues[vhFieldName] as string) || 0;
    const vhUnit = (dynamicValues[`${vhFieldName}__unit`] as string) ?? "H";
    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: vhUnit === "H" ? "hours" : vhUnit.toLowerCase(),
      siUnit: "TIME",
    };

    const groupField = stepForm?.find((f) => f.type === "GROUP");
    const subFields = groupField?.fields ?? [];
    const nameSub = subFields.find((f) => f.type === "TEXT");
    const locSub = subFields.find((f) => f.type === "LOCATION");
    // Only a single NUMBER subfield with no dedicated Go struct slot of its
    // own (CH-001's temperature) is the point's one generic reading —
    // capacity/waterLevelReading have their own slot, so they pass through
    // the generic subfield loop below under their own name instead.
    const numberSubFields = subFields.filter(
      (f) => f.type === "NUMBER" || f.type === "NUMERIC",
    );
    const tempSub =
      numberSubFields.length === 1 &&
      !DEDICATED_MEASUREMENT_NAMES.has(normalizeFieldName(numberSubFields[0].name))
        ? numberSubFields[0]
        : undefined;

    const entries =
      groupField && Array.isArray(dynamicValues[groupField.name])
        ? (dynamicValues[groupField.name] as Record<string, unknown>[])
        : [];

    // A GROUP subfield of type IMAGE (CH-008A's referenceImage, CH-008C's
    // installationPhoto, CH-010's mediaFile) isn't a top-level field —
    // collected here, tagged with its point's mediaFileReferenceId, so it
    // can travel as its own multipart part (see extraMediaFiles below)
    // instead of only the first one surviving as the legacy mediaFile part
    const pointMediaFiles: { file: File; mediaFileReferenceId: string }[] = [];
    const anchorPoints: ChallengeSetupAnchorPoint[] = entries
      .map((entry) => {
        const point: ChallengeSetupAnchorPoint = {
          name: nameSub ? ((entry[nameSub.name] as string) ?? "") : "",
        };
        // Generated up front so it can tag both the point's own photo (if
        // any, found in the subfield loop below) and its nested location
        const mediaFileReferenceId = crypto.randomUUID();
        point.mediaFileReferenceId = mediaFileReferenceId;
        const location = locSub
          ? (entry[locSub.name] as ChallengeSetupLocation | undefined)
          : undefined;
        if (location) point.location = { ...location, mediaFileReferenceId };
        const tempRaw = tempSub ? entry[tempSub.name] : undefined;
        if (
          tempSub &&
          tempRaw !== undefined &&
          tempRaw !== null &&
          tempRaw !== ""
        ) {
          const unit =
            (entry[`${tempSub.name}__unit`] as string) ??
            tempSub.unitOfMeasureOptions?.[0]?.value ??
            // CH-001 anchor readings are temperatures; CH-008 subs (capacity,
            // baseline reading) declare no unit — don't mislabel them °C
            (challenge.challengeCode === "CH-001" ? "C" : "");
          point.measurement = {
            value: parseFloat(tempRaw as string) || 0,
            unitOfMeasure: tempUnitLabels[unit] ?? unit,
          };
        }
        // Remaining subfields (sourceType, confirm, …) pass through shaped —
        // the BE drops keys its AnchorPoint struct lacks, but they persist
        // the moment the struct fields land
        for (const sub of subFields) {
          if (sub === nameSub || sub === locSub || sub === tempSub) continue;
          const sv = entry[sub.name];
          if (sv instanceof File) {
            if (sub.type === "IMAGE")
              pointMediaFiles.push({ file: sv, mediaFileReferenceId });
            continue;
          }
          // An untouched resumed IMAGE (see anchorPointToEntry) is still the
          // mediaFile object as received — send it back as-is rather than
          // dropping it, or the BE nulls the point's photo on resubmit.
          if (sub.type === "IMAGE" && sv && typeof sv === "object") {
            (point as Record<string, unknown>)[sub.name] = sv;
            continue;
          }
          if (sv === undefined || sv === null || sv === "") continue;
          const subUnit =
            (entry[`${sub.name}__unit`] as string) ??
            sub.unitOfMeasureOptions?.[0]?.value;
          const shaped = shapeFieldValue(sub, sv, subUnit);
          if (shaped !== undefined)
            (point as Record<string, unknown>)[sub.name] = shaped;
        }
        return point;
      })
      .filter((p) => p.name || p.location || p.measurement);

    // Addable LOCATION fields (CH-009's "address") are arrays — they pass
    // through the extras loop as data.addresses instead
    const locationField = stepForm?.find(
      (f) => f.type === "LOCATION" && !f.addableInput,
    );
    const rawLocation = locationField
      ? (dynamicValues[locationField.name] as ChallengeSetupLocation | undefined)
      : undefined;
    const location = rawLocation ? withMediaFileReferenceId(rawLocation) : undefined;

    const weatherField = stepForm?.find((f) => f.name.toUpperCase().includes("WEATHER"));
    const weatherRaw = weatherField
      ? dynamicValues[weatherField.name]
      : undefined;
    const weatherCondition =
      weatherRaw !== undefined && weatherRaw !== null && weatherRaw !== ""
        ? String(weatherRaw)
        : undefined;

    // A top-level IMAGE field (CH-001's mediaFile) or a GROUP-nested one
    // (CH-008A/C, CH-010) supplies the legacy single mediaFile part (still
    // the only file the BE reads today); every uploaded file, including
    // that same one, also travels in mediaFiles tagged by its own
    // mediaFileReferenceId, ready for whenever the BE reads more than one.
    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const topLevelMediaFile = imageField
      ? (dynamicValues[imageField.name] as File | undefined)
      : undefined;
    const mediaFile = topLevelMediaFile ?? pointMediaFiles[0]?.file;
    const mediaFiles = topLevelMediaFile
      ? [
          {
            file: topLevelMediaFile,
            mediaFileReferenceId: location?.mediaFileReferenceId ?? crypto.randomUUID(),
          },
          ...pointMediaFiles,
        ]
      : pointMediaFiles;

    // Fields not consumed above (CH-008: SOURCE_TYPE, DATE_REGISTERED,
    // NETWORK_HOUSEHOLD_COUNT, PRIORITY_LIST_EXISTS, …) pass through under
    // their raw names. No-op for CH-001 — its form has no extra fields.
    const consumed = new Set(
      [
        groupField?.name,
        locationField?.name,
        weatherField?.name,
        imageField?.name,
        vhFieldName,
        contribFieldName,
      ].filter((n): n is string => !!n),
    );
    const extraFields: Record<string, unknown> = {};
    for (const field of stepForm ?? []) {
      if (consumed.has(field.name) || !field.name) continue;
      const val = dynamicValues[field.name];
      if (val === undefined || val === null || val === "" || val instanceof File) continue;
      const unit =
        (dynamicValues[`${field.name}__unit`] as string) ??
        field.unitOfMeasureOptions?.[0]?.value;
      // Shape to the BE Data struct types (CH-009: vulnerableMembers /
      // assignedVolunteers are Measurements, CH-008A: dateRegistered is a
      // timestamp) — raw strings fail the whole parse
      const shaped =
        field.addableInput && Array.isArray(val)
          ? val
              .filter((v) => v !== undefined && v !== null && v !== "")
              .map((v) => shapeFieldValue(field, v, unit))
              .filter((v) => v !== undefined)
          : shapeFieldValue(field, val, unit);
      if (shaped === undefined || (Array.isArray(shaped) && !shaped.length))
        continue;
      extraFields[toDataKey(field.name, shaped)] = shaped;
    }

    const contributors = Array.isArray(dynamicValues[contribFieldName])
      ? (dynamicValues[contribFieldName] as string[])
      : [];
    // BE Data struct now has separate Location and Region slots — key off
    // the template's own field name (CH-001/007/008B/009: "region";
    // CH-008A/010: "location") instead of always writing "location"
    const locationKey = locationField
      ? toDataKey(locationField.name, location)
      : "location";
    const data = {
      ...extraFields,
      volunteerHours,
      ...(weatherCondition ? { weatherCondition } : {}),
      ...(location ? { [locationKey]: location } : {}),
      anchorPoints,
    };
    const payload: CH001SetupPayload = {
      stepId: stepMeta.stepId,
      activity: stepMeta.activity,
      stepNumber: stepMeta.stepNumber,
      stepType: stepMeta.stepType,
      challengeCode: challenge.challengeCode,
      challengeId: challenge.challengeId,
      thingId: challenge.challengeId,
      circleId: challenge.circleId,
      submittedBy: user.id,
      volunteerHours,
      contributors,
      // data: already fully inside dataEnvelope — uncomment to send both
      // data,
      dataEnvelope: { ...data, contributors },
    };

    return { payload, mediaFile, mediaFiles };
  };

  // CH-002 step 1 only: registers the fixed observation point via the
  // multipart /challengeSetup endpoint — camelCase data keys (location,
  // capturedAt, weatherCondition) plus the baseline image as mediaFile.
  const buildCH002SetupPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");

    const vhValue = parseFloat(dynamicValues[vhFieldName] as string) || 0;
    const vhUnit = (dynamicValues[`${vhFieldName}__unit`] as string) ?? "H";
    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: vhUnit === "H" ? "hours" : vhUnit.toLowerCase(),
      siUnit: "TIME",
    };

    const locationField = stepForm?.find((f) => f.type === "LOCATION");
    const rawLocation = locationField
      ? (dynamicValues[locationField.name] as
          | ChallengeSetupLocation
          | undefined)
      : undefined;
    const location = rawLocation ? withMediaFileReferenceId(rawLocation) : undefined;

    const weatherField = stepForm?.find((f) => f.name.toUpperCase().includes("WEATHER"));
    const weatherRaw = weatherField
      ? dynamicValues[weatherField.name]
      : undefined;
    const weatherCondition =
      weatherRaw !== undefined && weatherRaw !== null && weatherRaw !== ""
        ? String(weatherRaw)
        : undefined;

    const dateField = stepForm?.find((f) => f.type === "DATE");
    const dateRaw = dateField
      ? (dynamicValues[dateField.name] as string | undefined)
      : undefined;
    const capturedAt = dateRaw
      ? new Date(dateRaw).toISOString()
      : new Date().toISOString();

    // The "anchorPoint" GROUP (addable) holds one entry per registered
    // point — name/location/direction/framing note plus its own baseline
    // photo. Mirrors buildAnchorSetupPayload's shaping: name/location
    // subfields are consumed directly, everything else (metaData, notes)
    // passes through shaped under its own name onto the AnchorPoint struct.
    const groupField = stepForm?.find((f) => f.type === "GROUP");
    const subFields = groupField?.fields ?? [];
    const nameSub = subFields.find((f) => f.type === "TEXT");
    const locSub = subFields.find((f) => f.type === "LOCATION");
    const groupEntries =
      groupField && Array.isArray(dynamicValues[groupField.name])
        ? (dynamicValues[groupField.name] as Record<string, unknown>[])
        : [];
    const pointMediaFiles: { file: File; mediaFileReferenceId: string }[] = [];
    const anchorPoints: ChallengeSetupAnchorPoint[] = groupEntries
      .map((entry) => {
        const point: ChallengeSetupAnchorPoint = {
          name: nameSub ? ((entry[nameSub.name] as string) ?? "") : "",
        };
        const mediaFileReferenceId = crypto.randomUUID();
        point.mediaFileReferenceId = mediaFileReferenceId;
        const entryLocation = locSub
          ? (entry[locSub.name] as ChallengeSetupLocation | undefined)
          : undefined;
        if (entryLocation) point.location = { ...entryLocation, mediaFileReferenceId };
        for (const sub of subFields) {
          if (sub === nameSub || sub === locSub) continue;
          const sv = entry[sub.name];
          if (sub.type === "IMAGE") {
            if (sv instanceof File)
              pointMediaFiles.push({ file: sv, mediaFileReferenceId });
            continue;
          }
          if (sv === undefined || sv === null || sv === "") continue;
          const subUnit =
            (entry[`${sub.name}__unit`] as string) ??
            sub.unitOfMeasureOptions?.[0]?.value;
          const shaped = shapeFieldValue(sub, sv, subUnit);
          if (shaped !== undefined)
            (point as Record<string, unknown>)[sub.name] = shaped;
        }
        return point;
      })
      .filter((p) => p.name || p.location);

    // Older templates put the baseline image in a top-level IMAGE field;
    // the current one nests it inside each anchor point entry instead. The
    // legacy mediaFile part still only ever carries one — every uploaded
    // file, including that same one, also travels in mediaFiles tagged by
    // its own mediaFileReferenceId.
    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const imageValue = imageField ? dynamicValues[imageField.name] : undefined;
    const topLevelMediaFile = imageValue instanceof File ? imageValue : undefined;
    const mediaFile = topLevelMediaFile ?? pointMediaFiles[0]?.file;
    const mediaFiles = topLevelMediaFile
      ? [
          {
            file: topLevelMediaFile,
            mediaFileReferenceId: location?.mediaFileReferenceId ?? crypto.randomUUID(),
          },
          ...pointMediaFiles,
        ]
      : pointMediaFiles;

    const contributors = Array.isArray(dynamicValues[contribFieldName])
      ? (dynamicValues[contribFieldName] as string[])
      : [];
    const data = {
      volunteerHours,
      capturedAt,
      ...(weatherCondition ? { weatherCondition } : {}),
      ...(location ? { location } : {}),
      anchorPoints,
    };
    const payload: CH001SetupPayload = {
      stepId: stepMeta.stepId,
      activity: stepMeta.activity,
      stepNumber: stepMeta.stepNumber,
      stepType: stepMeta.stepType,
      challengeCode: challenge.challengeCode,
      challengeId: challenge.challengeId,
      thingId: challenge.challengeId,
      circleId: challenge.circleId,
      submittedBy: user.id,
      volunteerHours,
      contributors,
      // data: already fully inside dataEnvelope — uncomment to send both
      // data,
      dataEnvelope: { ...data, contributors },
    };

    return { payload, mediaFile, mediaFiles };
  };

  // Steps that re-measure a point registered during setup (setup-update):
  // one submission = one observation of one point. The point's name and
  // location pass through unchanged (placeId is the identity); only the
  // measurement and risk flag are new.
  const buildSetupUpdatePayload = (setupStep: DerivedStep) => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");

    const pointsField = setupStep.fields[0];
    const entry = dynamicValues[pointsField.name] as SetupUpdateEntry | undefined;
    const point = (setupStep.anchorPoints ?? []).find(
      (p) => p.name === entry?.selected,
    );
    if (!point) throw new Error("No observation point selected");

    const vhValue = parseFloat(dynamicValues[vhFieldName] as string) || 0;
    const vhUnit = (dynamicValues[`${vhFieldName}__unit`] as string) ?? "H";
    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: vhUnit === "H" ? "hours" : vhUnit.toLowerCase(),
      siUnit: "TIME",
    };

    // Generated fresh per submission (not carried over from the registered
    // point) so this reading's own photo, if any, can be correlated to it —
    // same idiom as the registration builder's per-entry stamping.
    const mediaFileReferenceId = crypto.randomUUID();
    const anchorPoint: Record<string, unknown> = {
      name: point.name,
      ...(point.location ? { location: point.location } : {}),
      higherRiskFlag: entry?.higherRiskFlag ?? point.higherRiskFlag ?? false,
      mediaFileReferenceId,
    };

    // Inline per-point fields (CH-001/CH-008A wrapper shape) live in
    // entry.values; the older promoted-screen fields (CH-008B/CH-002/CH-010)
    // live in the shared dynamicValues bag. A single NUMBER field among the
    // inline ones is the point's one generic reading — BE has one
    // Measurement slot per point for templates with no dedicated field of
    // their own (temperature, water level, …) — so it's read separately
    // below (data.measurement) rather than through the name-keyed loop.
    // Several NUMBER fields (CH-008B's litres collected/distributed,
    // households, …) means a structured report instead: each field has its
    // own dedicated slot in the Go Data struct, so none of them are treated
    // as the generic reading — all go through the name-keyed loop by their
    // own field name.
    const inlineDetailFields = setupStep.detailFields ?? [];
    const inlineNumberFields = inlineDetailFields.filter(
      (f) => f.type === "NUMBER" || f.type === "NUMERIC",
    );
    const primaryField =
      inlineNumberFields.length === 1 &&
      !DEDICATED_MEASUREMENT_NAMES.has(normalizeFieldName(inlineNumberFields[0].name))
        ? inlineNumberFields[0]
        : undefined;
    const promotedDetailFields = derivedConfig?.anchorDetailFields ?? [];
    const detailFields = [...inlineDetailFields, ...promotedDetailFields];
    const detailNames = new Set(detailFields.map((f) => f.name));
    const consumed = new Set(
      [
        setupStep.fields.map((f) => f.name),
        primaryField?.name,
        vhFieldName,
        contribFieldName,
      ]
        .flat()
        .filter((n): n is string => !!n),
    );
    const extraData: Record<string, unknown> = {};
    let detailImage: File | undefined;
    for (const field of [...detailFields, ...(stepForm ?? [])]) {
      if (!field.name || consumed.has(field.name)) continue;
      if (!detailNames.has(field.name) && field.type === "GROUP") continue;
      // Inline per-point fields (and their __unit companions) live in
      // entry.values; everything else in the shared dynamicValues bag
      const bag = inlineDetailFields.includes(field) ? entry?.values : dynamicValues;
      const val = bag?.[field.name];
      if (val === undefined || val === null || val === "") continue;
      if (field.type === "IMAGE" || val instanceof File) {
        if (!detailImage && val instanceof File) detailImage = val;
        continue;
      }
      const unit =
        (bag?.[`${field.name}__unit`] as string) ??
        field.unitOfMeasureOptions?.[0]?.value;
      const shaped = shapeFieldValue(field, val, unit);
      if (shaped === undefined) continue;
      if (ANCHOR_POINT_DATA_NAMES.has(normalizeFieldName(field.name))) {
        anchorPoint[field.name] = shaped;
      } else {
        extraData[toDataKey(field.name, val)] = shaped;
      }
      consumed.add(field.name);
    }

    // Submitting via the mark-complete screen implies the flag itself
    // (BE Data.Confirm / Data.Completed)
    if (shouldMarkComplete) {
      const completionDetail = [...detailFields, ...(stepForm ?? [])].find(
        (f) => COMPLETION_NAMES.has(normalizeFieldName(f.name)),
      );
      if (completionDetail) extraData[completionDetail.name] = true;
    }

    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const mediaFile =
      (imageField
        ? (dynamicValues[imageField.name] as File | undefined)
        : undefined) ?? detailImage;
    // Tagged with the same id stamped onto anchorPoint above, so this
    // reading's photo can be correlated back to the point it belongs to
    const mediaFiles = mediaFile ? [{ file: mediaFile, mediaFileReferenceId }] : [];

    const contributors = Array.isArray(dynamicValues[contribFieldName])
      ? (dynamicValues[contribFieldName] as string[])
      : [];
    const data = {
      ...extraData,
      anchorPoint: anchorPoint as unknown as ChallengeSetupAnchorPoint,
      capturedAt: new Date().toISOString(),
      // Selection-only steps (CH-008B/C, CH-010) log no new reading — the
      // hours/detail screens carry the data
      ...(setupStep.selectionOnly || !primaryField
        ? {}
        : {
            measurement: {
              value: parseFloat((entry?.values?.[primaryField.name] as string) ?? "") || 0,
              // °C is CH-001's temperature default; other codes (CH-008A
              // water levels) inherit the unit stored on the registered point
              unitOfMeasure:
                point.measurement?.unitOfMeasure ??
                (challenge.challengeCode === "CH-001" ? "°C" : ""),
            },
          }),
      volunteerHours,
    };
    const payload: SetupUpdateEvidencePayload = {
      stepId: stepMeta.stepId,
      activity: stepMeta.activity,
      stepNumber: stepMeta.stepNumber,
      stepType: stepMeta.stepType,
      challengeCode: challenge.challengeCode,
      challengeId: challenge.challengeId,
      thingId: challenge.challengeId,
      circleId: challenge.circleId,
      submittedBy: user.id,
      volunteerHours,
      contributors,
      // data: already fully inside dataEnvelope — uncomment to send both
      // data,
      dataEnvelope: { ...data, contributors },
    };

    return { payload, mediaFile, mediaFiles };
  };

  const buildDynamicPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");
    // buildCH015Payload only applies to the evidence-logging steps (it
    // flattens every GROUP field, including a literal "anchorPoint" group,
    // into Data.Measurement-shaped entries under the field's raw name). Step
    // 1 (setupAndRegistration) needs the generic registration shape below —
    // an "anchorPoints" array — or the site's estimatedPlantingArea group
    // gets sent as a bogus singular "anchorPoint" measurement array instead.
    if (
      challenge.challengeCode === "CH-015" &&
      normalizeFieldName(stepMeta.stepType) !== "REGISTRATION"
    )
      return buildCH015Payload();

    const vhValue = parseFloat(dynamicValues[vhFieldName] as string) || 0;
    const vhUnit = (dynamicValues[`${vhFieldName}__unit`] as string) ?? "H";
    const contributors = Array.isArray(dynamicValues[contribFieldName])
      ? (dynamicValues[contribFieldName] as string[])
      : [];

    // Same flattening deriveWizardConfig applies for rendering (unwraps the
    // typeless wrapper / splices a LOCATION-with-nested-fields, e.g. CH-016's
    // "Choose site location") — collection must agree with what was
    // actually rendered, or spliced-in fields (species, mediaFile, …) would
    // be silently dropped here even though the user filled them in.
    const normalizedStepForm = preNormalizeAnchorFields(stepForm ?? [], anchorPointTracking);

    // The mark-complete screen consumes the completion flag field — matched
    // by normalized name (CONFIRM_COMPLETION, confirm, completed, …)
    const completionField = normalizedStepForm.find((f) =>
      COMPLETION_NAMES.has(normalizeFieldName(f.name)),
    );
    const knownNames = new Set(
      [vhFieldName, contribFieldName, completionField?.name].filter(
        (n): n is string => !!n,
      ),
    );

    const unitToSiUnit: Record<string, string> = {
      kg: "MASS",
      lb: "MASS",
      g: "MASS",
      L: "VOLUME",
      ml: "VOLUME",
      H: "TIME",
      hours: "TIME",
      SQM: "AREA",
      SQFT: "AREA",
      ACRES: "AREA",
      HECTARES: "AREA",
    };

    // Multiple anchor points are only ever registered at once on the
    // registration step — later steps select one already-registered point
    // and log a single reading against it (per Tshaks, BE 2026-08-02), so
    // the anchorPoints-array shaping below only applies here. stepType isn't
    // a reliable "is this registration" signal by itself — many templates
    // give step 1 its own descriptive stepType (CH-013's
    // "biodiversityRegistration", CH-012's "setup") instead of the literal
    // "registration" this check expects, which silently sent a singular
    // anchorPoint object on CH-013's actual setup submission. isSetupStep
    // (array position, not label) is the same signal LogEvidenceWizard
    // already trusts elsewhere for this — OR it in as a fallback so a step 1
    // still counts as registration even when its stepType doesn't say so.
    const isRegistrationStep =
      normalizeFieldName(stepMeta.stepType) === "REGISTRATION" || isSetupStep;

    const rawFields: Record<string, unknown> = {};
    // GROUP subfields of type IMAGE (e.g. CH-007's anchorPoint.mediaFile)
    // aren't a top-level field — collected here, always tagged with the
    // owning entry's mediaFileReferenceId, so each entry's photo can travel
    // as its own multipart part instead of only the first one surviving as
    // the legacy mediaFile part
    const groupMediaFiles: { file: File; mediaFileReferenceId: string }[] = [];
    for (const field of normalizedStepForm) {
      if (knownNames.has(field.name)) continue;
      if (field.type === "IMAGE") continue;
      const val = dynamicValues[field.name];
      if (val === undefined || val === null || val === "") continue;

      // GROUP/ITEM fields hold an array of sub-form entry objects. A
      // sub-field can itself be a GROUP/ITEM (CH-011's species inside
      // anchorPoint, CH-019's trees, CH-008B's anchorPointA) — shapeEntry
      // recurses so a nested leaf (e.g. species.quantity, a NUMBER) still
      // gets BE-typed instead of riding through as raw form-state string.
      if (field.type === "GROUP" || field.type === "ITEM") {
        const shapeEntry = (
          subFields: ApiTemplateFormField[],
          entry: Record<string, unknown>,
          mediaFileReferenceId: string,
        ): Record<string, unknown> => {
          const out: Record<string, unknown> = {};
          for (const sub of subFields) {
            const sv = entry[sub.name];
            if (sv === undefined || sv === null || sv === "") continue;
            if (sv instanceof File) {
              if (sub.type === "IMAGE")
                groupMediaFiles.push({ file: sv, mediaFileReferenceId });
              continue;
            }
            if (sub.type === "GROUP" || sub.type === "ITEM") {
              // Each nested entry (e.g. a species inside an anchor point)
              // gets its own id, not the parent's — otherwise its photo is
              // tagged with the same mediaFileReferenceId as the parent
              // entry and its location, the nested entry has no id of its
              // own to be matched against, and the photo is unrecoverable
              // once the BE round-trips it (silently dropped or misattributed
              // to the parent).
              const nested = (Array.isArray(sv) ? (sv as Record<string, unknown>[]) : [])
                .map((nestedEntry) => {
                  const nestedMediaFileReferenceId = crypto.randomUUID();
                  const nestedShaped = shapeEntry(
                    sub.fields ?? [],
                    nestedEntry,
                    nestedMediaFileReferenceId,
                  );
                  if (Object.keys(nestedShaped).length)
                    nestedShaped.mediaFileReferenceId = nestedMediaFileReferenceId;
                  return nestedShaped;
                })
                .filter((nestedEntry) => Object.keys(nestedEntry).length > 0);
              if (nested.length) out[sub.name] = nested;
              continue;
            }
            const subUnit =
              (entry[`${sub.name}__unit`] as string) ??
              sub.unitOfMeasureOptions?.[0]?.value;
            const shaped = shapeFieldValue(sub, sv, subUnit);
            if (shaped === undefined) continue;
            out[sub.name] =
              sub.type === "LOCATION"
                ? {
                    ...(shaped as ChallengeSetupLocation),
                    mediaFileReferenceId,
                  }
                : shaped;
          }
          return out;
        };
        // CH-011/CH-015: withPointSelectSubfield spliced a synthetic
        // point-choice field onto this GROUP — each entry names which
        // registered point it's logged against, rather than the whole GROUP
        // being one single-point re-measurement.
        const hasPointSelect = (field.fields ?? []).some(
          (sub) => sub.name === REGISTERED_POINT_FIELD_NAME,
        );
        const realSubFields = hasPointSelect
          ? (field.fields ?? []).filter((sub) => sub.name !== REGISTERED_POINT_FIELD_NAME)
          : (field.fields ?? []);

        // Same id on the entry, its nested location, and its own photo —
        // one physical photo per entry, correlated on all three (BE commit
        // fbdb11e added mediaFileReferenceId to AnchorPoint/Location/Plant/
        // Item alike, so every GROUP/ITEM entry gets one, not just anchor
        // points)
        const entries = (
          Array.isArray(val) ? (val as Record<string, unknown>[]) : []
        )
          .map((entry) => {
            const mediaFileReferenceId = crypto.randomUUID();
            const shaped = shapeEntry(realSubFields, entry, mediaFileReferenceId);
            if (Object.keys(shaped).length) shaped.mediaFileReferenceId = mediaFileReferenceId;
            if (hasPointSelect) {
              const selectedName = entry[REGISTERED_POINT_FIELD_NAME] as string | undefined;
              const point = (setupData?.anchorPoints ?? []).find((p) => p.name === selectedName);
              if (point) {
                shaped.name = point.name;
                if (point.location) shaped.location = point.location;
              }
            }
            return shaped;
          })
          .filter((entry) => Object.keys(entry).length > 0);
        if (entries.length) {
          if (
            normalizeFieldName(field.name) === "ANCHORPOINT" &&
            (isRegistrationStep || hasPointSelect)
          ) {
            // On registration, every anchor-point challenge sends
            // Data.AnchorPoints as an array, even for a single registered
            // point — matching buildAnchorSetupPayload's shape. Same array
            // shape for a later addable+point-select step (CH-011): each
            // entry is its own AnchorPoint reading against a different
            // registered point, not one single-struct re-measurement.
            rawFields["anchorPoints"] = entries;
          } else if (normalizeFieldName(field.name) === "ANCHORPOINT") {
            // Later steps select one already-registered point and log a
            // single reading against it — keep the original single-struct
            // shape.
            rawFields[field.name] = entries[0];
          } else {
            rawFields[field.name] = entries;
          }
        }
        continue;
      }

      // Real Files travel as the multipart mediaFile part, never in data
      if (val instanceof File) continue;

      const unit =
        (dynamicValues[`${field.name}__unit`] as string) ??
        field.unitOfMeasureOptions?.[0]?.value;

      // A plain, non-addable LOCATION field named "anchorPoint" (CH-014/
      // CH-017's single-region registration) still submits as a one-entry
      // Data.AnchorPoints array on the registration step — never a bare
      // object — matching the GROUP case above. Later steps (if this shape
      // ever recurs there) keep the plain single-object form.
      if (
        field.type === "LOCATION" &&
        !field.addableInput &&
        normalizeFieldName(field.name) === "ANCHORPOINT"
      ) {
        const shaped = shapeFieldValue(field, val, unit);
        if (shaped !== undefined) {
          const withRef = withMediaFileReferenceId(
            shaped as ChallengeSetupLocation,
          );
          rawFields[isRegistrationStep ? "anchorPoints" : field.name] = isRegistrationStep
            ? [withRef]
            : withRef;
        }
        continue;
      }

      // Addable fields hold an array of entries — send one item per entry
      if (field.addableInput && Array.isArray(val)) {
        const entries = (
          val
            .filter((v) => v !== undefined && v !== null && v !== "")
            .map((v) => shapeFieldValue(field, v, unit))
            .filter((v) => v !== undefined) as unknown[]
        ).map((v) =>
          field.type === "LOCATION"
            ? withMediaFileReferenceId(v as ChallengeSetupLocation)
            : v,
        );
        if (!entries.length) continue;
        rawFields[toDataKey(field.name, entries)] = entries;
      } else {
        const shaped = shapeFieldValue(field, val, unit);
        if (shaped === undefined) continue;
        rawFields[toDataKey(field.name, val)] =
          field.type === "LOCATION"
            ? withMediaFileReferenceId(shaped as ChallengeSetupLocation)
            : shaped;
      }
    }

    // Build data in the expected shape
    const data: Record<string, unknown> = {};

    const measurementKey = Object.keys(rawFields).find(
      (k) => normalizeFieldName(k) === "MEASUREMENT",
    );
    const measurementRaw = measurementKey
      ? (rawFields[measurementKey] as { value: number; unitOfMeasure?: string })
      : undefined;
    if (measurementKey && measurementRaw) {
      const mUnit = measurementRaw.unitOfMeasure ?? "";
      data.measurement = {
        value: measurementRaw.value,
        unitOfMeasure: mUnit,
        siUnit: unitToSiUnit[mUnit] ?? mUnit,
      };
      delete rawFields[measurementKey];
    }

    // Map any field whose name contains "description" to data.description
    const descKey = Object.keys(rawFields).find((k) =>
      k.toUpperCase().includes("DESCRIPTION"),
    );
    if (descKey !== undefined) {
      data.description = rawFields[descKey];
      delete rawFields[descKey];
    }

    // Merge remaining fields directly into data
    Object.assign(data, rawFields);

    // Submitting via the mark-complete screen implies the flag itself
    // (BE Data.Confirm / Data.Completed)
    if (completionField && shouldMarkComplete) {
      data[completionField.name] = true;
    }

    // First IMAGE (or FILE) field becomes the media file. In view/edit mode
    // the value can be the already-uploaded URL string — only a fresh File is
    // sendable. Some templates (CH-007) nest the image inside a GROUP entry
    // instead of a top-level field — fall back to the first one found there.
    const imageField =
      normalizedStepForm.find((f) => f.type === "IMAGE") ??
      normalizedStepForm.find((f) => f.type === "FILE");
    const imageValue = imageField ? dynamicValues[imageField.name] : undefined;
    const topLevelMediaFile = imageValue instanceof File ? imageValue : undefined;
    const mediaFile = topLevelMediaFile ?? groupMediaFiles[0]?.file;
    // Every uploaded file, each tagged with its own mediaFileReferenceId —
    // sent alongside (not instead of) the legacy single mediaFile part
    const mediaFiles = topLevelMediaFile
      ? [{ file: topLevelMediaFile, mediaFileReferenceId: crypto.randomUUID() }, ...groupMediaFiles]
      : groupMediaFiles;

    const unitLabel = vhUnit === "H" ? "hours" : vhUnit.toLowerCase();
    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: unitLabel,
      siUnit: "TIME",
    };

    return {
      payload: {
        stepId: stepMeta.stepId,
        activity: stepMeta.activity,
        stepNumber: stepMeta.stepNumber,
        stepType: stepMeta.stepType,
        challengeCode: challenge.challengeCode,
        challengeId: challenge.challengeId,
        circleId: challenge.circleId,
        thingId: challenge.challengeId,
        thingUUID: challenge.id,
        submittedBy: user.id,
        approvalRequired: false,
        volunteerHours,
        contributors,
        // data: already fully inside dataEnvelope — uncomment to send both
        // data,
        dataEnvelope: { ...data, volunteerHours, contributors },
      },
      mediaFile,
      mediaFiles,
    };
  };

  // ── Submission ─────────────────────────────────────────────────────────────
  const onSuccess = (data?: SubmitEvidenceResponse) => {
    localStorage.removeItem(STORAGE_KEY(stepId));
    setImpactMessage(data?.impactSummary?.impact?.summary ?? null);
    if (shouldMarkComplete && stepMeta && challenge) {
      markStepComplete.mutate({
        challengeId: challenge.challengeId,
        step: {
          stepNumber: stepMeta.stepNumber,
          stepType: stepMeta.stepType,
          stepId: stepMeta.stepId,
          title: stepMeta.title,
          description: stepMeta.description,
          isCompleted: true,
        },
      });
    }
    setSubmitted(true);
  };

  // Picks the right payload builder for the current step and how it should
  // be sent — the single source of truth for both the actual submit() and
  // the review-screen payload preview below, so they can never drift apart.
  const resolveSubmission = (): {
    payload: unknown;
    mediaFile?: File;
    mediaFiles?: { file: File; mediaFileReferenceId: string }[];
    transport: "registration" | "evidence" | "evidence-multipart" | "update";
  } => {
    if (!user) throw new Error("Not authenticated");
    if (!challenge) throw new Error("Challenge not loaded");
    if (!stepMeta) throw new Error("Step not found in challenge");

    // ── Dynamic path ───────────────────────────────────────────────────────
    if (isDerived) {
      // Anchor-point templates register step 1 via the multipart
      // /challengeSetup endpoint, not /submit{code}. Keyed on stepType — the
      // registration stepId varies per template (SETUP_AND_REGISTRATION,
      // CIRCLE_FORMATION, …)
      if (
        [
          "CH-001",
          "CH-007",
          "CH-008A",
          "CH-008B",
          "CH-008C",
          "CH-009",
          "CH-010",
          "CH-010A",
          "CH-010B",
        ].includes(challenge.challengeCode) &&
        normalizeFieldName(stepMeta.stepType) === "REGISTRATION"
      ) {
        const { payload, mediaFile, mediaFiles } = buildAnchorSetupPayload();
        return { payload, mediaFile, mediaFiles, transport: "registration" };
      }

      // CH-002 step 1 registers the observation point via /challengeSetup
      // (its registration stepId differs from CH-001's SETUP_AND_REGISTRATION)
      if (
        challenge.challengeCode === "CH-002" &&
        normalizeFieldName(stepMeta.stepType) === "REGISTRATION"
      ) {
        const { payload, mediaFile, mediaFiles } = buildCH002SetupPayload();
        return { payload, mediaFile, mediaFiles, transport: "registration" };
      }

      // Every other REGISTRATION step also submits via /challengeSetup,
      // including CH-004/CH-015. stepType alone isn't reliable here — see
      // the matching comment on buildDynamicPayload's isRegistrationStep —
      // so fall back to isSetupStep (array position) for templates that
      // give step 1 its own descriptive stepType instead of "registration"
      // (CH-013's "biodiversityRegistration", CH-012's "setup"), which
      // otherwise fell through to the generic /submit{code} evidence path
      // below and never populated submittedSetupDetail correctly.
      if (normalizeFieldName(stepMeta.stepType) === "REGISTRATION" || isSetupStep) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { payload, mediaFile, mediaFiles } = buildDynamicPayload() as any;
        return { payload, mediaFile, mediaFiles, transport: "registration" };
      }

      // Setup-update steps resend the setup data shape as multipart
      if (setupUpdateStep) {
        const { payload, mediaFile, mediaFiles } = buildSetupUpdatePayload(setupUpdateStep);
        return { payload, mediaFile, mediaFiles, transport: "evidence-multipart" };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { payload, mediaFile, mediaFiles } = buildDynamicPayload() as any;
      // These endpoints parse multipart only (metadata part + optional
      // mediaFile — see guardians-api GetMetadataFromForm/FormValue +
      // GetFileFromForm).
      const MULTIPART_CODES = [
        "CH-001",
        "CH-002",
        "CH-004",
        "CH-007",
        "CH-008A",
        "CH-008B",
        "CH-008C",
        "CH-009",
        "CH-010",
        "CH-010A",
        "CH-010B",
        "CH-011",
        "CH-012A",
        "CH-012B",
        "CH-013",
        "CH-014",
        "CH-015",
        "CH-016",
        "CH-017",
        "CH-018",
        "CH-019",
      ];
      const asMultipart = MULTIPART_CODES.includes(challenge.challengeCode);
      return {
        payload,
        mediaFile,
        mediaFiles,
        transport: asMultipart ? "evidence-multipart" : "evidence",
      };
    }

    // ── Static path ────────────────────────────────────────────────────────
    if (isRegistrationStep) {
      return {
        payload: buildRegistrationPayload(),
        mediaFile: form.evidenceFiles[0],
        transport: "registration",
      };
    }

    return {
      payload: buildPayload(),
      transport: viewId && !isViewMode ? "update" : "evidence",
    };
  };

  const submit = () => {
    if (!user) throw new Error("Not authenticated");
    if (!challenge) throw new Error("Challenge not loaded");
    if (!stepMeta) throw new Error("Step not found in challenge");
    // Re-entry guard: a click can land before the pending state disables the button
    if (
      submitRegistration.isPending ||
      submitEvidence.isPending ||
      updateEvidence.isPending
    )
      return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { payload, mediaFile, mediaFiles, transport } = resolveSubmission() as any;

    if (transport === "registration") {
      submitRegistration.mutate(
        {
          challengeCode: challenge.challengeCode,
          challengeId: challenge.challengeId,
          stepId: stepMeta.stepId,
          userId: user.id,
          payload,
          mediaFile,
          mediaFiles,
        },
        { onSuccess: () => onSuccess() },
      );
      return;
    }

    if (transport === "update") {
      updateEvidence.mutate(
        {
          evidenceId: viewId!,
          challengeId: challenge.challengeId,
          stepId: stepMeta.stepId,
          userId: user.id,
          payload,
        },
        {
          onSuccess: (data) => {
            localStorage.removeItem(STORAGE_KEY(stepId));
            setImpactMessage(data?.impactSummary?.impact?.summary ?? null);
            setSubmitted(true);
          },
        },
      );
      return;
    }

    submitEvidence.mutate(
      {
        challengeCode: challenge.challengeCode,
        challengeId: challenge.challengeId,
        stepId: stepMeta.stepId,
        userId: user.id,
        payload,
        ...(transport === "evidence-multipart"
          ? { multipart: true, mediaFile, mediaFiles }
          : {}),
      },
      { onSuccess },
    );
  };

  // Debug aid: log the payload that would be submitted as soon as the
  // review screen is reached, so it can be inspected before clicking
  // upload. Reuses the exact same builder selection as submit() via
  // resolveSubmission() — never mutates, just computes and logs.
  useEffect(() => {
    if (currentStep?.kind !== "review" || !challenge || !stepMeta || !user)
      return;
    try {
      const { payload } = resolveSubmission();
      // eslint-disable-next-line no-console
      console.log("[LogEvidenceWizard] payload preview (review screen):", payload);
    } catch (err) {
      // Required fields not filled in yet — nothing meaningful to preview
      // eslint-disable-next-line no-console
      console.log("[LogEvidenceWizard] payload preview unavailable:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.kind, dynamicValues, form]);

  // ── Error ──────────────────────────────────────────────────────────────────
  const submitError = submitRegistration.isError
    ? submitRegistration.error instanceof Error
      ? submitRegistration.error.message
      : t("submissionFailed")
    : submitEvidence.isError
      ? submitEvidence.error instanceof Error
        ? submitEvidence.error.message
        : t("submissionFailed")
      : updateEvidence.isError
        ? updateEvidence.error instanceof Error
          ? updateEvidence.error.message
          : t("updateFailed")
        : null;

  // Block render while redirect is pending for unauthorised non-view access
  if (challenge && !canEdit && !viewId) return null;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <WizardSuccessScreen
        title={
          viewId && !isViewMode ? t("activityUpdated") : t("activityUploaded")
        }
        subtitle={
          impactMessage ??
          (viewId && !isViewMode
            ? t("activityUpdatedSubtitle")
            : t("activityUploadedSubtitle"))
        }
        onDone={() => router.push(`/challenges/${challengeId}`)}
      />
    );
  }

  const isPending =
    submitRegistration.isPending ||
    submitEvidence.isPending ||
    updateEvidence.isPending;
  const currentKind = currentStep?.kind;

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <WizardHeader
        step={step}
        total={totalSteps}
        onBack={back}
        onClose={close}
        onGoToStep={isViewMode ? undefined : setStep}
      />

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* ── Dynamic steps (BE-derived config) ─────────────────────────── */}
        {isDerived &&
          derivedConfig &&
          (() => {
            const ds = derivedConfig.steps[step - 1];
            if (!ds) return null;

            if (ds.kind === "dynamic") {
              const showResumeHint =
                isSetupStep &&
                existingAnchorPoints.length > 0 &&
                ds.fields.some((f) => f.type === "GROUP");
              return (
                <DynamicFieldsStep
                  fields={ds.fields}
                  values={dynamicValues}
                  update={updateDynamic}
                  onNext={next}
                  nextLabel={nextLabel}
                  disabledFields={disabledFields}
                  disabledHint={t("oneMeasurementHint")}
                  resumeHint={showResumeHint ? t("resumeAnchorPointsHint") : undefined}
                />
              );
            }

            if (ds.kind === "setup-update") {
              return (
                <SetupUpdateStep
                  pointsField={ds.fields[0]}
                  flagField={ds.fields[1]}
                  detailFields={ds.detailFields}
                  anchorPoints={ds.anchorPoints ?? []}
                  values={dynamicValues}
                  update={updateDynamic}
                  onNext={next}
                  nextLabel={nextLabel}
                  selectionOnly={ds.selectionOnly}
                />
              );
            }

            if (ds.kind === "volunteer-hours") {
              return (
                <VolunteerHoursStep
                  form={bridgeForm}
                  update={updateBridge}
                  onNext={next}
                  nextLabel={nextLabel}
                />
              );
            }

            if (ds.kind === "contributors") {
              return (
                <ContributorsStep
                  form={bridgeForm}
                  update={updateBridge}
                  onNext={next}
                  nextLabel={nextLabel}
                  members={members}
                  users={users}
                />
              );
            }

            if (ds.kind === "mark-complete") {
              const completionField = ds.fields[0];
              // CH-008B: the switch logs whether the installation is done,
              // it is not a precondition for logging today's volunteer
              // hours — so it should not block the button, and the button
              // reads "Continue" rather than "Mark Complete".
              const isCH008B = challenge?.challengeCode === "CH-008B";
              return (
                <MarkCompleteStep
                  field={completionField}
                  checked={!!dynamicValues[completionField.name]}
                  onToggle={() =>
                    updateDynamic(
                      completionField.name,
                      !dynamicValues[completionField.name],
                    )
                  }
                  onSubmit={submit}
                  isPending={isPending}
                  blockOnToggle={!isCH008B}
                  buttonLabel={isCH008B ? tCommon("continue") : undefined}
                />
              );
            }

            if (ds.kind === "review") {
              return (
                <ReviewStep
                  form={bridgeForm}
                  stepTypes={[]}
                  onDelete={() => {
                    setDynamicValues({});
                    setStep(1);
                  }}
                  onUpload={submit}
                  onGoToStep={isViewMode ? handleGoToStep : setStep}
                  isPending={isPending}
                  error={submitError}
                  users={users}
                  readOnly={isViewMode}
                  canEdit={isViewMode ? false : canEdit}
                  isLoading={isViewLoading}
                  uploadLabel={
                    viewId && !isViewMode ? t("update") : t("upload")
                  }
                  dynamicConfig={{
                    // Fields consumed by the setup-update screen render via
                    // setupUpdate rows instead; an adopted anchor-reference
                    // GROUP is replaced by its promoted detail fields.
                    // Normalized the same way deriveWizardConfig/
                    // activityToDynamic are, so a non-tracking step's
                    // typeless "anchorPoint" wrapper (e.g. CH-004, reused
                    // purely for BE payload shaping) yields its flattened
                    // fields (measurement, description) here too, instead of
                    // the raw wrapper the loop below can't render.
                    fields: [
                      ...preNormalizeAnchorFields(
                        stepForm ?? [],
                        anchorPointTracking,
                      ).filter(
                        (f) =>
                          !setupUpdateStep?.fields.some(
                            (sf) => sf.name === f.name,
                          ) &&
                          !(
                            setupUpdateStep &&
                            f.type === "GROUP" &&
                            normalizeFieldName(f.name) === "ANCHORPOINT"
                          ),
                      ),
                      ...(derivedConfig.anchorDetailFields ?? []),
                    ],
                    values: dynamicValues,
                    fieldToStepIndex: derivedConfig.fieldToStepIndex,
                    setupUpdate: setupUpdateStep
                      ? {
                          label: setupUpdateStep.fields[0].label,
                          stepIndex:
                            derivedConfig.fieldToStepIndex[
                              setupUpdateStep.fields[0].name
                            ] ?? 1,
                          ...(() => {
                            const entry = dynamicValues[
                              setupUpdateStep.fields[0].name
                            ] as SetupUpdateEntry | undefined;
                            const point = (
                              setupUpdateStep.anchorPoints ?? []
                            ).find((p) => p.name === entry?.selected);
                            const detailFields = setupUpdateStep.detailFields ?? [];
                            // See buildSetupUpdatePayload: a single NUMBER
                            // field is the point's one generic reading;
                            // several means a structured report where every
                            // field keeps its own label instead.
                            const numberFields = detailFields.filter(
                              (f) => f.type === "NUMBER" || f.type === "NUMERIC",
                            );
                            const primaryField =
                              numberFields.length === 1 &&
                              !DEDICATED_MEASUREMENT_NAMES.has(
                                normalizeFieldName(numberFields[0].name),
                              )
                                ? numberFields[0]
                                : undefined;
                            // One row per detail field with a value — not just
                            // the primary reading, since a wrapper can carry
                            // several (weather, photo, date, …)
                            const detailRows = detailFields.flatMap(
                              (f): SetupUpdateRow[] => {
                                const val = entry?.values?.[f.name];
                                if (val === undefined || val === null || val === "") return [];
                                if (f.type === "IMAGE") {
                                  return [{ label: f.label, image: val as File | string }];
                                }
                                const unit =
                                  f === primaryField
                                    ? (point?.measurement?.unitOfMeasure ??
                                      f.unitOfMeasureOptions?.[0]?.value)
                                    : ((entry?.values?.[`${f.name}__unit`] as string | undefined) ??
                                      f.unitOfMeasureOptions?.[0]?.value);
                                const displayValue =
                                  f.type === "NUMBER" || f.type === "NUMERIC"
                                    ? `${val} ${unit ?? ""}`.trim()
                                    : String(val);
                                return [{ label: f.label, value: displayValue }];
                              },
                            );
                            if (!point) {
                              if (!detailRows.length)
                                return { entryTitle: "", rows: [] };
                              return { entryTitle: entry?.selected ?? "", rows: detailRows };
                            }
                            return {
                              entryTitle: point.name,
                              rows: [
                                ...(point.location?.formattedAddress
                                  ? [
                                      {
                                        label: t("locationLabel"),
                                        value: point.location.formattedAddress,
                                      },
                                    ]
                                  : []),
                                ...detailRows,
                              ],
                            };
                          })(),
                        }
                      : undefined,
                  }}
                />
              );
            }

            return null;
          })()}

        {/* ── Static steps (known stepFormConfig) ───────────────────────── */}
        {!isDerived && (
          <>
            {currentKind === "site-details" && (
              <SiteDetailsStep form={form} update={update} onNext={next} />
            )}
            {currentKind === "location-photos" && (
              <LocationPhotosStep form={form} update={update} onNext={next} />
            )}
            {currentKind === "site-condition" && (
              <SiteConditionStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
              />
            )}
            {currentKind === "interventions" && (
              <InterventionsStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
              />
            )}
            {currentKind === "metrics" && (
              <MetricsStep onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "file-upload" && (
              <FileUploadStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
              />
            )}
            {currentKind === "impact" && (
              <ImpactStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
              />
            )}
            {currentKind === "volunteer-hours" && (
              <VolunteerHoursStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
              />
            )}
            {currentKind === "measurement" && (
              <MeasurementStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
              />
            )}
            {currentKind === "region" && (
              <RegionStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
              />
            )}
            {currentKind === "contributors" && (
              <ContributorsStep
                form={form}
                update={update}
                onNext={next}
                nextLabel={nextLabel}
                members={members}
                users={users}
              />
            )}
            {currentKind === "mark-complete" && (
              <MarkCompleteStep onSubmit={submit} isPending={isPending} />
            )}
            {currentKind === "review" && (
              <ReviewStep
                form={form}
                stepTypes={staticConfig?.wizardSteps.map((s) => s.type) ?? []}
                onDelete={() => {
                  setForm(
                    isRegistrationStep
                      ? { ...initForm(), measurementType: "AREA" }
                      : initForm(),
                  );
                  setStep(1);
                }}
                onUpload={submit}
                onGoToStep={isViewMode ? handleGoToStep : setStep}
                isPending={isPending}
                error={submitError}
                users={users}
                readOnly={isViewMode}
                canEdit={isViewMode ? false : canEdit}
                isLoading={isViewLoading}
                uploadLabel={viewId && !isViewMode ? t("update") : t("upload")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
