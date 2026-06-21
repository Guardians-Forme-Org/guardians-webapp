"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChallenge, useSubmitEvidence } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { STEP_FORM_CONFIGS, DEFAULT_FORM_CONFIG } from "../stepFormConfig";
import { WizardHeader } from "../wizard/shared";
import { initForm, type LogFormData } from "../wizard/types";
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

type Props = { challengeId: string; stepId: string };

export default function LogEvidenceWizard({ challengeId, stepId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: challenge } = useChallenge(challengeId);
  const { data: users = [] } = useUsers();
  const submitEvidence = useSubmitEvidence();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<LogFormData>(initForm);

  const config = STEP_FORM_CONFIGS[stepId] ?? DEFAULT_FORM_CONFIG;
  const totalSteps = config.wizardSteps.length;
  const currentStepType = config.wizardSteps[step - 1]?.type;
  const nextStepType = config.wizardSteps[step]?.type;
  const nextLabel = nextStepType === "review" ? "Review" : "Save";
  const members = challenge?.members ?? [];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(stepId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((f) => ({ ...f, ...parsed, evidenceFiles: [] }));
      } catch { /* ignore corrupt draft */ }
    }
  }, [stepId]);

  useEffect(() => {
    const { evidenceFiles: _files, ...serializable } = form;
    localStorage.setItem(STORAGE_KEY(stepId), JSON.stringify(serializable));
  }, [form, stepId]);

  const update = (key: keyof LogFormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const next = () => {
    if (step >= totalSteps) submit();
    else setStep((s) => s + 1);
  };

  const back = () => {
    if (step <= 1) router.back();
    else setStep((s) => s - 1);
  };

  const close = () => router.push(`/challenges/${challengeId}/steps/${stepId}`);

  const stepMeta = challenge?.challengeSteps?.find((s) => s.stepId === stepId);

  const submit = () => {
    if (!user) throw new Error("Not authenticated");
    if (!challenge) throw new Error("Challenge not loaded");
    if (!stepMeta) throw new Error("Step not found in challenge");

    const description = form.impactDescription || form.siteCondition;
    const contributors = form.contributors;

    submitEvidence.mutate(
      {
        challengeCode: challenge.challengeCode,
        challengeId: challenge.challengeId,
        stepId: stepMeta.stepId,
        userId: user.id,
        payload: {
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
          contributors,
          data: {
            measurement: {
              value: parseFloat(form.measurementValue) || 0,
              unitofMeasure: form.measurementType === "VOLUME" ? "L" : "kg",
              SiUnit: form.measurementType,
            },
            description,
          },
        },
      },
      {
        onSuccess: () => {
          localStorage.removeItem(STORAGE_KEY(stepId));
          setSubmitted(true);
        },
      },
    );
  };

  const submitError = submitEvidence.isError
    ? submitEvidence.error instanceof Error
      ? submitEvidence.error.message
      : "Submission failed. Please try again."
    : null;

  if (submitted) {
    return (
      <WizardSuccessScreen
        title="Activity Uploaded"
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
            onGoToStep={setStep}
            isPending={submitEvidence.isPending}
            error={submitError}
            users={users}
          />
        )}
      </div>
    </div>
  );
}
