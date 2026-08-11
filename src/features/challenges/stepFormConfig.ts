export type WizardStepType =
  | "site-details"
  | "location-photos"
  | "site-condition"
  | "interventions"
  | "metrics"
  | "file-upload"
  | "impact"
  | "measurement"
  | "volunteer-hours"
  | "region"
  | "contributors"
  | "mark-complete"
  | "review";

export type FormConfig = {
  wizardSteps: { type: WizardStepType }[];
};

// FE mock — move stepId → formConfig mapping to BE later
export const STEP_FORM_CONFIGS: Record<string, FormConfig> = {
  SETUP_AND_REGISTRATION: {
    wizardSteps: [
      { type: "measurement" },
      { type: "region" },
      { type: "volunteer-hours" },
      { type: "contributors" },
      { type: "file-upload" },
      { type: "review" },
    ],
  },
  ACTIVATION_MODEL_REGISTRATION: {
    wizardSteps: [
      { type: "file-upload" },
      { type: "volunteer-hours" },
      { type: "region" },
      { type: "contributors" },
      { type: "review" },
    ],
  },
  LOG_WASTE_AND_COMPOSTING: {
    wizardSteps: [
      { type: "file-upload" },
      { type: "volunteer-hours" },
      { type: "measurement" },
      { type: "contributors" },
      { type: "review" },
    ],
  },
  LOG_WASTE_AND_COMPOSTING_ACTIVITY: {
    wizardSteps: [
      { type: "file-upload" },
      { type: "volunteer-hours" },
      { type: "measurement" },
      { type: "contributors" },
      { type: "review" },
    ],
  },
  COMPLETION: {
    wizardSteps: [{ type: "mark-complete" }, { type: "review" }],
  },
};

export const DEFAULT_FORM_CONFIG: FormConfig = {
  wizardSteps: [
    { type: "file-upload" },
    { type: "volunteer-hours" },
    { type: "impact" },
    { type: "contributors" },
    { type: "review" },
  ],
};
