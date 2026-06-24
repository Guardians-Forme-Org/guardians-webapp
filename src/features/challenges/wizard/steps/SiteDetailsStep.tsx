"use client";

import { useTranslations } from "next-intl";
import { FieldGroup, GateBanner, SaveButton, TextInput, ToggleCard } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
};

export default function SiteDetailsStep({ form, update, onNext }: Props) {
  const t = useTranslations("challenges");

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight whitespace-pre-line">
          {t("siteDetailsHeading")}
        </h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <FieldGroup label={t("siteNameLabel")} hint={t("siteNameHint")} required>
          <TextInput
            value={form.siteName}
            onChange={(v) => update("siteName", v)}
            placeholder={t("siteNamePlaceholder")}
          />
        </FieldGroup>

        <FieldGroup label={t("permissionHolderLabel")} hint={t("permissionHolderHint")}>
          <TextInput
            value={form.permissionHolder}
            onChange={(v) => update("permissionHolder", v)}
            placeholder={t("permissionHolderPlaceholder")}
          />
        </FieldGroup>

        <ToggleCard
          label={t("permissionConfirmedLabel")}
          description={t("permissionConfirmedDesc")}
          checked={form.permissionConfirmed}
          onChange={() => update("permissionConfirmed", !form.permissionConfirmed)}
        />

        <ToggleCard
          label={t("markChallengeComplete")}
          description={t("markChallengeCompleteDesc")}
          checked={form.markComplete}
          onChange={() => update("markComplete", !form.markComplete)}
          disabled={!form.permissionConfirmed}
          badge={!form.permissionConfirmed ? t("unlockAfterStep3") : undefined}
        />

        {!form.permissionConfirmed && (
          <GateBanner message={t("permissionRequiredBanner")} />
        )}
      </div>

      <div className="flex-1" />
      <SaveButton onClick={onNext} />
    </>
  );
}
