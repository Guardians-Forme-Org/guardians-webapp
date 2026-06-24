"use client";

import { useTranslations } from "next-intl";
import { SaveButton } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function ImpactStep({ form, update, onNext, nextLabel }: Props) {
  const t = useTranslations("challenges");

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">{t("impactSection")}</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-text-primary">{t("impactLabel")}</label>
          <textarea
            value={form.impactDescription}
            onChange={(e) => update("impactDescription", e.target.value)}
            placeholder={t("impactPlaceholder")}
            rows={4}
            className="border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 py-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
