"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChallenge, useSubmitEvidence, useUpdateEvidence } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { EVIDENCE_SESSION_KEY } from "@/lib/hooks/activities";
import { computeChallengeRoles } from "@/lib/roles";
import { STEP_FORM_CONFIGS, DEFAULT_FORM_CONFIG } from "../stepFormConfig";
import { WizardHeader } from "../wizard/shared";
import { initForm, type LogFormData } from "../wizard/types";
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
import WizardSuccessScreen from "@/components/ui/WizardSuccessScreen";

const STORAGE_KEY = (stepId: string) => `log-evidence-draft-${stepId}`;

function activityToForm(activity: ApiRecentActivity): LogFormData {
  const m = activity.data.measurement;
  const siUnit = (m.siUnit ?? "").toUpperCase();
  return {
    ...initForm(),
    measurementValue: m.value > 0 ? String(m.value) : "",
    measurementType: siUnit === "VOLUME" ? "VOLUME" : "MASS",
    impactDescription: activity.data.description ?? "",
    volunteerHours: activity.volunteerHours.value > 0 ? String(activity.volunteerHours.value) : "",
    contributors: activity.contributors,
  };
}

type Props = { challengeId: string; stepId: string; viewId?: string };

export default function LogEvidenceWizard({ challengeId, stepId, viewId }: Props) {
  const router = useRouter();
  const { user, loginData } = useAuth();
  const { data: challenge } = useChallenge(challengeId);
  const { data: users = [] } = useUsers();
  const submitEvidence = useSubmitEvidence();
  const updateEvidence = useUpdateEvidence();

  const config = STEP_FORM_CONFIGS[stepId] ?? DEFAULT_FORM_CONFIG;
  const totalSteps = config.wizardSteps.length;

  const [step, setStep] = useState(() => viewId ? totalSteps : 1);
  const [isViewMode, setIsViewMode] = useState(!!viewId);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<LogFormData>(initForm);

  const currentStepType = config.wizardSteps[step - 1]?.type;
  const nextStepType = config.wizardSteps[step]?.type;
  const nextLabel = nextStepType === "review" ? "Review" : "Save";
  const members = challenge?.members ?? [];

  // Load draft from localStorage (only when not in view mode)
  useEffect(() => {
    if (viewId) return;
    const saved = localStorage.getItem(STORAGE_KEY(stepId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((f) => ({ ...f, ...parsed, evidenceFiles: [] }));
      } catch { /* ignore corrupt draft */ }
    }
  }, [stepId, viewId]);

  // Load evidence from sessionStorage when in view mode
  useEffect(() => {
    if (!viewId) return;
    const raw = sessionStorage.getItem(EVIDENCE_SESSION_KEY(viewId));
    if (!raw) return;
    try {
      const activity = JSON.parse(raw) as ApiRecentActivity;
      setForm(activityToForm(activity));
      sessionStorage.removeItem(EVIDENCE_SESSION_KEY(viewId));
    } catch { /* ignore corrupt data */ }
  }, [viewId]);

  // Persist draft to localStorage (only when not in view mode)
  useEffect(() => {
    if (viewId) return;
    const { evidenceFiles: _files, ...serializable } = form;
    localStorage.setItem(STORAGE_KEY(stepId), JSON.stringify(serializable));
  }, [form, stepId, viewId]);

  // Facilitator or above (facilitator, circle lead, admin) can edit a viewed record
  const isCircleLead = !!challenge && (loginData?.circles ?? []).some(
    (c) =>
      c.circleId === challenge.circleId &&
      (c.circleLead as { userId?: string } | null)?.userId === user?.id,
  );
  const canEdit = !!challenge && (
    computeChallengeRoles(user?.id, user?.email, challenge).length > 0 || isCircleLead
  );

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

  const close = () => router.push(`/challenges/${challengeId}/steps/${stepId}`);

  // When an edit icon is pressed from view mode — exit read-only and jump to that step
  const handleGoToStep = useCallback((targetStep: number) => {
    setIsViewMode(false);
    setStep(targetStep);
  }, []);

  const stepMeta = challenge?.challengeSteps?.find((s) => s.stepId === stepId);

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
          SiUnit: form.measurementType,
        },
        description,
      },
    };
  };

  const submit = () => {
    if (!user) throw new Error("Not authenticated");
    if (!challenge) throw new Error("Challenge not loaded");
    if (!stepMeta) throw new Error("Step not found in challenge");

    const payload = buildPayload();

    if (viewId && !isViewMode) {
      // Facilitator updating an existing evidence record
      updateEvidence.mutate(
        { evidenceId: viewId, challengeId: challenge.challengeId, stepId: stepMeta.stepId, userId: user.id, payload },
        { onSuccess: () => setSubmitted(true) },
      );
    } else {
      // New evidence submission
      submitEvidence.mutate(
        { challengeCode: challenge.challengeCode, challengeId: challenge.challengeId, stepId: stepMeta.stepId, userId: user.id, payload },
        {
          onSuccess: () => {
            localStorage.removeItem(STORAGE_KEY(stepId));
            setSubmitted(true);
          },
        },
      );
    }
  };

  const submitError =
    submitEvidence.isError
      ? submitEvidence.error instanceof Error
        ? submitEvidence.error.message
        : "Submission failed. Please try again."
      : updateEvidence.isError
        ? updateEvidence.error instanceof Error
          ? updateEvidence.error.message
          : "Update failed. Please try again."
        : null;

  if (submitted) {
    return (
      <WizardSuccessScreen
        title={viewId && !isViewMode ? "Activity Updated" : "Activity Uploaded"}
        subtitle="Copy and share this link to invite people to join this challenge"
        inviteLink={`${window.location.origin}/challenges/${challengeId}`}
        onDone={() => router.push(`/challenges/${challengeId}`)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <WizardHeader step={step} total={totalSteps} onBack={back} onClose={close} />

      <div className="flex-1 overflow-y-auto flex flex-col">
        {currentStepType === "site-details" && (
          <SiteDetailsStep form={form} update={update} onNext={next} />
        )}
        {currentStepType === "location-photos" && (
          <LocationPhotosStep form={form} update={update} onNext={next} />
        )}
        {currentStepType === "site-condition" && (
          <SiteConditionStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "interventions" && (
          <InterventionsStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "metrics" && (
          <MetricsStep onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "file-upload" && (
          <FileUploadStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "impact" && (
          <ImpactStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "volunteer-hours" && (
          <VolunteerHoursStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "measurement" && (
          <MeasurementStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "region" && (
          <RegionStep form={form} update={update} onNext={next} nextLabel={nextLabel} />
        )}
        {currentStepType === "contributors" && (
          <ContributorsStep
            form={form}
            update={update}
            onNext={next}
            nextLabel={nextLabel}
            members={members}
            users={users}
          />
        )}
        {currentStepType === "mark-complete" && (
          <MarkCompleteStep onSubmit={submit} />
        )}
        {currentStepType === "review" && (
          <ReviewStep
            form={form}
            stepTypes={config.wizardSteps.map((s) => s.type)}
            onDelete={() => { setForm(initForm()); setStep(1); }}
            onUpload={submit}
            onGoToStep={isViewMode ? handleGoToStep : setStep}
            isPending={submitEvidence.isPending || updateEvidence.isPending}
            error={submitError}
            users={users}
            readOnly={isViewMode}
            canEdit={canEdit}
            uploadLabel={viewId && !isViewMode ? "Update" : "Upload"}
          />
        )}
      </div>
    </div>
  );
}
