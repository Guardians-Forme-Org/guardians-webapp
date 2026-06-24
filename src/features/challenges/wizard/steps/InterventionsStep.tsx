"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { InterventionRow, SaveButton, ToggleCard, type Intervention } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function InterventionsStep({ form, update, onNext, nextLabel }: Props) {
  const t = useTranslations("challenges");

  const addIntervention = () => {
    update("interventions", [
      ...form.interventions,
      { id: Date.now(), name: "", count: 1 },
    ]);
  };

  const updateIntervention = (updated: Intervention) => {
    update(
      "interventions",
      form.interventions.map((i) => (i.id === updated.id ? updated : i))
    );
  };

  const removeIntervention = (id: number) => {
    update("interventions", form.interventions.filter((i) => i.id !== id));
  };

  return (
    <>
      <div className="px-5 mt-7 mb-2">
        <h1 className="text-[32px] font-bold text-black">{t("progress")}</h1>
        <p className="text-[18px] text-black mt-2">{t("interventionsSubtitle")}</p>
      </div>

      <div className="flex flex-col gap-4 px-5 mt-4">
        <div className="border border-[rgba(26,26,24,0.28)] rounded-[8px] p-5 flex flex-col gap-4">
          <p className="text-base font-medium text-text-primary">{t("interventionsLabel")}</p>
          {form.interventions.map((item) => (
            <InterventionRow
              key={item.id}
              item={item}
              onChange={updateIntervention}
              onRemove={() => removeIntervention(item.id)}
            />
          ))}
        </div>

        <button
          onClick={addIntervention}
          className="w-full border-[1.5px] border-dashed border-[rgba(26,26,24,0.28)] rounded-[8px] h-20 flex flex-col items-center justify-center gap-1.5"
        >
          <div className="flex items-center gap-1.5 text-[#787575]">
            <Plus size={16} />
            <span className="text-base font-medium">{t("addIntervention")}</span>
          </div>
          <p className="text-base text-[#b6b6b7]">{t("interventionsHint")}</p>
        </button>

        <ToggleCard
          label={t("markChallengeComplete")}
          description={t("markChallengeCompleteDesc")}
          checked={form.markComplete}
          onChange={() => update("markComplete", !form.markComplete)}
          disabled
          badge={t("unlockAfterStep3")}
        />
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
