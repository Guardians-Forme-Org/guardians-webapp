"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useChallenge, useTemplates, useSubmitEvidence, useSubmitRegistration, useUpdateEvidence, useMarkStepComplete, type SubmitEvidenceResponse, type CH001SetupPayload, type ChallengeSetupLocation, type ChallengeSetupAnchorPoint } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { EVIDENCE_SESSION_KEY } from "@/lib/hooks/activities";
import { computeChallengeRoles } from "@/lib/roles";
import { canManageCircle } from "@/lib/permissions";
import { STEP_FORM_CONFIGS, DEFAULT_FORM_CONFIG } from "../stepFormConfig";
import { deriveWizardConfig } from "../lib/deriveWizardConfig";
import type { DerivedWizardConfig } from "../lib/deriveWizardConfig";
import { WizardHeader } from "../wizard/shared";
import { initForm, type LogFormData } from "../wizard/types";
import type { DynamicValues } from "../wizard/steps/DynamicFieldsStep";
import type { ApiRecentActivity } from "@/lib/types/circles";
import SiteDetailsStep from "../wizard/steps/SiteDetailsStep";
import LocationPhotosStep from "../wizard/steps/LocationPhotosStep";
import SiteConditionStep from "../wizard/steps/SiteConditionStep";
import InterventionsStep from "../wizard/steps/InterventionsStep";
import MetricsStep from "../wizard/steps/MetricsStep";
import FileUploadStep from "../wizard/steps/FileUploadStep";
import ImpactStep from "../wizard/steps/ImpactStep";
import MeasurementStep from "../wizard/steps/MeasurementStep";
import VolunteerHoursStep from "../wizard/steps/VolunteerHoursStep";
import RegionStep from "../wizard/steps/RegionStep";
import ContributorsStep from "../wizard/steps/ContributorsStep";
import MarkCompleteStep from "../wizard/steps/MarkCompleteStep";
import ReviewStep from "../wizard/steps/ReviewStep";
import DynamicFieldsStep from "../wizard/steps/DynamicFieldsStep";
import WizardSuccessScreen from "@/components/ui/WizardSuccessScreen";

const STORAGE_KEY = (stepId: string) => `log-evidence-draft-${stepId}`;

function activityToForm(activity: ApiRecentActivity): LogFormData {
  const m = activity.data.measurement;
  const siUnit = (m?.siUnit ?? "").toUpperCase();
  return {
    ...initForm(),
    measurementValue: m?.value != null ? String(m.value) : "",
    measurementType: siUnit === "VOLUME" ? "VOLUME" : "MASS",
    impactDescription: activity.data.description ?? "",
    volunteerHours: activity.volunteerHours?.value != null ? String(activity.volunteerHours.value) : "",
    contributors: activity.contributors,
  };
}

