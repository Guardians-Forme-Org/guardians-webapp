"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WizardStepType } from "../../stepFormConfig";
import { FileThumb, ReadOnlyField } from "../shared";
import type { LogFormData } from "../types";
import type { ApiTemplateFormField } from "@/lib/types/challenges";
import type { DynamicValues } from "./DynamicFieldsStep";
import { useUser } from "@/lib/hooks/users";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";

type UserLike = {
  id: string;
  user_metadata: { firstName?: string; lastName?: string; avatarUrl?: string };
};

function ContributorChip({ userId, localUsers }: { userId: string; localUsers?: UserLike[] }) {
  const local = localUsers?.find((u) => u.id === userId);
  const { data: fetched } = useUser(local ? null : userId);
  const resolved = local ?? fetched;
  const name = resolved
    ? `${resolved.user_metadata.firstName ?? ""} ${resolved.user_metadata.lastName ?? ""}`.trim() || userId
    : userId;
  const avatar = (resolved as UserLike & { user_metadata: { avatarUrl?: string } } | undefined)
    ?.user_metadata?.avatarUrl;

  return (
    <div className="flex items-center gap-1.5 h-8 bg-[#f5f5f5] border border-[rgba(26,26,24,0.14)] rounded-full pl-1 pr-3">
      <Avatar src={avatar} className="size-6 rounded-full shrink-0" />
      <span className="text-sm text-text-primary">{name}</span>
    </div>
  );
}

function ContributorsList({ ids, users }: { ids: string[]; users?: UserLike[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => (
        <ContributorChip key={id} userId={id} localUsers={users} />
      ))}
    </div>
  );
}

