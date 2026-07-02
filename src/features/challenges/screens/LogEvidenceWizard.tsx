"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useChallenge, useTemplates, useSubmitEvidence, useSubmitRegistration, useUpdateEvidence, useMarkStepComplete, type SubmitEvidenceResponse } from "@/lib/hooks/challenges";
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

  const buildDynamicPayload = () => {
    if (!user || !challenge || !stepMeta) throw new Error("Not ready");

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

      if ((field.type === "NUMBER" || field.type === "NUMERIC") && field.unitOfMeasureOptions?.length) {
        const unit = (dynamicValues[`${field.name}__unit`] as string) ?? field.unitOfMeasureOptions[0].value;
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