function activityToDynamic(
  activity: ApiRecentActivity,
  vhFieldName: string,
  contribFieldName: string,
  stepForm?: import("@/lib/types/challenges").ApiTemplateFormField[] | null,
): DynamicValues {
  const result: DynamicValues = {};

  // New shape: data.measurement + data.description
  if (activity.data.measurement) {
    result["MEASUREMENT"] = String(activity.data.measurement.value);
    result["MEASUREMENT__unit"] = activity.data.measurement.unitOfMeasure;
  }

  if (activity.data.description !== undefined) {
    const descField = stepForm?.find((f) => f.name.includes("DESCRIPTION"));
    result[descField?.name ?? "ACTIVITY_DESCRIPTION"] = activity.data.description;
  }

  // Legacy shape: data.fields
  for (const [key, val] of Object.entries(activity.data.fields ?? {})) {
    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      "value" in val &&
      "unit" in val
    ) {
      result[key] = String((val as { value: number }).value);
      result[`${key}__unit`] = (val as { unit: string }).unit;
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

export default function LogEvidenceWizard({ challengeId, stepId, viewId }: Props) {
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

  const stepForm = (stepMeta?.form?.length ? stepMeta.form : null) ?? templateStep?.form ?? null;

  // BE form takes precedence over FE config whenever form fields are present.
  const isDerived = !!(stepForm?.length);

  const derivedConfig: DerivedWizardConfig | null = useMemo(() => {
    if (!isDerived || !stepForm) return null;
    return deriveWizardConfig(stepForm);
  }, [isDerived, stepForm]);

  // ── Static config — FE fallback (also used for synchronous step init) ──────
  const feConfig = STEP_FORM_CONFIGS[stepId] ?? DEFAULT_FORM_CONFIG;
  const staticConfig = isDerived ? null : feConfig;

  const totalSteps = derivedConfig?.steps.length ?? staticConfig?.wizardSteps.length ?? 1;

  const shouldMarkComplete = isDerived
    ? !!(derivedConfig?.steps.some((s) => s.kind === "mark-complete"))
    : !!(staticConfig?.wizardSteps.some((s) => s.type === "mark-complete"));

  const isRegistrationStep = stepId === "SETUP_AND_REGISTRATION";

  // ── Step position ──────────────────────────────────────────────────────────
  // Use FE config length for initial mount (synchronous); correct via effect
  // once BE-derived config resolves (challenge data is async).
  const [step, setStep] = useState(() => viewId ? feConfig.wizardSteps.length : 1);

  useEffect(() => {
    if (viewId && derivedConfig) setStep(derivedConfig.steps.length);
  }, [viewId, derivedConfig]);
  const [isViewMode, setIsViewMode] = useState(!!viewId);
  const [submitted, setSubmitted] = useState(false);
  const [impactMessage, setImpactMessage] = useState<string | null>(null);
  const [viewActivity, setViewActivity] = useState<ApiRecentActivity | null>(null);

  // ── Static form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState<LogFormData>(() =>
    isRegistrationStep ? { ...initForm(), measurementType: "AREA" } : initForm(),
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

  const nextLabel = nextStepKind === "review" ? t("review") : tCommon("continue");
  const members = challenge?.members ?? [];

  // ── Draft: static path ─────────────────────────────────────────────────────
  useEffect(() => {
    if (viewId || isDerived) return;
    const saved = localStorage.getItem(STORAGE_KEY(stepId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((f) => ({ ...f, ...parsed, evidenceFiles: [] }));
      } catch { /* ignore */ }
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
    } catch { /* ignore */ }
  }, [stepId, viewId, isDerived]);

  useEffect(() => {
    if (viewId || !isDerived) return;
    // Exclude File values (not serializable)
    const serializable: DynamicValues = {};
    for (const [k, v] of Object.entries(dynamicValues)) {
      if (v instanceof File) continue;
      serializable[k] = v;
    }
    localStorage.setItem(STORAGE_KEY(stepId), JSON.stringify({ dynamic: serializable }));
  }, [dynamicValues, stepId, viewId, isDerived]);

  // ── View mode: load from session storage ───────────────────────────────────
  useEffect(() => {
    if (!viewId) return;
    const raw = sessionStorage.getItem(EVIDENCE_SESSION_KEY(viewId));
    if (!raw) return;
    try {
      const activity = JSON.parse(raw) as ApiRecentActivity;
      setViewActivity(activity);
      sessionStorage.removeItem(EVIDENCE_SESSION_KEY(viewId));
    } catch { /* ignore */ }
  }, [viewId]);

  // ── Edit permissions ───────────────────────────────────────────────────────
  const isCircleLead = !!challenge && (loginData?.circles ?? []).some(
    (c) => c.circleId === challenge.circleId && canManageCircle(user?.email, user?.id, c),
  );
  const canEdit = !!challenge && (
    computeChallengeRoles(user?.id, user?.email, challenge).length > 0 || isCircleLead
  );

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
    () => derivedConfig?.steps.find((s) => s.kind === "volunteer-hours")?.fields[0]?.name ?? "VOLUNTEER_HOURS",
    [derivedConfig],
  );
  const contribFieldName = useMemo(
    () => derivedConfig?.steps.find((s) => s.kind === "contributors")?.fields[0]?.name ?? "CONTRIBUTORS",
    [derivedConfig],
  );

  // ── View mode: populate form/dynamicValues once config resolves ────────────
  useEffect(() => {
    if (!viewActivity) return;
    setForm(activityToForm(viewActivity));
    if (isDerived) {
      setDynamicValues(activityToDynamic(viewActivity, vhFieldName, contribFieldName, stepForm));
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
    const knownNames = new Set([vhFieldName, contribFieldName, "CONFIRM_COMPLETION", "CONFIRMATION"]);
    const filled = (name: string) => {
      const v = dynamicValues[name];
      return v !== undefined && v !== null && v !== "";
    };
    const numeric = stepForm.filter(
      (f) => !knownNames.has(f.name) && (f.type === "NUMBER" || f.type === "NUMERIC"),
    );
    const areaFields = numeric.filter((f) => f.unitOfMeasureOptions?.length);
    const countFields = numeric.filter((f) => !f.unitOfMeasureOptions?.length && f.name.includes("COUNT"));
    if (areaFields.some((f) => filled(f.name))) countFields.forEach((f) => disabled.add(f.name));
    else if (countFields.some((f) => filled(f.name))) areaFields.forEach((f) => disabled.add(f.name));
    return disabled;
  }, [challenge?.challengeCode, stepForm, dynamicValues, vhFieldName, contribFieldName]);

  // ── Payload builders ───────────────────────────────────────────────────────
  const buildPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");
    const description = form.impactDescription || form.siteCondition;
    return {
      stepId: stepMeta.stepId,
      stepNumber: stepMeta.stepNumber,
      challengeCode: challenge.challengeCode,
      circleId: challenge.circleId,
      thingId: challenge.challengeId,
      thingUUID: challenge.impactRecords?.[0]?.thingUUID ?? "",
      submittedBy: user.id,
      approvalRequired: false,
      volunteerHours: {
        value: parseFloat(form.volunteerHours) || 0,
        unitOfMeasure: "hours",
        SiUnit: "TIME",
      },
      contributors: form.contributors,
      data: {
        measurement: {
          value: parseFloat(form.measurementValue) || 0,
          unitofMeasure: form.measurementType === "VOLUME" ? "L" : "kg",
          siUnit: form.measurementType,
        },
        description,
      },
    };
  };

  const buildRegistrationPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");
    return {
      stepId: stepMeta.stepId,
      circleId: challenge.circleId,
      stepNumber: stepMeta.stepNumber,
      stepType: stepMeta.stepType,
      challengeCode: challenge.challengeCode,
      challengeId: challenge.challengeId,
      submittedBy: user.id,
      volunteerHours: {
        value: parseFloat(form.volunteerHours) || 0,
        unitOfMeasure: "hours",
        siUnit: "TIME",
      },
      contributors: form.contributors,
      data: {
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
      },
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
    const knownNames = new Set([vhFieldName, contribFieldName, "CONFIRM_COMPLETION", "CONFIRMATION"]);

    // The AREA impact formula assumes square metres — convert before sending
    const areaToSqm: Record<string, number> = {
      SQM: 1,
      SQFT: 0.09290304,
      ACRES: 4046.8564224,
      HECTARES: 10000,
    };

    const sorted = [...(stepForm ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
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

    let measurement: { value: number; unitofMeasure: string; siUnit: string; description?: string } | undefined;
    if (measurementField) {
      const value = parseFloat(dynamicValues[measurementField.name] as string) || 0;
      const unit =
        (dynamicValues[`${measurementField.name}__unit`] as string) ??
        measurementField.unitOfMeasureOptions?.[0]?.value ??
        "SQM";
      measurement = { value: value * (areaToSqm[unit] ?? 1), unitofMeasure: "m²", siUnit: "AREA" };
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
      sorted.find((f) => f.name.includes("SPECIES") && f.type === "TEXT" && hasValue(f.name));
    const description = descriptionField ? String(dynamicValues[descriptionField.name]) : "";
    if (measurement && description) measurement.description = description;

    // Also send every captured field under its raw name (original values,
    // pre-conversion). The API ignores these today but this preserves the
    // data for when it starts storing them.
    const rawFields: Record<string, unknown> = {};
    for (const field of sorted) {
      if (knownNames.has(field.name) || field.type === "IMAGE" || !hasValue(field.name)) continue;
      if ((field.type === "NUMBER" || field.type === "NUMERIC") && field.unitOfMeasureOptions?.length) {
        const unit = (dynamicValues[`${field.name}__unit`] as string) ?? field.unitOfMeasureOptions[0].value;
        rawFields[field.name] = { value: parseFloat(dynamicValues[field.name] as string) || 0, unit };
      } else {
        rawFields[field.name] = dynamicValues[field.name];
      }
    }

    // First IMAGE field becomes the media file
    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const mediaFile = imageField ? (dynamicValues[imageField.name] as File | undefined) : undefined;

    return {
      payload: {
        stepId: stepMeta.stepId,
        stepNumber: stepMeta.stepNumber,
        challengeCode: challenge.challengeCode,
        circleId: challenge.circleId,
        thingId: challenge.challengeId,
        thingUUID: challenge.id,
        submittedBy: user.id,
        approvalRequired: false,
        volunteerHours: {
          value: vhValue,
          unitOfMeasure: vhUnit === "H" ? "hours" : vhUnit.toLowerCase(),
          SiUnit: "TIME",
        },
        contributors,
        data: { ...rawFields, ...(measurement ? { measurement } : {}), description },
      },
      mediaFile,
    };
  };

  // CH-001 (heat mapping) step 1 only: the setup endpoint expects camelCase
  // data keys — anchorPoints[{name, location, measurement}] — and drops the
  // raw ANCHOR_POINT group shape entirely.
  const buildCH001SetupPayload = () => {
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
    const tempSub = subFields.find((f) => f.type === "NUMBER" || f.type === "NUMERIC");

    const entries = groupField && Array.isArray(dynamicValues[groupField.name])
      ? (dynamicValues[groupField.name] as Record<string, unknown>[])
      : [];

    const anchorPoints: ChallengeSetupAnchorPoint[] = entries
      .map((entry) => {
        const point: ChallengeSetupAnchorPoint = {
          name: nameSub ? ((entry[nameSub.name] as string) ?? "") : "",
        };
        const location = locSub ? (entry[locSub.name] as ChallengeSetupLocation | undefined) : undefined;
        if (location) point.location = location;
        const tempRaw = tempSub ? entry[tempSub.name] : undefined;
        if (tempSub && tempRaw !== undefined && tempRaw !== null && tempRaw !== "") {
          const unit =
            (entry[`${tempSub.name}__unit`] as string) ??
            tempSub.unitOfMeasureOptions?.[0]?.value ??
            "C";
          point.measurement = {
            value: parseFloat(tempRaw as string) || 0,
            unitOfMeasure: tempUnitLabels[unit] ?? unit,
          };
        }
        return point;
      })
      .filter((p) => p.name || p.location || p.measurement);

    const locationField = stepForm?.find((f) => f.type === "LOCATION");
    const location = locationField
      ? (dynamicValues[locationField.name] as ChallengeSetupLocation | undefined)
      : undefined;

    const weatherField = stepForm?.find((f) => f.name.includes("WEATHER"));
    const weatherRaw = weatherField ? dynamicValues[weatherField.name] : undefined;
    const weatherCondition =
      weatherRaw !== undefined && weatherRaw !== null && weatherRaw !== ""
        ? String(weatherRaw)
        : undefined;

    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const mediaFile = imageField ? (dynamicValues[imageField.name] as File | undefined) : undefined;

    const payload: CH001SetupPayload = {
      stepId: stepMeta.stepId,
      stepNumber: stepMeta.stepNumber,
      stepType: stepMeta.stepType,
      challengeCode: challenge.challengeCode,
      challengeId: challenge.challengeId,
      circleId: challenge.circleId,
      submittedBy: user.id,
      volunteerHours,
      contributors: (dynamicValues[contribFieldName] as string[]) ?? [],
      data: {
        volunteerHours,
        ...(weatherCondition ? { weatherCondition } : {}),
        ...(location ? { location } : {}),
        anchorPoints,
      },
    };

    return { payload, mediaFile };
  };

  const buildDynamicPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");
    if (challenge.challengeCode === "CH-015") return buildCH015Payload();

    const vhValue = parseFloat(dynamicValues[vhFieldName] as string) || 0;
    const vhUnit = (dynamicValues[`${vhFieldName}__unit`] as string) ?? "H";
    const contributors = (dynamicValues[contribFieldName] as string[]) ?? [];

    const knownNames = new Set([vhFieldName, contribFieldName, "CONFIRM_COMPLETION", "CONFIRMATION"]);

    const unitToSiUnit: Record<string, string> = {
      kg: "MASS", lb: "MASS", g: "MASS",
      L: "VOLUME", ml: "VOLUME",
      H: "TIME", hours: "TIME",
      SQM: "AREA", SQFT: "AREA", ACRES: "AREA", HECTARES: "AREA",
    };

    const rawFields: Record<string, unknown> = {};
    for (const field of stepForm ?? []) {
      if (knownNames.has(field.name)) continue;
      if (field.type === "IMAGE") continue;
      const val = dynamicValues[field.name];
      if (val === undefined || val === null || val === "") continue;

      // GROUP fields hold an array of sub-form entry objects
      if (field.type === "GROUP") {
        const entries = (Array.isArray(val) ? (val as Record<string, unknown>[]) : [])
          .map((entry) => {
            const out: Record<string, unknown> = {};
            for (const sub of field.fields ?? []) {
              const sv = entry[sub.name];
              if (sv === undefined || sv === null || sv === "") continue;
              if ((sub.type === "NUMBER" || sub.type === "NUMERIC") && sub.unitOfMeasureOptions?.length) {
                const subUnit = (entry[`${sub.name}__unit`] as string) ?? sub.unitOfMeasureOptions[0].value;
                out[sub.name] = { value: parseFloat(sv as string) || 0, unit: subUnit };
              } else {
                out[sub.name] = sv;
              }
            }
            return out;
          })
          .filter((entry) => Object.keys(entry).length > 0);
        if (entries.length) rawFields[field.name] = entries;
        continue;
      }

      const isNumeric = (field.type === "NUMBER" || field.type === "NUMERIC") && field.unitOfMeasureOptions?.length;
      const unit = isNumeric
        ? ((dynamicValues[`${field.name}__unit`] as string) ?? field.unitOfMeasureOptions![0].value)
        : undefined;

      // Addable fields hold an array of entries — send one item per entry
      if (field.addableInput && Array.isArray(val)) {
        const entries = val.filter((v) => v !== undefined && v !== null && v !== "");
        if (!entries.length) continue;
        rawFields[field.name] = isNumeric
          ? entries.map((v) => ({ value: parseFloat(v as string) || 0, unit }))
          : entries;
      } else if (isNumeric) {
        rawFields[field.name] = { value: parseFloat(val as string) || 0, unit };
      } else {
        rawFields[field.name] = val;
      }
    }

    // Build data in the expected shape
    const data: Record<string, unknown> = {};

    const measurementRaw = rawFields["MEASUREMENT"] as { value: number; unit: string } | undefined;
    if (measurementRaw) {
      data.measurement = {
        value: measurementRaw.value,
        unitofMeasure: measurementRaw.unit,
        siUnit: unitToSiUnit[measurementRaw.unit] ?? measurementRaw.unit,
      };
      delete rawFields["MEASUREMENT"];
    }

    // Map any field whose name contains "DESCRIPTION" to data.description
    const descKey = Object.keys(rawFields).find((k) => k.includes("DESCRIPTION"));
    if (descKey !== undefined) {
      data.description = rawFields[descKey];
      delete rawFields[descKey];
    }

    // Merge remaining fields directly into data
    Object.assign(data, rawFields);

    // First IMAGE field becomes the media file
    const imageField = stepForm?.find((f) => f.type === "IMAGE");
    const mediaFile = imageField ? (dynamicValues[imageField.name] as File | undefined) : undefined;

    const unitLabel = vhUnit === "H" ? "hours" : vhUnit.toLowerCase();

    return {
      payload: {
        stepId: stepMeta.stepId,
        stepNumber: stepMeta.stepNumber,
        stepType: stepMeta.stepType,
        challengeCode: challenge.challengeCode,
        challengeId: challenge.challengeId,
        circleId: challenge.circleId,
        thingId: challenge.challengeId,
        thingUUID: challenge.impactRecords?.[0]?.thingUUID ?? "",
        submittedBy: user.id,
        approvalRequired: false,
        volunteerHours: {
          value: vhValue,
          unitOfMeasure: unitLabel,
          SiUnit: "TIME",
          siUnit: "TIME",
        },
        contributors,
        data,
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

    // ── Dynamic path ───────────────────────────────────────────────────────
    if (isDerived) {
      // CH-001 step 1 registers anchor points via the multipart /challengeSetup
      // endpoint, not /submitCH001
      if (challenge.challengeCode === "CH-001" && isRegistrationStep) {
        const { payload, mediaFile } = buildCH001SetupPayload();
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { payload } = buildDynamicPayload() as any;
      submitEvidence.mutate(
        { challengeCode: challenge.challengeCode, challengeId: challenge.challengeId, stepId: stepMeta.stepId, userId: user.id, payload },
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
        { evidenceId: viewId, challengeId: challenge.challengeId, stepId: stepMeta.stepId, userId: user.id, payload },
        {
          onSuccess: (data) => {
            setImpactMessage(data?.impactSummary?.impact?.summary ?? null);
            setSubmitted(true);
          },
        },
      );
    } else {
      submitEvidence.mutate(
        { challengeCode: challenge.challengeCode, challengeId: challenge.challengeId, stepId: stepMeta.stepId, userId: user.id, payload },
        { onSuccess },
      );
    }
  };

  // ── Error ──────────────────────────────────────────────────────────────────
  const submitError =
    submitRegistration.isError
      ? submitRegistration.error instanceof Error ? submitRegistration.error.message : t("submissionFailed")
      : submitEvidence.isError
        ? submitEvidence.error instanceof Error ? submitEvidence.error.message : t("submissionFailed")
        : updateEvidence.isError
          ? updateEvidence.error instanceof Error ? updateEvidence.error.message : t("updateFailed")
          : null;

  // Block render while redirect is pending for unauthorised non-view access
  if (challenge && !canEdit && !viewId) return null;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <WizardSuccessScreen
        title={viewId && !isViewMode ? t("activityUpdated") : t("activityUploaded")}
        subtitle={impactMessage ?? (viewId && !isViewMode ? t("activityUpdatedSubtitle") : t("activityUploadedSubtitle"))}
        onDone={() => router.push(`/challenges/${challengeId}`)}
      />
    );
  }

  const isPending = submitRegistration.isPending || submitEvidence.isPending || updateEvidence.isPending;
  const currentKind = currentStep?.kind;

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <WizardHeader step={step} total={totalSteps} onBack={back} onClose={close} onGoToStep={isViewMode ? undefined : setStep} />

      <div className="flex-1 overflow-y-auto flex flex-col">

        {/* ── Dynamic steps (BE-derived config) ─────────────────────────── */}
        {isDerived && derivedConfig && (() => {
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
            return <MarkCompleteStep onSubmit={submit} />;
          }

          if (ds.kind === "review") {
            return (
              <ReviewStep
                form={bridgeForm}
                stepTypes={[]}
                onDelete={() => { setDynamicValues({}); setStep(1); }}
                onUpload={submit}
                onGoToStep={isViewMode ? handleGoToStep : setStep}
                isPending={isPending}
                error={submitError}
                users={users}
                readOnly={isViewMode}
                canEdit={isViewMode ? false : canEdit}
                uploadLabel={viewId && !isViewMode ? t("update") : t("upload")}
                dynamicConfig={{
                  fields: stepForm ?? [],
                  values: dynamicValues,
                  fieldToStepIndex: derivedConfig.fieldToStepIndex,
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
              <SiteConditionStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "interventions" && (
              <InterventionsStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "metrics" && (
              <MetricsStep onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "file-upload" && (
              <FileUploadStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "impact" && (
              <ImpactStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "volunteer-hours" && (
              <VolunteerHoursStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "measurement" && (
              <MeasurementStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
            )}
            {currentKind === "region" && (
              <RegionStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
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
              <MarkCompleteStep onSubmit={submit} />
            )}
            {currentKind === "review" && (
              <ReviewStep
                form={form}
                stepTypes={staticConfig?.wizardSteps.map((s) => s.type) ?? []}
                onDelete={() => {
                  setForm(isRegistrationStep ? { ...initForm(), measurementType: "AREA" } : initForm());
                  setStep(1);
                }}
                onUpload={submit}
                onGoToStep={isViewMode ? handleGoToStep : setStep}
                isPending={isPending}
                error={submitError}
                users={users}
                readOnly={isViewMode}
                canEdit={isViewMode ? false : canEdit}
                uploadLabel={viewId && !isViewMode ? t("update") : t("upload")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
