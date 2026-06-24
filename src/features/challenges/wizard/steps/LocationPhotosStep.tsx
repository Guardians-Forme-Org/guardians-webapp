"use client";

import { useTranslations } from "next-intl";
import LocationPicker from "@/components/ui/LocationPicker";
import { FieldGroup, SaveButton, UploadZone } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
};

export default function LocationPhotosStep({ form, update, onNext }: Props) {
  const t = useTranslations("challenges");

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">{t("siteDescriptionHeading")}</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <FieldGroup label={t("locationPhotosLocation")} required>
          <LocationPicker
            defaultValue={form.locationResult?.formattedAddress ?? ""}
            onSelect={(place) => update("locationResult", place)}
            placeholder={t("findLocationPlaceholder")}
            className="w-full h-[44px] bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 pr-10 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none"
          />
        </FieldGroup>

        {form.locationResult && (
          <div className="flex flex-col gap-2">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.locationResult.longitude - 0.015},${form.locationResult.latitude - 0.01},${form.locationResult.longitude + 0.015},${form.locationResult.latitude + 0.01}&layer=mapnik&marker=${form.locationResult.latitude},${form.locationResult.longitude}`}
              className="w-full h-48 rounded-[8px] border border-[rgba(26,26,24,0.14)]"
              title="Location map"
            />
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-xs text-[#8f8f8c]">{t("latitude")}</p>
                <div className="h-[44px] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 flex items-center bg-[#f9f9f9]">
                  <p className="text-base text-text-primary">{form.locationResult.latitude.toFixed(4)}</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-xs text-[#8f8f8c]">{t("longitude")}</p>
                <div className="h-[44px] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 flex items-center bg-[#f9f9f9]">
                  <p className="text-base text-text-primary">{form.locationResult.longitude.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <UploadZone
          label={t("baselinePhotos")}
          hint={t("beforePhotoHint")}
          required
          value={form.baselinePhoto}
          onChange={(v) => update("baselinePhoto", v)}
        />

        <UploadZone
          label={t("plantingPhotoLabel")}
          hint={t("plantingPhotoHint")}
          value={form.plantingPhoto}
          onChange={(v) => update("plantingPhoto", v)}
        />
      </div>

      <div className="flex-1" />
      <SaveButton onClick={onNext} />
    </>
  );
}
