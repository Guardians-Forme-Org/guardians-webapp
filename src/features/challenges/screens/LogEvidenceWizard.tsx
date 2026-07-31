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
import type { ApiRecentActivity } from "@/lib/types/circles";
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
  shapeFieldValue,
  toDataKey,
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

// dataEnvelope is being rolled out BE-side field by field — merge it over
// `data` rather than picking one bag wholesale, so fields still missing from
// dataEnvelope (e.g. mediaFiles) keep falling back to `data`.
function mergeActivityData(activity: ApiRecentActivity): ApiRecentActivity["data"] {
  return { ...activity.data, ...activity.dataEnvelope };
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
  const fields = stepForm ?? [];

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
          if (isValueUnit(v)) {
            out[k] = String(v.value);
            out[`${k}__unit`] = valueUnitOf(v);
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
  } else if (data.measurement) {
    // data.measurement belongs to the first free numeric field, or the
    // legacy MEASUREMENT name when the template has none
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
          if (isNumberSub && isValueUnit(raw)) {
            entry[sub.name] = String(raw.value);
            entry[`${sub.name}__unit`] = valueUnitOf(raw);
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
  // data.mediaFiles can contain URL-less placeholders (extra photos the FE
  // couldn't upload — see buildCH015Payload) ahead of the real one, so find
  // the first entry that actually has a url rather than assuming index 0.
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
    // current template nests each photo inside a GROUP instead — fall back
    // to the first GROUP with an IMAGE subfield so the photo shows *somewhere*
    // (the BE only tracks one url per submission today, so which group it
    // truly came from can't be recovered)
    const imgField = fields.find((f) => f.type === "IMAGE");
    if (imgField && result[imgField.name] === undefined) {
      result[imgField.name] = firstMediaFile.url;
    } else if (!imgField) {
      const groupWithImage = fields.find(
        (f) => f.type === "GROUP" && f.fields?.some((s) => s.type === "IMAGE"),
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

  const stepForm =
    (stepMeta?.form?.length ? stepMeta.form : null) ??
    templateStep?.form ??
    null;

  // BE form takes precedence over FE config whenever form fields are present.
  const isDerived = !!stepForm?.length;

  // Setup-step data (anchor points) feeds the update screens of later steps —
  // never the setup step itself
  const setupDetail = challenge?.submittedSetupDetail;
  const setupData =
    setupDetail && stepMeta && setupDetail.stepId !== stepMeta.stepId
      ? setupDetail.data
      : undefined;

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
  // actually been submitted. Setup is whichever step sits first in
  // challengeSteps (array position, not a stepNumber/stepType field).
  const isSetupStep = challenge?.challengeSteps?.[0]?.stepId === stepId;
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
      contributors: (dynamicValues[contribFieldName] as string[]) ?? [],
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
      thingUUID: challenge.impactRecords?.[0]?.thingUUID ?? "",
      submittedBy: user.id,
      approvalRequired: false,
      volunteerHours,
      contributors: form.contributors,
      data,
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
        ? {
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
          }
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
      data,
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
    const contributors = (dynamicValues[contribFieldName] as string[]) ?? [];
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
    // GROUP subfields of type IMAGE (CH-015 nests each group's photo inside
    // it, rather than a single top-level IMAGE field) — collected here so
    // the BE's single-file submission still gets one, and any extra isn't
    // silently dropped
    const groupMediaFiles: File[] = [];
    for (const field of sorted) {
      if (
        knownNames.has(field.name) ||
        field.type === "IMAGE" ||
        !hasValue(field.name)
      )
        continue;
      if (field.type === "GROUP") {
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
          const species = speciesSub ? entry[speciesSub.name] : undefined;
          for (const sub of field.fields ?? []) {
            if (sub.type === "IMAGE") {
              const sv = entry[sub.name];
              if (sv instanceof File) groupMediaFiles.push(sv);
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

    // A top-level IMAGE field (older templates) or a GROUP-nested one
    // (CH-015's current template) can supply the media file — the BE only
    // accepts one per submission today, so send the first found that way;
    // any extra is stashed under data.mediaFiles (no uploaded URL yet, but
    // at least the filename/type isn't silently lost)
    const topLevelImageField = stepForm?.find((f) => f.type === "IMAGE");
    const topLevelMediaFile = topLevelImageField
      ? (dynamicValues[topLevelImageField.name] as File | undefined)
      : undefined;
    const allMediaFiles = topLevelMediaFile
      ? [topLevelMediaFile, ...groupMediaFiles]
      : groupMediaFiles;
    const [mediaFile, ...extraMediaFiles] = allMediaFiles;

    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: vhUnit === "H" ? "hours" : vhUnit.toLowerCase(),
      siUnit: "TIME",
    };
    const data = {
      ...rawFields,
      ...(measurement ? { measurement } : {}),
      ...(extraMediaFiles.length
        ? {
            mediaFiles: extraMediaFiles.map((f) => ({
              type: f.type,
              description: f.name,
            })),
          }
        : {}),
      description,
    };
    return {
      payload: {
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
        contributors,
        data,
        dataEnvelope: { ...data, volunteerHours, contributors },
      },
      mediaFile,
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
    // collected here so a File nested inside an entry still becomes the
    // submission's multipart mediaFile instead of being silently dropped
    const groupMediaFiles: File[] = [];
    const anchorPoints: ChallengeSetupAnchorPoint[] = entries
      .map((entry) => {
        const point: ChallengeSetupAnchorPoint = {
          name: nameSub ? ((entry[nameSub.name] as string) ?? "") : "",
        };
        const location = locSub
          ? (entry[locSub.name] as ChallengeSetupLocation | undefined)
          : undefined;
        if (location) point.location = location;
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
            if (sub.type === "IMAGE") groupMediaFiles.push(sv);
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
    const location = locationField
      ? (dynamicValues[locationField.name] as
          | ChallengeSetupLocation
          | undefined)
      : undefined;

    const weatherField = stepForm?.find((f) => f.name.toUpperCase().includes("WEATHER"));
    const weatherRaw = weatherField
      ? dynamicValues[weatherField.name]
      : undefined;
    const weatherCondition =
      weatherRaw !== undefined && weatherRaw !== null && weatherRaw !== ""
        ? String(weatherRaw)
        : undefined;

    // A top-level IMAGE field (CH-001's mediaFile) or a GROUP-nested one
    // (CH-008A/C, CH-010) can supply the media file — only one can travel
    // per submission today, so send the first found either way.
    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const topLevelMediaFile = imageField
      ? (dynamicValues[imageField.name] as File | undefined)
      : undefined;
    const mediaFile = topLevelMediaFile ?? groupMediaFiles[0];

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

    const contributors = (dynamicValues[contribFieldName] as string[]) ?? [];
    const data = {
      ...extraFields,
      volunteerHours,
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
      data,
      dataEnvelope: { ...data, contributors },
    };

    return { payload, mediaFile };
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
    const location = locationField
      ? (dynamicValues[locationField.name] as
          | ChallengeSetupLocation
          | undefined)
      : undefined;

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
    const groupMediaFiles: File[] = [];
    const anchorPoints: ChallengeSetupAnchorPoint[] = groupEntries
      .map((entry) => {
        const point: ChallengeSetupAnchorPoint = {
          name: nameSub ? ((entry[nameSub.name] as string) ?? "") : "",
        };
        const entryLocation = locSub
          ? (entry[locSub.name] as ChallengeSetupLocation | undefined)
          : undefined;
        if (entryLocation) point.location = entryLocation;
        for (const sub of subFields) {
          if (sub === nameSub || sub === locSub) continue;
          const sv = entry[sub.name];
          if (sub.type === "IMAGE") {
            if (sv instanceof File) groupMediaFiles.push(sv);
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
    // the current one nests it inside each anchor point entry instead —
    // only one file can travel per submission today, so send the first
    // found either way.
    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const imageValue = imageField ? dynamicValues[imageField.name] : undefined;
    const topLevelMediaFile = imageValue instanceof File ? imageValue : undefined;
    const mediaFile = topLevelMediaFile ?? groupMediaFiles[0];

    const contributors = (dynamicValues[contribFieldName] as string[]) ?? [];
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
      data,
      dataEnvelope: { ...data, contributors },
    };

    return { payload, mediaFile };
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

    const anchorPoint: Record<string, unknown> = {
      name: point.name,
      ...(point.location ? { location: point.location } : {}),
      higherRiskFlag: entry?.higherRiskFlag ?? point.higherRiskFlag ?? false,
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

    const contributors = (dynamicValues[contribFieldName] as string[]) ?? [];
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
      data,
      dataEnvelope: { ...data, contributors },
    };

    return { payload, mediaFile };
  };

  const buildDynamicPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");
    if (challenge.challengeCode === "CH-015") return buildCH015Payload();

    const vhValue = parseFloat(dynamicValues[vhFieldName] as string) || 0;
    const vhUnit = (dynamicValues[`${vhFieldName}__unit`] as string) ?? "H";
    const contributors = (dynamicValues[contribFieldName] as string[]) ?? [];

    // The mark-complete screen consumes the completion flag field — matched
    // by normalized name (CONFIRM_COMPLETION, confirm, completed, …)
    const completionField = (stepForm ?? []).find((f) =>
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

    const rawFields: Record<string, unknown> = {};
    // GROUP subfields of type IMAGE (e.g. CH-007's anchorPoint.mediaFile)
    // aren't a top-level field — collected here so a File nested inside a
    // GROUP entry still becomes the submission's multipart mediaFile instead
    // of being silently dropped
    const groupMediaFiles: File[] = [];
    for (const field of stepForm ?? []) {
      if (knownNames.has(field.name)) continue;
      if (field.type === "IMAGE") continue;
      const val = dynamicValues[field.name];
      if (val === undefined || val === null || val === "") continue;

      // GROUP/ITEM fields hold an array of sub-form entry objects
      if (field.type === "GROUP" || field.type === "ITEM") {
        const entries = (
          Array.isArray(val) ? (val as Record<string, unknown>[]) : []
        )
          .map((entry) => {
            const out: Record<string, unknown> = {};
            for (const sub of field.fields ?? []) {
              const sv = entry[sub.name];
              if (sv === undefined || sv === null || sv === "") continue;
              if (sv instanceof File) {
                if (sub.type === "IMAGE") groupMediaFiles.push(sv);
                continue;
              }
              const subUnit =
                (entry[`${sub.name}__unit`] as string) ??
                sub.unitOfMeasureOptions?.[0]?.value;
              const shaped = shapeFieldValue(sub, sv, subUnit);
              if (shaped !== undefined) out[sub.name] = shaped;
            }
            return out;
          })
          .filter((entry) => Object.keys(entry).length > 0);
        if (entries.length) {
          // Data.AnchorPoint is a single struct, not an array — an unadopted
          // anchorPoint GROUP (nothing registered yet) sends its one entry
          rawFields[field.name] =
            normalizeFieldName(field.name) === "ANCHORPOINT"
              ? entries[0]
              : entries;
        }
        continue;
      }

      // Real Files travel as the multipart mediaFile part, never in data
      if (val instanceof File) continue;

      const unit =
        (dynamicValues[`${field.name}__unit`] as string) ??
        field.unitOfMeasureOptions?.[0]?.value;

      // Addable fields hold an array of entries — send one item per entry
      if (field.addableInput && Array.isArray(val)) {
        const entries = val
          .filter((v) => v !== undefined && v !== null && v !== "")
          .map((v) => shapeFieldValue(field, v, unit))
          .filter((v) => v !== undefined);
        if (!entries.length) continue;
        rawFields[toDataKey(field.name, entries)] = entries;
      } else {
        const shaped = shapeFieldValue(field, val, unit);
        if (shaped !== undefined) rawFields[toDataKey(field.name, val)] = shaped;
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
      stepForm?.find((f) => f.type === "IMAGE") ??
      stepForm?.find((f) => f.type === "FILE");
    const imageValue = imageField ? dynamicValues[imageField.name] : undefined;
    const mediaFile =
      (imageValue instanceof File ? imageValue : undefined) ??
      groupMediaFiles[0];

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
        thingUUID: challenge.impactRecords?.[0]?.thingUUID ?? "",
        submittedBy: user.id,
        approvalRequired: false,
        volunteerHours,
        contributors,
        data,
        dataEnvelope: { ...data, volunteerHours, contributors },
      },
      mediaFile,
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
        const { payload, mediaFile } = buildAnchorSetupPayload();
        return { payload, mediaFile, transport: "registration" };
      }

      // CH-002 step 1 registers the observation point via /challengeSetup
      // (its registration stepId differs from CH-001's SETUP_AND_REGISTRATION)
      if (
        challenge.challengeCode === "CH-002" &&
        normalizeFieldName(stepMeta.stepType) === "REGISTRATION"
      ) {
        const { payload, mediaFile } = buildCH002SetupPayload();
        return { payload, mediaFile, transport: "registration" };
      }

      // Every other REGISTRATION step also submits via /challengeSetup —
      // CH-004/CH-015 are the sole exception, since they have their own
      // dedicated /submit{code} handler rather than going through the
      // shared /challengeSetup route (see MULTIPART_CODES note below —
      // both are multipart, just not via /challengeSetup)
      if (
        normalizeFieldName(stepMeta.stepType) === "REGISTRATION" &&
        !["CH-004", "CH-015"].includes(challenge.challengeCode)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { payload, mediaFile } = buildDynamicPayload() as any;
        return { payload, mediaFile, transport: "registration" };
      }

      // Setup-update steps resend the setup data shape as multipart
      if (setupUpdateStep) {
        const { payload, mediaFile } = buildSetupUpdatePayload(setupUpdateStep);
        return { payload, mediaFile, transport: "evidence-multipart" };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { payload, mediaFile } = buildDynamicPayload() as any;
      // These endpoints parse multipart only (metadata part + optional
      // mediaFile — see guardians-api GetMetadataFromForm/FormValue +
      // GetFileFromForm).
      const MULTIPART_CODES = [
        "CH-001",
        "CH-002",
        "CH-004",
        "CH-008A",
        "CH-008B",
        "CH-008C",
        "CH-009",
        "CH-010",
        "CH-010A",
        "CH-010B",
        "CH-015",
      ];
      const asMultipart = MULTIPART_CODES.includes(challenge.challengeCode);
      return {
        payload,
        mediaFile,
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
    const { payload, mediaFile, transport } = resolveSubmission() as any;

    if (transport === "registration") {
      submitRegistration.mutate(
        {
          challengeCode: challenge.challengeCode,
          challengeId: challenge.challengeId,
          stepId: stepMeta.stepId,
          userId: user.id,
          payload,
          mediaFile,
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
        ...(transport === "evidence-multipart" ? { multipart: true, mediaFile } : {}),
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
              return (
                <DynamicFieldsStep
                  fields={ds.fields}
                  values={dynamicValues}
                  update={updateDynamic}
                  onNext={next}
                  nextLabel={nextLabel}
                  disabledFields={disabledFields}
                  disabledHint={t("oneMeasurementHint")}
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
                    // GROUP is replaced by its promoted detail fields
                    fields: [
                      ...(stepForm ?? []).filter(
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
