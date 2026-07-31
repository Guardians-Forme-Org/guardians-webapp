"use client";

import { useTranslations } from "next-intl";
import type { ApiTemplateFormField, ChallengeSetupAnchorPoint } from "@/lib/types/challenges";
import { FieldGroup, SaveButton, ToggleCard } from "../shared";
import appConfig from "../../../../../config.json";
import { FieldControl, type DynamicValues } from "./DynamicFieldsStep";
import { DEDICATED_MEASUREMENT_NAMES, normalizeFieldName } from "../../lib/deriveWizardConfig";

// Compact (smaller) labels for the per-point fields inside a selected
// anchor card — flip config.json's compactDetailFields to false to compare
// against the wizard's standard full-size field labels.
const COMPACT_DETAIL_FIELDS = appConfig.compactDetailFields;

// One observation per submission: the selected point + its per-field values.
// `selected` is the point's name — points have no dedicated id; name (with
// location.placeId in the payload) is the identity the BE matches on.
export type SetupUpdateEntry = {
  selected: string;
  higherRiskFlag: boolean;
  // Keyed by detailFields[].name (plus `${name}__unit` companions) — the
  // point's per-visit reading(s)
  values: Record<string, unknown>;
};

type Props = {
  // The consumed SELECT field — provides the label and the values key
  pointsField: ApiTemplateFormField;
  // Optional per-point toggle (e.g. higher-risk flag)
  flagField?: ApiTemplateFormField;
  // The anchor reference's per-visit fields — rendered inline in the
  // selected point's card. The first NUMBER field (if any) is the point's
  // primary reading: the BE has one generic Measurement slot per point,
  // regardless of what the template calls it (temperature, water level, …).
  detailFields?: ApiTemplateFormField[];
  anchorPoints: ChallengeSetupAnchorPoint[];
  values: DynamicValues;
  update: (name: string, value: unknown) => void;
  onNext: () => void;
  nextLabel: string;
  // Pick a point only — no new reading here (per-point data, if any, is
  // collected on the screens that follow)
  selectionOnly?: boolean;
};

function RadioDot({ selected }: { selected: boolean }) {
  return selected ? (
    <div className="size-5 rounded-full border-2 border-gotf-green flex items-center justify-center shrink-0">
      <div className="size-2.5 rounded-full bg-gotf-green" />
    </div>
  ) : (
    <div className="size-5 rounded-full border-2 border-[#ccc] shrink-0" />
  );
}

// Re-measure a point registered during the setup step: pick one of the fixed
// points (read-only identity), then record its new reading(s) inline. One
// submission covers one observation of one point.
export default function SetupUpdateStep({
  pointsField,
  flagField,
  detailFields = [],
  anchorPoints,
  values,
  update,
  onNext,
  nextLabel,
  selectionOnly,
}: Props) {
  const t = useTranslations("challenges");

  const entry = values[pointsField.name] as SetupUpdateEntry | undefined;

  // A single NUMBER field is the point's one generic reading (BE has one
  // Measurement slot per point for templates with no dedicated field of
  // their own — CH-001's temperature, CH-008A's water level). A step with
  // several NUMBER fields (CH-008B's litres collected/distributed,
  // households, …) is a structured report, not a single reading — each
  // field has its own dedicated slot in the Go Data struct, so none of them
  // get the generic "New reading" treatment.
  const numberFields = detailFields.filter((f) => f.type === "NUMBER" || f.type === "NUMERIC");
  const primaryField =
    numberFields.length === 1 &&
    !DEDICATED_MEASUREMENT_NAMES.has(normalizeFieldName(numberFields[0].name))
      ? numberFields[0]
      : undefined;
  const otherFields = detailFields.filter((f) => f !== primaryField);

  const selectPoint = (point: ChallengeSetupAnchorPoint) => {
    if (entry?.selected === point.name) return;
    update(pointsField.name, {
      selected: point.name,
      higherRiskFlag: point.higherRiskFlag ?? false,
      values: {},
    } satisfies SetupUpdateEntry);
  };

  const patchEntry = (patch: Partial<SetupUpdateEntry>) => {
    if (!entry) return;
    update(pointsField.name, { ...entry, ...patch });
  };

  const patchValue = (name: string, value: unknown) => {
    if (!entry) return;
    update(pointsField.name, { ...entry, values: { ...entry.values, [name]: value } });
  };

  return (
    <>
      <div className="flex flex-col gap-5 px-5 mt-7 flex-1">
        <FieldGroup label={pointsField.label} required={pointsField.required}>
          <div className="flex flex-col gap-3">
            {anchorPoints.length === 0 && (
              <p className="text-sm text-text-muted">{t("noAnchorPoints")}</p>
            )}
            {anchorPoints.map((point, i) => {
              const isSelected = entry?.selected === point.name;
              return (
                <div
                  key={i}
                  className={`border rounded-[12px] overflow-hidden transition-colors ${
                    isSelected ? "border-gotf-green" : "border-[rgba(26,26,24,0.14)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectPoint(point)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <RadioDot selected={isSelected} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-text-primary truncate">
                        {point.name}
                      </p>
                      {point.location?.formattedAddress && (
                        <p className="text-sm text-text-muted mt-0.5 truncate">
                          {point.location.formattedAddress}
                        </p>
                      )}
                    </div>
                  </button>

                  {isSelected && !selectionOnly && (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                      {primaryField && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-text-primary">
                            {t("newReading")}
                          </label>
                          <div className="w-full flex items-center border border-[rgba(26,26,24,0.28)] rounded-[8px] overflow-hidden">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={(entry?.values?.[primaryField.name] as string) ?? ""}
                              onChange={(e) => patchValue(primaryField.name, e.target.value)}
                              placeholder="0"
                              className="flex-1 min-w-0 h-[44px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none bg-white"
                            />
                            {(point.measurement?.unitOfMeasure ||
                              primaryField.unitOfMeasureOptions?.[0]?.value) && (
                              <div className="h-[44px] px-4 flex items-center bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)]">
                                <span className="text-xs font-semibold text-[#5c5c59]">
                                  {point.measurement?.unitOfMeasure ??
                                    primaryField.unitOfMeasureOptions?.[0]?.value}
                                </span>
                              </div>
                            )}
                          </div>
                          {point.measurement && (
                            <p className="text-xs text-text-muted">
                              {t("lastReading", {
                                value: `${point.measurement.value} ${point.measurement.unitOfMeasure}`,
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {otherFields.map((field) => (
                        <FieldControl
                          key={field.name}
                          field={field}
                          value={entry?.values?.[field.name]}
                          unitValue={entry?.values?.[`${field.name}__unit`] as string | undefined}
                          onChange={(v) => patchValue(field.name, v)}
                          onUnitChange={(u) => patchValue(`${field.name}__unit`, u)}
                          compact={COMPACT_DETAIL_FIELDS}
                        />
                      ))}

                      {flagField && (
                        <ToggleCard
                          label={flagField.label}
                          description=""
                          checked={entry?.higherRiskFlag ?? false}
                          onChange={() =>
                            patchEntry({ higherRiskFlag: !(entry?.higherRiskFlag ?? false) })
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FieldGroup>
      </div>

      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
