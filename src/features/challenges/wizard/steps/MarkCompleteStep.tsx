"use client";

import { useTranslations } from "next-intl";
import { SaveButton, ToggleCard } from "../shared";
import type { ApiTemplateFormField } from "@/lib/types/challenges";

export default function MarkCompleteStep({
  field,
  checked,
  onToggle,
  onSubmit,
  isPending,
  blockOnToggle = true,
  buttonLabel,
}: {
  // The completion flag field from the BE form config, if this step has one
  field?: ApiTemplateFormField;
  checked?: boolean;
  onToggle?: () => void;
  onSubmit: () => void;
  isPending?: boolean;
  // When false, the toggle is logged but does not gate the button (e.g.
  // CH-008B: the switch just records completion, it isn't a precondition)
  blockOnToggle?: boolean;
  buttonLabel?: string;
}) {
  const t = useTranslations("challenges");
  const blocked = blockOnToggle && !!field?.required && !checked;

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">{t("markComplete")}</h1>
        <p className="text-[18px] text-black mt-2">{t("markCompleteSubtitle")}</p>
      </div>
      {field && (
        <div className="px-5">
          <ToggleCard
            label={field.label}
            description=""
            checked={!!checked}
            onChange={() => onToggle?.()}
          />
        </div>
      )}
      <div className="flex-1" />
      <SaveButton
        label={isPending ? t("saving") : (buttonLabel ?? t("markComplete"))}
        onClick={onSubmit}
        disabled={isPending || blocked}
      />
    </>
  );
}
