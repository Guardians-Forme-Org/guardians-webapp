"use client";

import { useTranslations } from "next-intl";
import { SaveButton } from "../shared";

export default function MarkCompleteStep({
  onSubmit,
  isPending,
}: {
  onSubmit: () => void;
  isPending?: boolean;
}) {
  const t = useTranslations("challenges");

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">{t("markComplete")}</h1>
        <p className="text-[18px] text-black mt-2">{t("markCompleteSubtitle")}</p>
      </div>
      <div className="flex-1" />
      <SaveButton
        label={isPending ? t("saving") : t("markComplete")}
        onClick={onSubmit}
        disabled={isPending}
      />
    </>
  );
}
