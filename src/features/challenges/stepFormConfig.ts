export type WizardStepType =
  | "site-details"
  | "location-photos"
  | "site-condition"
  | "interventions"
  | "metrics"
  | "file-upload"
  | "mark-complete"
  | "review";

export type FormConfig = {
  wizardSteps: { type: WizardStepType }[];
};

// FE mock — move stepId → formConfig mapping to BE later
export const STEP_FORM_CONFIGS: Record<string, FormConfig> = {
  ACTIVATION_MODEL_REGISTRATION: {
    wizardSteps: [
      { type: "site-details" },
      { type: "location-photos" },
      { type: "site-condition" },
      { type: "interventions" },
      { type: "metrics" },
      { type: "review" },
    ],
  },
  LOG_WASTE_AND_COMPOSTING_ACTIVITY: {
    wizardSteps: [
      { type: "file-upload" },
      { type: "review" },
    ],
  },
  COMPLETION: {
    wizardSteps: [{ type: "mark-complete" },{ type: "review" },],
  },
};

export const DEFAULT_FORM_CONFIG: FormConfig = {
  wizardSteps: [{ type: "file-upload" }, { type: "review" }],
};