export type DynamicReviewConfig = {
  fields: ApiTemplateFormField[];
  values: DynamicValues;
  fieldToStepIndex: Record<string, number>;
  // Setup-registered points re-measured this step — pre-formatted display rows
  setupUpdate?: { label: string; stepIndex: number; rows: string[] };
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
  dynamicConfig?: DynamicReviewConfig;
  isLoading?: boolean;
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

function formatDynamicValue(
  field: ApiTemplateFormField,
  value: unknown,
  unit: string | undefined,
  users?: UserLike[],
): string | null {
  if (value === undefined || value === null || value === "") return null;

  switch (field.type) {
    case "TEXT":
    case "TEXTAREA":
      return value as string;
    case "NUMBER":
    case "NUMERIC": {
      // Addable fields hold an array of entries
      if (Array.isArray(value)) {
        const nums = (value as string[]).filter((v) => v !== "" && v !== undefined && v !== null);
        if (!nums.length) return null;
        return nums.map((n) => (unit ? `${n} ${unit}` : n)).join(", ");
      }
      const num = value as string;
      if (!num) return null;
      return unit ? `${num} ${unit}` : num;
    }
    case "DATE":
      try {
        return new Date(value as string).toLocaleDateString();
      } catch {
        return value as string;
      }
    case "TOGGLE":
    case "BOOLEAN":
      return (value as boolean) ? "Yes" : "No";
    case "SELECT": {
      const opt = field.options?.find((o) => o.value === value);
      return opt?.label ?? (value as string);
    }
    case "MULTISELECT": {
      const selected = value as string[];
      if (!selected?.length) return null;
      return selected
        .map((v) => {
          const opt = field.options?.find((o) => o.value === v);
          if (opt) return opt.label;
          const u = users?.find((u) => u.id === v);
          if (u) return `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""}`.trim() || v;
          return v;
        })
        .join(", ");
    }
    case "LOCATION": {
      const loc = value as { formattedAddress?: string } | null;
      return loc?.formattedAddress ?? null;
    }
    case "IMAGE":
      return value instanceof File ? value.name : null;
    default:
      return String(value);
  }
}

function ReadOnlyToggle({ checked }: { checked: boolean }) {
  return (
    <div
      className={`relative w-11 h-[26px] rounded-full ${
        checked ? "bg-gotf-green" : "bg-[#f0efeb] border border-[rgba(26,26,24,0.28)]"
      }`}
    >
      <div
        className={`absolute top-1 size-[18px] rounded-full ${
          checked ? "bg-white translate-x-[18px]" : "bg-[#8f8f8c] translate-x-1"
        }`}
      />
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
  dynamicConfig,
  isLoading,
}: Props) {
  const t = useTranslations("challenges");
  const idx = (type: WizardStepType) => stepTypes.indexOf(type) + 1;
  const showEdit = !readOnly || !!canEdit;

  if (isLoading) {
    return (
      <>
        <div className="px-5 mt-7 mb-6">
          <h1 className="text-[32px] font-bold text-black">{t("reviewHeading")}</h1>
          <p className="text-base text-text-muted mt-1">{t("checkDetails")}</p>
        </div>
        <div className="flex flex-col gap-6 px-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-[44px] w-full rounded-[8px]" />
            </div>
          ))}
        </div>
      </>
    );
  }

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
        {/* ── Setup-update rows (points registered during setup) ─────────── */}
        {dynamicConfig?.setupUpdate && dynamicConfig.setupUpdate.rows.length > 0 && (
          <ReviewSection
            label={dynamicConfig.setupUpdate.label}
            stepIndex={dynamicConfig.setupUpdate.stepIndex}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            <div className="flex flex-col gap-2">
              {dynamicConfig.setupUpdate.rows.map((line, i) => (
                <ReadOnlyField key={i} label="" value={line} />
              ))}
            </div>
          </ReviewSection>
        )}

        {/* ── Dynamic fields (BE-driven config) ──────────────────────────── */}
        {dynamicConfig &&
          [...dynamicConfig.fields]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((field) => {
              const value = dynamicConfig.values[field.name];
              const unit = dynamicConfig.values[`${field.name}__unit`] as string | undefined;
              const stepIndex = dynamicConfig.fieldToStepIndex[field.name] ?? 1;
              const isBooleanType = field.type === "TOGGLE" || field.type === "BOOLEAN";
              const isImage = field.type === "IMAGE";
              const isContributors =
                field.name === "CONTRIBUTORS" || field.name === "CONTRIBUTORS_LIST";

              // GROUP: one row per entry, sub-values joined
              if (field.type === "GROUP") {
                const entries = (Array.isArray(value) ? (value as Record<string, unknown>[]) : [])
                  .map((entry) =>
                    (field.fields ?? [])
                      .map((sub) => {
                        const sv = entry[sub.name];
                        if (sv === undefined || sv === null || sv === "") return null;
                        if (typeof sv === "object") {
                          return (sv as { formattedAddress?: string }).formattedAddress ?? null;
                        }
                        if (sub.type === "NUMBER" || sub.type === "NUMERIC") {
                          const subUnit =
                            (entry[`${sub.name}__unit`] as string | undefined) ??
                            sub.unitOfMeasureOptions?.[0]?.value;
                          return subUnit ? `${sv} ${subUnit}` : String(sv);
                        }
                        return String(sv);
                      })
                      .filter((p): p is string => !!p)
                      .join(" · "),
                  )
                  .filter((line) => line.length > 0);
                if (!entries.length) return null;
                return (
                  <ReviewSection
                    key={field.name}
                    label={field.label}
                    stepIndex={stepIndex}
                    onEdit={onGoToStep}
                    showEdit={showEdit}
                  >
                    <div className="flex flex-col gap-2">
                      {entries.map((line, i) => (
                        <ReadOnlyField key={i} label="" value={line} />
                      ))}
                    </div>
                  </ReviewSection>
                );
              }

              if (isContributors) {
                const ids = (value as string[] | undefined) ?? [];
                if (!ids.length) return null;
                return (
                  <ReviewSection
                    key={field.name}
                    label={field.label}
                    stepIndex={stepIndex}
                    onEdit={onGoToStep}
                    showEdit={showEdit}
                  >
                    <ContributorsList ids={ids} users={users} />
                  </ReviewSection>
                );
              }

              if (isBooleanType) {
                return (
                  <ReviewSection
                    key={field.name}
                    label={field.label}
                    stepIndex={stepIndex}
                    onEdit={onGoToStep}
                    showEdit={showEdit}
                  >
                    <ReadOnlyToggle checked={(value as boolean) ?? false} />
                  </ReviewSection>
                );
              }

              if (isImage && value instanceof File) {
                return (
                  <ReviewSection
                    key={field.name}
                    label={field.label}
                    stepIndex={stepIndex}
                    onEdit={onGoToStep}
                    showEdit={showEdit}
                  >
                    <div className="border border-[rgba(26,26,24,0.14)] rounded-[12px] p-4 flex items-center gap-3">
                      <FileThumb file={value} />
                      <p className="text-base font-semibold text-text-primary truncate">{value.name}</p>
                    </div>
                  </ReviewSection>
                );
              }

              // Already-uploaded media (view mode) arrives as a URL string
              if (isImage && typeof value === "string" && value) {
                return (
                  <ReviewSection
                    key={field.name}
                    label={field.label}
                    stepIndex={stepIndex}
                    onEdit={onGoToStep}
                    showEdit={showEdit}
                  >
                    <img
                      src={value}
                      alt=""
                      className="w-full h-48 object-cover rounded-[8px] border border-[rgba(26,26,24,0.14)]"
                    />
                  </ReviewSection>
                );
              }

              const displayValue = formatDynamicValue(field, value, unit, users);
              if (displayValue === null) return null;

              return (
                <ReviewSection
                  key={field.name}
                  label={field.label}
                  stepIndex={stepIndex}
                  onEdit={onGoToStep}
                  showEdit={showEdit}
                >
                  <ReadOnlyField
                    label=""
                    value={displayValue}
                    multiline={field.type === "TEXTAREA" || displayValue.length > 60}
                  />
                </ReviewSection>
              );
            })}

        {/* ── Static / known-step fields ──────────────────────────────────── */}
        {!dynamicConfig && hasFileUpload && form.evidenceFiles.length > 0 && (
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

        {!dynamicConfig && hasVolunteerHours && form.volunteerHours && (
          <ReviewSection
            label={t("volunteerHoursSection")}
            stepIndex={idx("volunteer-hours")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            <ReadOnlyField label={t("hoursLabel")} value={t("hoursValue", { hours: form.volunteerHours })} />
          </ReviewSection>
        )}

        {!dynamicConfig && hasMeasurement && (
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

        {!dynamicConfig && hasImpact && form.impactDescription && (
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

        {!dynamicConfig && hasRegion && form.locationResult && (
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

        {!dynamicConfig && hasContributors && form.contributors.length > 0 && (
          <ReviewSection
            label={t("contributorsSection")}
            stepIndex={idx("contributors")}
            onEdit={onGoToStep}
            showEdit={showEdit}
          >
            <ContributorsList ids={form.contributors} users={users} />
          </ReviewSection>
        )}

        {!dynamicConfig && hasSiteDetails && (
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
