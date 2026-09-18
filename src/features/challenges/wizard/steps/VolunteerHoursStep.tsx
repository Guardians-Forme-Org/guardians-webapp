"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { SaveButton } from "../shared";
import type { LogFormData } from "../types";
import type { ApiTemplateFormField } from "@/lib/types/challenges";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
  // The template's own volunteerHours field, on the BE-derived path. Its
  // label is per-challenge ("Volunteer Hours (Organising)" on CH-012A/B) and
  // wins over the generic heading; the static path passes nothing and keeps
  // the translated copy.
  field?: ApiTemplateFormField;
};

export default function VolunteerHoursStep({ form, update, onNext, nextLabel, field }: Props) {
  const t = useTranslations("challenges");
  // Templates mark this required; the static path has no field and the rule is app-wide.
  const required = field?.required ?? true;
  const [showError, setShowError] = useState(false);
  const missing = required && form.volunteerHours.trim() === "";

  const handleNext = () => {
    if (missing) {
      setShowError(true);
      return;
    }
    onNext();
  };

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">
          {field?.label || t("volunteerHoursLabel")}
        </h1>
        <p className="text-base text-text-muted mt-1">{t("volunteerHoursQuestion")}</p>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <div
          className={`flex items-center border rounded-[8px] overflow-hidden ${
            showError && missing ? "border-[#e24b4a]" : "border-[rgba(26,26,24,0.28)]"
          }`}
        >
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={form.volunteerHours}
            onChange={(e) => update("volunteerHours", e.target.value)}
            placeholder={field?.placeholder ?? "0"}
            className="flex-1 h-[52px] px-3 text-xl text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none bg-white"
          />
          <div className="h-[52px] px-4 flex items-center bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)]">
            <span className="text-base font-semibold text-text-primary">{t("hoursUnit")}</span>
          </div>
        </div>
        {showError && missing && (
          <div className="flex items-center gap-1 text-[#a32d2d] -mt-3">
            <AlertTriangle size={13} />
            <span className="text-xs">{t("required")}</span>
          </div>
        )}
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={handleNext} />
    </>
  );
}
