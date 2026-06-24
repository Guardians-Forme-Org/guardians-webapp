"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WizardStepType } from "../../stepFormConfig";
import { FileThumb, ReadOnlyField } from "../shared";
import type { LogFormData } from "../types";

type UserLike = {
  id: string;
  user_metadata: { firstName?: string; lastName?: string };
};

type Props = {
  form: LogFormData;
  stepTypes: WizardStepType[];
  onDelete: () => void;
  onUpload: () => void;
  onGoToStep: (step: number) => void;
  isPending?: boolean;
  error?: string | null;
  users?: UserLike[];
  readOnly?: boolean;
  canEdit?: boolean;
  uploadLabel?: string;
};

function ReviewSection({
  label,
  stepIndex,
  onEdit,
  showEdit = true,
  children,
}: {
  label: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  showEdit?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("challenges");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </p>
        {showEdit && (
          <button
            onClick={() => onEdit(stepIndex)}
            className="flex items-center gap-1 text-xs font-medium text-text-muted active:opacity-60"
            aria-label={`Edit ${label}`}
          >
            <Pencil size={13} />
            {t("edit")}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ReviewStep({
  form,
  stepTypes,
  onDelete,
  onUpload,
  onGoToStep,
  isPending,
  error,
  users,
  readOnly,
  canEdit,
  uploadLabel = "Upload",
}: Props) {
  const t = useTranslations("challenges");
  const idx = (type: WizardStepType) => stepTypes.indexOf(type) + 1;
  const showEdit = !readOnly || !!canEdit;

  const hasFileUpload = stepTypes.includes("file-upload");
  const hasVolunteerHours = stepTypes.includes("volunteer-hours");
  const hasImpact = stepTypes.includes("impact");
  const hasMeasurement = stepTypes.includes("measurement");
  const hasRegion = stepTypes.includes("region");
  const hasContributors = stepTypes.includes("contributors");
  const hasSiteDetails = stepTypes.includes("site-details");

  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">{t("reviewHeading")}</h1>
        <p className="text-base text-text-muted mt-1">
          {t("checkDetails")}
        </p>
      </div>

      <div className="flex flex-col gap-6 px-5">
        {hasFileUpload && form.evidenceFiles.length > 0 && (
          <ReviewSection
            label={t("evidenceFilesSection")}
            stepIndex={idx("file-upload")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            {form.evidenceFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border border-[rgba(26,26,24,0.14)] rounded-[12px] p-4"
              >
                <div
                  className={`size-10 rounded-[8px] overflow-hidden flex items-center justify-center shrink-0 ${
                    file.type.startsWith("image/")
                      ? "bg-[#f0f0ee]"
                      : file.type.includes("pdf")
                        ? "bg-red-50"
                        : "bg-[#f5f5f5]"
                  }`}
                >
                  <FileThumb file={file} />
                </div>
                <p className="flex-1 text-base font-semibold text-text-primary truncate">
                  {file.name}
                </p>
              </div>
            ))}
          </ReviewSection>
        )}

        {hasVolunteerHours && form.volunteerHours && (
          <ReviewSection
            label={t("volunteerHoursSection")}
            stepIndex={idx("volunteer-hours")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            <ReadOnlyField label={t("hoursLabel")} value={t("hoursValue", { hours: form.volunteerHours })} />
          </ReviewSection>
        )}

        {hasMeasurement && (
          <ReviewSection
            label={t("measurementSection")}
            stepIndex={idx("measurement")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            {form.measurementValue && (
              <ReadOnlyField
                label={t("amountLabel")}
                value={
                  form.measurementType === "AREA"
                    ? `${form.measurementValue} ${form.areaUnit}`
                    : `${form.measurementValue} ${form.measurementType === "VOLUME" ? "L" : "kg"}`
                }
              />
            )}
            {form.measurementType !== "AREA" && form.impactDescription && (
              <ReadOnlyField
                label={t("descriptionLabel")}
                value={form.impactDescription}
                multiline
              />
            )}
          </ReviewSection>
        )}

        {hasImpact && form.impactDescription && (
          <ReviewSection
            label={t("impactSection")}
            stepIndex={idx("impact")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            <ReadOnlyField
              label={t("descriptionLabel")}
              value={form.impactDescription}
              multiline
            />
          </ReviewSection>
        )}

        {hasRegion && form.locationResult && (
          <ReviewSection
            label={t("regionSection")}
            stepIndex={idx("region")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            <ReadOnlyField
              label={t("locationLabel")}
              value={form.locationResult.formattedAddress}
            />
          </ReviewSection>
        )}

        {hasContributors && form.contributors.length > 0 && (
          <ReviewSection
            label={t("contributorsSection")}
            stepIndex={idx("contributors")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            <ReadOnlyField
              label={t("membersLabel")}
              value={form.contributors
                .map((id) => {
                  const u = users?.find((u) => u.id === id);
                  return u
                    ? `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""}`.trim() ||
                        id
                    : id;
                })
                .join(", ")}
            />
          </ReviewSection>
        )}

        {hasSiteDetails && (
          <ReviewSection
            label={t("siteDetailsSection")}
            stepIndex={idx("site-details")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            {form.siteName && (
              <ReadOnlyField label={t("siteNameReview")} value={form.siteName} />
            )}
            {form.permissionHolder && (
              <ReadOnlyField
                label={t("permissionHolderReview")}
                value={form.permissionHolder}
              />
            )}

            <div className="border border-[rgba(26,26,24,0.14)] rounded-[12px] p-[14.5px] flex gap-3 items-start">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-text-primary">
                  {t("permissionConfirmedReview")}
                </p>
                <p className="text-xs text-[#5c5c59] mt-1">
                  {t("permissionConfirmedReviewDesc")}
                </p>
              </div>
              <div
                className={`relative shrink-0 w-11 h-[26px] rounded-full mt-0.5 ${
                  form.permissionConfirmed
                    ? "bg-gotf-green"
                    : "bg-[#f0efeb] border border-[rgba(26,26,24,0.28)]"
                }`}
              >
                <div
                  className={`absolute top-1 size-[18px] rounded-full ${
                    form.permissionConfirmed
                      ? "bg-white translate-x-[18px]"
                      : "bg-[#8f8f8c] translate-x-1"
                  }`}
                />
              </div>
            </div>

            {form.locationResult && (
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium text-text-primary">
                  {t("locationLabel")}
                </label>
                <div className="h-[44px] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 flex items-center bg-[#f9f9f9]">
                  <p className="text-base text-text-primary truncate">
                    {form.locationResult.formattedAddress}
                  </p>
                </div>
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.locationResult.longitude - 0.015},${form.locationResult.latitude - 0.01},${form.locationResult.longitude + 0.015},${form.locationResult.latitude + 0.01}&layer=mapnik&marker=${form.locationResult.latitude},${form.locationResult.longitude}`}
                  className="w-full h-48 rounded-[8px] border border-[rgba(26,26,24,0.14)]"
                  title="Location map"
                />
              </div>
            )}

            {form.plantingPhoto && (
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium text-text-primary">
                  {t("plantingPhotoLabel")}
                </label>
                <img
                  src={form.plantingPhoto}
                  alt=""
                  className="w-full h-48 object-cover rounded-[8px] border border-[rgba(26,26,24,0.14)]"
                />
              </div>
            )}

            {form.estimatedArea && (
              <ReadOnlyField
                label={t("estimatedAreaLabel")}
                value={`${form.estimatedArea} ${form.areaUnit}`}
              />
            )}

            {form.siteCondition && (
              <ReadOnlyField
                label={t("siteConditionLabel")}
                value={form.siteCondition}
                multiline
              />
            )}
          </ReviewSection>
        )}
      </div>

      <div className="flex-1" />
      {!readOnly && (
        <div className="px-5 pb-8 pt-12 flex flex-col gap-3 shrink-0">
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            onClick={onDelete}
            disabled={isPending}
            className="w-full h-14 border border-[rgba(26,26,24,0.28)] rounded-full text-base font-medium text-text-primary disabled:opacity-50"
          >
            {t("deleteImpact")}
          </button>
          <button
            onClick={onUpload}
            disabled={isPending}
            className="w-full h-14 bg-black text-white rounded-full text-xl font-medium disabled:opacity-50"
          >
            {isPending ? (uploadLabel === "Update" ? t("updating") : t("uploading")) : uploadLabel}
          </button>
        </div>
      )}
    </>
  );
}
