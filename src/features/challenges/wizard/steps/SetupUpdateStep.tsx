"use client";

import { useTranslations } from "next-intl";
import type { ApiTemplateFormField, ChallengeSetupAnchorPoint } from "@/lib/types/challenges";
import { FieldGroup, SaveButton, ToggleCard } from "../shared";
import type { DynamicValues } from "./DynamicFieldsStep";

// One observation per submission: the selected point + its new reading.
// `selected` is the point's name — points have no dedicated id; name (with
// location.placeId in the payload) is the identity the BE matches on.
export type SetupUpdateEntry = {
  selected: string;
  measurement: string;
  higherRiskFlag: boolean;
};

type Props = {
  // The consumed SELECT field — provides the label and the values key
  pointsField: ApiTemplateFormField;
  // Optional per-point toggle (e.g. higher-risk flag)
  flagField?: ApiTemplateFormField;
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
// points (read-only identity), then record its new measurement. One submission
// covers one observation of one point.
export default function SetupUpdateStep({
  pointsField,
  flagField,
  anchorPoints,
  values,
  update,
  onNext,
  nextLabel,
  selectionOnly,
}: Props) {
  const t = useTranslations("challenges");

  const entry = values[pointsField.name] as SetupUpdateEntry | undefined;

  const selectPoint = (point: ChallengeSetupAnchorPoint) => {
    if (entry?.selected === point.name) return;
    update(pointsField.name, {
      selected: point.name,
      measurement: "",
      higherRiskFlag: point.higherRiskFlag ?? false,
    } satisfies SetupUpdateEntry);
  };

  const patchEntry = (patch: Partial<SetupUpdateEntry>) => {
    if (!entry) return;
    update(pointsField.name, { ...entry, ...patch });
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
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-primary">
                          {t("newReading")}
                        </label>
                        <div className="w-full flex items-center border border-[rgba(26,26,24,0.28)] rounded-[8px] overflow-hidden">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={entry?.measurement ?? ""}
                            onChange={(e) => patchEntry({ measurement: e.target.value })}
                            placeholder="0"
                            className="flex-1 min-w-0 h-[44px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none bg-white"
                          />
                          {point.measurement?.unitOfMeasure && (
                            <div className="h-[44px] px-4 flex items-center bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)]">
                              <span className="text-xs font-semibold text-[#5c5c59]">
                                {point.measurement.unitOfMeasure}
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
