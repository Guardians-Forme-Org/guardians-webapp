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
  deriveWizardConfig,
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
import ReviewStep from "../wizard/steps/ReviewStep";
import SetupUpdateStep, { type SetupUpdateEntry } from "../wizard/steps/SetupUpdateStep";
import SiteConditionStep from "../wizard/steps/SiteConditionStep";
import SiteDetailsStep from "../wizard/steps/SiteDetailsStep";
import VolunteerHoursStep from "../wizard/steps/VolunteerHoursStep";
import { initForm, type LogFormData } from "../wizard/types";

const STORAGE_KEY = (stepId: string) => `log-evidence-draft-${stepId}`;

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
    const raw = data[field.name];
    if (raw === undefined || raw === null || raw === "") continue;

    if (field.type === "GROUP" && Array.isArray(raw)) {
      result[field.name] = (raw as Record<string, unknown>[]).map((entry) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(entry)) {
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
  // BASELINE_OBSERVATION shape) entry. A type-less field is the CH-008A/B
  // shape — deriveWizardConfig adopts it under the name "locations", so
  // mirror that key here.
  const pointsField =
    fields.find(
      (f) =>
        f.type === "SELECT" &&
        (f.name.toLowerCase() === "locations" ||
          normalizeFieldName(f.name) === "ANCHORPOINT"),
    ) ?? (fields.some((f) => !f.type) ? { name: "locations" } : undefined);
  if (pointsField && (data.anchorPoint || data.measurement)) {
    result[pointsField.name] = {
      selected: data.anchorPoint?.name ?? "",
      measurement: data.measurement?.value != null ? String(data.measurement.value) : "",
      higherRiskFlag: data.anchorPoint?.higherRiskFlag ?? false,
    };
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

  // Registered anchor points (setup steps) → the GROUP field's entries
  if (data.anchorPoints?.length) {
    const groupField = fields.find((f) => f.type === "GROUP");
    if (groupField && result[groupField.name] === undefined) {
      const subs = groupField.fields ?? [];
      const nameSub = subs.find((f) => f.type === "TEXT");
      const locSub = subs.find((f) => f.type === "LOCATION");
      const numSub = subs.find((f) => f.type === "NUMBER" || f.type === "NUMERIC");
      result[groupField.name] = data.anchorPoints.map((p) => {
        const entry: Record<string, unknown> = {};
        if (nameSub) entry[nameSub.name] = p.name;
        if (locSub && p.location) entry[locSub.name] = p.location;
        if (numSub && p.measurement) {
          entry[numSub.name] = String(p.measurement.value);
          entry[`${numSub.name}__unit`] = p.measurement.unitOfMeasure;
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
  const mediaFileSingle = data.mediaFile as
    | { url?: string }
    | { url?: string }[]
    | undefined;
  const firstMediaFile = data.mediaFiles?.length
    ? data.mediaFiles[0]
    : Array.isArray(mediaFileSingle)
      ? mediaFileSingle.length
        ? mediaFileSingle[0]
        : undefined
      : mediaFileSingle;
  if (firstMediaFile?.url) {
    const imgField = fields.find((f) => f.type === "IMAGE");
    if (imgField && result[imgField.name] === undefined) {
      result[imgField.name] = firstMediaFile.url;
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

  const derivedConfig: DerivedWizardConfig | null = useMemo(() => {
    if (!isDerived || !stepForm) return null;
    return deriveWizardConfig(stepForm, setupData, stepMeta?.stepType);
  }, [isDerived, stepForm, setupData, stepMeta?.stepType]);

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

  const isRegistrationStep = stepId === "SETUP_AND_REGISTRATION";

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
    // Exclude File values (not serializable)
    const serializable: DynamicValues = {};
    for (const [k, v] of Object.entries(dynamicValues)) {
      if (v instanceof File) continue;
      serializable[k] = v;
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
        ),
      );
    }
  }, [viewActivity, isDerived, vhFieldName, contribFieldName, stepForm]);

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
      SiUnit: "TIME",
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
    // pre-conversion). The API ignores these today but this preserves the
    // data for when it starts storing them.
    const rawFields: Record<string, unknown> = {};
    for (const field of sorted) {
      if (
        knownNames.has(field.name) ||
        field.type === "IMAGE" ||
        !hasValue(field.name)
      )
        continue;
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

    // First IMAGE field becomes the media file
    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const mediaFile = imageField
      ? (dynamicValues[imageField.name] as File | undefined)
      : undefined;

    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: vhUnit === "H" ? "hours" : vhUnit.toLowerCase(),
      SiUnit: "TIME",
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
    const tempSub = subFields.find(
      (f) => f.type === "NUMBER" || f.type === "NUMERIC",
    );

    const entries =
      groupField && Array.isArray(dynamicValues[groupField.name])
        ? (dynamicValues[groupField.name] as Record<string, unknown>[])
        : [];

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
          if (sv === undefined || sv === null || sv === "" || sv instanceof File)
            continue;
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

    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const mediaFile = imageField
      ? (dynamicValues[imageField.name] as File | undefined)
      : undefined;

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

    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const imageValue = imageField ? dynamicValues[imageField.name] : undefined;
    const mediaFile = imageValue instanceof File ? imageValue : undefined;

    const contributors = (dynamicValues[contribFieldName] as string[]) ?? [];
    const data = {
      volunteerHours,
      capturedAt,
      ...(weatherCondition ? { weatherCondition } : {}),
      ...(location ? { location } : {}),
      anchorPoints: [],
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

    const weatherField = stepForm?.find((f) => f.name.toUpperCase().includes("WEATHER"));
    const weatherRaw = weatherField
      ? dynamicValues[weatherField.name]
      : undefined;
    const weatherCondition =
      weatherRaw !== undefined && weatherRaw !== null && weatherRaw !== ""
        ? String(weatherRaw)
        : undefined;

    // Anchor-detail fields (promoted out of the reference GROUP) and template
    // fields not consumed above pass through shaped to the BE structs.
    // AnchorPoint-struct names nest under data.anchorPoint, the rest sit on
    // data; the first IMAGE among them becomes the multipart mediaFile.
    const detailFields = derivedConfig?.anchorDetailFields ?? [];
    const detailNames = new Set(detailFields.map((f) => f.name));
    const consumed = new Set(
      [
        setupStep.fields.map((f) => f.name),
        weatherField?.name,
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
      const val = dynamicValues[field.name];
      if (val === undefined || val === null || val === "") continue;
      if (field.type === "IMAGE" || val instanceof File) {
        if (!detailImage && val instanceof File) detailImage = val;
        continue;
      }
      const unit =
        (dynamicValues[`${field.name}__unit`] as string) ??
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
      ...(setupStep.selectionOnly
        ? {}
        : {
            measurement: {
              value: parseFloat(entry?.measurement ?? "") || 0,
              // °C is CH-001's temperature default; other codes (CH-008A
              // water levels) inherit the unit stored on the registered point
              unitOfMeasure:
                point.measurement?.unitOfMeasure ??
                (challenge.challengeCode === "CH-001" ? "°C" : ""),
            },
          }),
      volunteerHours,
      ...(weatherCondition ? { weatherCondition } : {}),
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
    for (const field of stepForm ?? []) {
      if (knownNames.has(field.name)) continue;
      if (field.type === "IMAGE") continue;
      const val = dynamicValues[field.name];
      if (val === undefined || val === null || val === "") continue;

      // GROUP fields hold an array of sub-form entry objects
      if (field.type === "GROUP") {
        const entries = (
          Array.isArray(val) ? (val as Record<string, unknown>[]) : []
        )
          .map((entry) => {
            const out: Record<string, unknown> = {};
            for (const sub of field.fields ?? []) {
              const sv = entry[sub.name];
              if (sv === undefined || sv === null || sv === "") continue;
              if (sv instanceof File) continue;
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
    // sendable.
    const imageField =
      stepForm?.find((f) => f.type === "IMAGE") ??
      stepForm?.find((f) => f.type === "FILE");
    const imageValue = imageField ? dynamicValues[imageField.name] : undefined;
    const mediaFile = imageValue instanceof File ? imageValue : undefined;

    const unitLabel = vhUnit === "H" ? "hours" : vhUnit.toLowerCase();
    const volunteerHours = {
      value: vhValue,
      unitOfMeasure: unitLabel,
      SiUnit: "TIME",
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

    // ── Dynamic path ───────────────────────────────────────────────────────
    if (isDerived) {
      // Anchor-point templates register step 1 via the multipart
      // /challengeSetup endpoint, not /submit{code}. Keyed on stepType — the
      // registration stepId varies per template (SETUP_AND_REGISTRATION,
      // CIRCLE_FORMATION, …)
      if (
        [
          "CH-001",
          "CH-008A",
          "CH-008B",
          "CH-008C",
          "CH-009",
          "CH-010",
          "CH-010A",
          "CH-010B",
        ].includes(challenge.challengeCode) &&
        stepMeta.stepType === "REGISTRATION"
      ) {
        const { payload, mediaFile } = buildAnchorSetupPayload();
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

      // CH-002 step 1 registers the observation point via /challengeSetup
      // (its registration stepId differs from CH-001's SETUP_AND_REGISTRATION)
      if (
        challenge.challengeCode === "CH-002" &&
        stepMeta.stepType === "REGISTRATION"
      ) {
        const { payload, mediaFile } = buildCH002SetupPayload();
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

      // Every other REGISTRATION step also submits via /challengeSetup —
      // CH-004/CH-015 are the sole exception, since they have their own
      // dedicated /submit{code} handler rather than going through the
      // shared /challengeSetup route (see MULTIPART_CODES note below —
      // both are multipart, just not via /challengeSetup)
      if (
        stepMeta.stepType === "REGISTRATION" &&
        !["CH-004", "CH-015"].includes(challenge.challengeCode)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { payload, mediaFile } = buildDynamicPayload() as any;
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

      // Setup-update steps resend the setup data shape as multipart
      if (setupUpdateStep) {
        const { payload, mediaFile } = buildSetupUpdatePayload(setupUpdateStep);
        submitEvidence.mutate(
          {
            challengeCode: challenge.challengeCode,
            challengeId: challenge.challengeId,
            stepId: stepMeta.stepId,
            userId: user.id,
            payload,
            mediaFile,
            multipart: true,
          },
          { onSuccess },
        );
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { payload, mediaFile } = buildDynamicPayload() as any;
      // These endpoints parse multipart only (metadata part + optional
      // mediaFile — see guardians-api GetMetadataFromForm/FormValue +
      // GetFileFromForm). CH-001 keeps the JSON body its handler accepts
      // (do not widen).
      const MULTIPART_CODES = [
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
      submitEvidence.mutate(
        {
          challengeCode: challenge.challengeCode,
          challengeId: challenge.challengeId,
          stepId: stepMeta.stepId,
          userId: user.id,
          payload,
          ...(asMultipart ? { multipart: true, mediaFile } : {}),
        },
        { onSuccess },
      );
      return;
    }

    // ── Static path ────────────────────────────────────────────────────────
    if (isRegistrationStep) {
      const payload = buildRegistrationPayload();
      submitRegistration.mutate(
        {
          challengeCode: challenge.challengeCode,
          challengeId: challenge.challengeId,
          stepId: stepMeta.stepId,
          userId: user.id,
          payload,
          mediaFile: form.evidenceFiles[0],
        },
        { onSuccess: () => onSuccess() },
      );
      return;
    }

    const payload = buildPayload();

    if (viewId && !isViewMode) {
      updateEvidence.mutate(
        {
          evidenceId: viewId,
          challengeId: challenge.challengeId,
          stepId: stepMeta.stepId,
          userId: user.id,
          payload,
        },
        {
          onSuccess: (data) => {
            setImpactMessage(data?.impactSummary?.impact?.summary ?? null);
            setSubmitted(true);
          },
        },
      );
    } else {
      submitEvidence.mutate(
        {
          challengeCode: challenge.challengeCode,
          challengeId: challenge.challengeId,
          stepId: stepMeta.stepId,
          userId: user.id,
          payload,
        },
        { onSuccess },
      );
    }
  };

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
              return <MarkCompleteStep onSubmit={submit} isPending={isPending} />;
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
                          rows: (() => {
                            const entry = dynamicValues[
                              setupUpdateStep.fields[0].name
                            ] as SetupUpdateEntry | undefined;
                            const point = (
                              setupUpdateStep.anchorPoints ?? []
                            ).find((p) => p.name === entry?.selected);
                            if (!point) {
                              // Older submissions carry only the measurement
                              if (!entry?.measurement) return [];
                              const unit =
                                setupUpdateStep.anchorPoints?.[0]?.measurement
                                  ?.unitOfMeasure ?? "";
                              return [`${entry.measurement} ${unit}`.trim()];
                            }
                            return [
                              [
                                point.name,
                                point.location?.formattedAddress,
                                entry?.measurement
                                  ? `${entry.measurement} ${point.measurement?.unitOfMeasure ?? ""}`.trim()
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · "),
                            ];
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
