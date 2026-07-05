"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { useTranslations } from "next-intl";
import LocationPicker, { type LocationResult } from "@/components/ui/LocationPicker";
import { FieldGroup, SaveButton, ToggleCard } from "../shared";
import type { ApiTemplateFormField } from "@/lib/types/challenges";

export type DynamicValues = Record<string, unknown>;

type Props = {
  fields: ApiTemplateFormField[];
  values: DynamicValues;
  update: (name: string, value: unknown) => void;
  onNext: () => void;
  nextLabel: string;
  // Fields greyed out because a mutually exclusive field is filled
  disabledFields?: Set<string>;
  disabledHint?: string;
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

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? "border-gotf-green bg-gotf-green" : "border-[#ccc]"
      }`}
    >
      {checked && <div className="size-2.5 bg-white rounded-[2px]" />}
    </div>
  );
}

function ImageField({
  field,
  value,
  onSelect,
  onClear,
}: {
  field: ApiTemplateFormField;
  value: File | null;
  onSelect: (f: File) => void;
  onClear: () => void;
}) {
  const t = useTranslations("challenges");
  const ref = useRef<HTMLInputElement>(null);

  return (
    <FieldGroup label={field.label} required={field.required}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="relative w-full h-44 rounded-[8px] overflow-hidden border border-[rgba(26,26,24,0.14)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={URL.createObjectURL(value)}
            alt=""
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 size-7 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="w-full border-[1.5px] border-dashed border-[rgba(26,26,24,0.28)] rounded-[12px] py-8 flex flex-col items-center gap-2"
        >
          <div className="size-11 rounded-[8px] bg-[#f0efeb] flex items-center justify-center">
            <Camera size={22} className="text-[#5c5c59]" />
          </div>
          <p className="text-[14px] font-semibold text-text-primary">{t("tapToUploadFiles")}</p>
        </button>
      )}
    </FieldGroup>
  );
}

export default function DynamicFieldsStep({ fields, values, update, onNext, nextLabel, disabledFields, disabledHint }: Props) {
  const t = useTranslations("challenges");

  return (
    <>
      <div className="flex flex-col gap-5 px-5 mt-7 flex-1">
        {fields.map((field) => {
          const value = values[field.name];
          const activeUnit = (values[`${field.name}__unit`] as string | undefined)
            ?? field.unitOfMeasureOptions?.[0]?.value;

          // ── TOGGLE / BOOLEAN ────────────────────────────────────────────────
          if (field.type === "TOGGLE" || field.type === "BOOLEAN") {
            return (
              <ToggleCard
                key={field.name}
                label={field.label}
                description=""
                checked={(value as boolean) ?? false}
                onChange={() => update(field.name, !((value as boolean) ?? false))}
              />
            );
          }

          // ── SELECT ──────────────────────────────────────────────────────────
          if (field.type === "SELECT") {
            return (
              <FieldGroup key={field.name} label={field.label} required={field.required}>
                <div className="flex flex-col gap-2">
                  {(field.options ?? []).length === 0 ? (
                    <p className="text-sm text-text-muted py-2 px-1">{t("noOptionsAvailable")}</p>
                  ) : (
                    field.options!.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => update(field.name, opt.value)}
                        className={`flex items-center justify-between h-[50px] px-5 rounded-[8px] border transition-colors ${
                          value === opt.value
                            ? "border-gotf-green"
                            : "border-[rgba(26,26,24,0.28)]"
                        }`}
                      >
                        <span className="text-base text-text-primary">{opt.label}</span>
                        <RadioDot selected={value === opt.value} />
                      </button>
                    ))
                  )}
                </div>
              </FieldGroup>
            );
          }

          // ── MULTISELECT ─────────────────────────────────────────────────────
          if (field.type === "MULTISELECT") {
            const selected = (value as string[]) ?? [];
            return (
              <FieldGroup key={field.name} label={field.label} required={field.required}>
                <div className="flex flex-col gap-2">
                  {(field.options ?? []).map((opt) => {
                    const isChecked = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          update(
                            field.name,
                            isChecked
                              ? selected.filter((v) => v !== opt.value)
                              : [...selected, opt.value],
                          )
                        }
                        className={`flex items-center justify-between h-[50px] px-5 rounded-[8px] border transition-colors ${
                          isChecked ? "border-gotf-green" : "border-[rgba(26,26,24,0.28)]"
                        }`}
                      >
                        <span className="text-base text-text-primary">{opt.label}</span>
                        <CheckBox checked={isChecked} />
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            );
          }

          // ── NUMBER / NUMERIC ────────────────────────────────────────────────
          if (field.type === "NUMBER" || field.type === "NUMERIC") {
            const isDisabled = disabledFields?.has(field.name) ?? false;
            return (
              <FieldGroup key={field.name} label={field.label} required={field.required}>
                <div
                  className={`w-full flex items-center border border-[rgba(26,26,24,0.28)] rounded-[8px] overflow-hidden transition-opacity ${
                    isDisabled ? "opacity-40" : ""
                  }`}
                >
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    disabled={isDisabled}
                    value={(value as string) ?? ""}
                    onChange={(e) => update(field.name, e.target.value)}
                    placeholder="0"
                    className="flex-1 min-w-0 h-[44px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none bg-white disabled:bg-[#f0efeb]"
                  />
                  {field.unitOfMeasureOptions && field.unitOfMeasureOptions.length > 1 ? (
                    <div className="relative h-[44px] shrink-0">
                      <select
                        value={activeUnit}
                        disabled={isDisabled}
                        onChange={(e) => update(`${field.name}__unit`, e.target.value)}
                        className="h-full w-24 bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)] px-2 text-xs font-semibold text-[#5c5c59] outline-none appearance-none cursor-pointer pr-5"
                      >
                        {field.unitOfMeasureOptions.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5c5c59] pointer-events-none text-[10px]">
                        ▾
                      </div>
                    </div>
                  ) : activeUnit ? (
                    <div className="h-[44px] px-4 flex items-center bg-[#f0efeb] border-l border-[rgba(26,26,24,0.14)]">
                      <span className="text-xs font-semibold text-[#5c5c59]">{activeUnit}</span>
                    </div>
                  ) : null}
                </div>
                {isDisabled && disabledHint && (
                  <p className="text-xs text-text-muted mt-1.5">{disabledHint}</p>
                )}
              </FieldGroup>
            );
          }

          // ── DATE ────────────────────────────────────────────────────────────
          if (field.type === "DATE") {
            // Evidence dates record when an activity happened — never the future
            const today = new Date().toLocaleDateString("en-CA");
            return (
              <FieldGroup key={field.name} label={field.label} required={field.required}>
                <div className="w-full overflow-hidden">
                  <input
                    type="date"
                    max={today}
                    value={(value as string) ?? ""}
                    onChange={(e) => update(field.name, e.target.value > today ? today : e.target.value)}
                    className="w-full max-w-full h-[44px] border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary outline-none bg-white"
                  />
                </div>
              </FieldGroup>
            );
          }

          // ── TEXTAREA ────────────────────────────────────────────────────────
          if (field.type === "TEXTAREA") {
            return (
              <FieldGroup key={field.name} label={field.label} required={field.required}>
                <textarea
                  value={(value as string) ?? ""}
                  onChange={(e) => update(field.name, e.target.value)}
                  rows={4}
                  placeholder={field.label}
                  className="w-full min-w-0 border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 py-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none resize-none"
                />
              </FieldGroup>
            );
          }

          // ── LOCATION ────────────────────────────────────────────────────────
          if (field.type === "LOCATION") {
            return (
              <FieldGroup key={field.name} label={field.label} required={field.required}>
                <LocationPicker
                  defaultValue={(value as LocationResult | null)?.formattedAddress}
                  onSelect={(loc) => update(field.name, loc)}
                />
              </FieldGroup>
            );
          }

          // ── IMAGE ────────────────────────────────────────────────────────────
          if (field.type === "IMAGE") {
            return (
              <ImageField
                key={field.name}
                field={field}
                value={(value as File | null) ?? null}
                onSelect={(f) => update(field.name, f)}
                onClear={() => update(field.name, null)}
              />
            );
          }

          // ── LOCATION_LIST (not yet supported) ────────────────────────────────
          if (field.type === "LOCATION_LIST") {
            return (
              <FieldGroup key={field.name} label={field.label} required={field.required}>
                <p className="text-sm text-text-muted py-2 px-1">{t("locationListComingSoon")}</p>
              </FieldGroup>
            );
          }

          // ── TEXT (default) ──────────────────────────────────────────────────
          return (
            <FieldGroup key={field.name} label={field.label} required={field.required}>
              <input
                type="text"
                value={(value as string) ?? ""}
                onChange={(e) => update(field.name, e.target.value)}
                placeholder={field.label}
                className="w-full min-w-0 h-[44px] border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none"
              />
            </FieldGroup>
          );
        })}
      </div>

      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
