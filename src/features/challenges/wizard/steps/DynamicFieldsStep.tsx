"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Camera, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import LocationPicker, { type LocationResult } from "@/components/ui/LocationPicker";
import { compressImage, MAX_UPLOAD_BYTES } from "@/lib/compressImage";
import { FieldGroup, SaveButton, ToggleCard } from "../shared";
import type { ApiTemplateFormField } from "@/lib/types/challenges";

export type DynamicValues = Record<string, unknown>;

// A required field counts as filled once it has a real value — MULTISELECT
// needs a non-empty array, addable inputs need at least one non-blank
// entry, and GROUP needs at least one entry whose own required subfields
// are all filled. TOGGLE/BOOLEAN are always "filled" — false is a valid
// answer, not missing data.
function isFieldFilled(field: ApiTemplateFormField, value: unknown): boolean {
  if (field.type === "TOGGLE" || field.type === "BOOLEAN") return true;
  if (field.type === "MULTISELECT") return Array.isArray(value) && value.length > 0;
  if (field.type === "GROUP" || field.type === "ITEM") {
    const entries = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    if (!entries.length) return false;
    return entries.every((entry) =>
      (field.fields ?? []).every((sub) => !sub.required || isFieldFilled(sub, entry[sub.name])),
    );
  }
  if (field.addableInput) {
    const arr = Array.isArray(value) ? value : [];
    return arr.some((v) => v !== undefined && v !== null && v !== "");
  }
  return value !== undefined && value !== null && value !== "";
}

type Props = {
  fields: ApiTemplateFormField[];
  values: DynamicValues;
  update: (name: string, value: unknown) => void;
  onNext: () => void;
  nextLabel: string;
  // Fields greyed out because a mutually exclusive field is filled
  disabledFields?: Set<string>;
  disabledHint?: string;
  // Shown above the fields — e.g. explaining that entries below were
  // prefilled from a prior submission and can be edited or added to
  resumeHint?: string;
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
  compact,
}: {
  field: ApiTemplateFormField;
  // string = already-uploaded media URL (editing an existing submission);
  // { url } = a resumed anchor point's mediaFile object (see
  // LogEvidenceWizard's anchorPointToEntry) — same idea, different shape
  value: File | string | { url: string } | null;
  onSelect: (f: File) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  const t = useTranslations("challenges");
  const ref = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const previewSrc =
    typeof value === "string"
      ? value
      : value instanceof File
        ? URL.createObjectURL(value)
        : value && typeof value === "object" && "url" in value
          ? value.url
          : null;

  return (
    <FieldGroup label={field.label} required={field.required} compact={compact}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          // Phone photos exceed the API's 1MB body limit; compress before storing
          const processed = await compressImage(f).catch(() => f);
          if (processed.size > MAX_UPLOAD_BYTES) {
            setSizeError(t("fileTooLarge", { name: f.name }));
            return;
          }
          setSizeError(null);
          onSelect(processed);
        }}
      />
      {/* A corrupted draft (an old File value JSON.stringify'd away to "{}")
          can land here as neither a File, URL string, nor {url} object —
          treat that the same as no value instead of showing a broken image */}
      {previewSrc ? (
        <div className="relative w-full h-44 rounded-[8px] overflow-hidden border border-[rgba(26,26,24,0.14)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
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
      {sizeError && (
        <div className="flex items-center gap-1 text-[#a32d2d] mt-1.5">
          <AlertTriangle size={13} className="shrink-0" />
          <span className="text-xs">{sizeError}</span>
        </div>
      )}
    </FieldGroup>
  );
}

// Renders a single form field. Used for top-level fields, for the
// sub-fields inside GROUP entries (which bind into the entry object), and
// by SetupUpdateStep for the per-point fields inside a selected anchor card.
export function FieldControl({
  field,
  value,
  unitValue,
  onChange,
  onUnitChange,
  disabled = false,
  disabledHint,
  compact,
}: {
  field: ApiTemplateFormField;
  value: unknown;
  unitValue?: string;
  onChange: (value: unknown) => void;
  onUnitChange: (unit: string) => void;
  disabled?: boolean;
  disabledHint?: string;
  // Smaller field labels — for rendering inside a card (setup-update)
  compact?: boolean;
}) {
  const t = useTranslations("challenges");
  const activeUnit = unitValue ?? field.unitOfMeasureOptions?.[0]?.value;

  // ── TOGGLE / BOOLEAN ────────────────────────────────────────────────
  if (field.type === "TOGGLE" || field.type === "BOOLEAN") {
    return (
      <ToggleCard
        label={field.label}
        description=""
        checked={(value as boolean) ?? false}
        onChange={() => onChange(!((value as boolean) ?? false))}
      />
    );
  }

  // ── SELECT ──────────────────────────────────────────────────────────
  if (field.type === "SELECT") {
    return (
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        <div className="flex flex-col gap-2">
          {(field.options ?? []).length === 0 ? (
            <p className="text-sm text-text-muted py-2 px-1">{t("noOptionsAvailable")}</p>
          ) : (
            field.options!.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
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
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        <div className="flex flex-col gap-2">
          {(field.options ?? []).map((opt) => {
            const isChecked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() =>
                  onChange(
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
    const numberInput = (val: string, onValueChange: (v: string) => void) => (
      <div
        className={`w-full flex items-center border border-[rgba(26,26,24,0.28)] rounded-[8px] overflow-hidden transition-opacity ${
          disabled ? "opacity-40" : ""
        }`}
      >
        <input
          type="number"
          inputMode="decimal"
          min="0"
          disabled={disabled}
          value={val}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={field.placeholder ?? "0"}
          className="flex-1 min-w-0 h-[44px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none bg-white disabled:bg-[#f0efeb]"
        />
        {field.unitOfMeasureOptions && field.unitOfMeasureOptions.length > 1 ? (
          <div className="relative h-[44px] shrink-0">
            <select
              value={activeUnit}
              disabled={disabled}
              onChange={(e) => onUnitChange(e.target.value)}
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
    );

    // Addable: value is an array — one input row per entry, plus add/remove
    if (field.addableInput) {
      const entries = Array.isArray(value)
        ? (value as string[])
        : value !== undefined && value !== null && value !== ""
          ? [value as string]
          : [""];
      return (
        <FieldGroup label={field.label} required={field.required} compact={compact}>
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                {numberInput(entry, (v) => {
                  const next = [...entries];
                  next[i] = v;
                  onChange(next);
                })}
                {entries.length > 1 && (
                  <button
                    onClick={() => onChange(entries.filter((_, j) => j !== i))}
                    disabled={disabled}
                    className="size-8 shrink-0 rounded-full flex items-center justify-center border border-[rgba(26,26,24,0.28)]"
                    aria-label={t("removeEntry")}
                  >
                    <X size={14} className="text-[#5c5c59]" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => onChange([...entries, ""])}
              disabled={disabled}
              className="self-start text-sm font-semibold text-gotf-green py-1"
            >
              + {t("addAnother")}
            </button>
          </div>
          {disabled && disabledHint && (
            <p className="text-xs text-text-muted mt-1.5">{disabledHint}</p>
          )}
        </FieldGroup>
      );
    }

    return (
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        {numberInput((value as string) ?? "", (v) => onChange(v))}
        {disabled && disabledHint && (
          <p className="text-xs text-text-muted mt-1.5">{disabledHint}</p>
        )}
      </FieldGroup>
    );
  }

  // ── DATE ────────────────────────────────────────────────────────────
  if (field.type === "DATE") {
    return (
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        <div className="w-full overflow-hidden">
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full max-w-full h-[44px] border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary outline-none bg-white"
          />
        </div>
      </FieldGroup>
    );
  }

  // ── TIME ────────────────────────────────────────────────────────────
  if (field.type === "TIME") {
    return (
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        <div className="w-full overflow-hidden">
          <input
            type="time"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full max-w-full h-[44px] border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary outline-none bg-white"
          />
        </div>
      </FieldGroup>
    );
  }

  // ── TEXTAREA ────────────────────────────────────────────────────────
  if (field.type === "TEXTAREA" || field.type === "LIST") {
    return (
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder ?? field.label}
          className="w-full min-w-0 border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 py-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none resize-none"
        />
      </FieldGroup>
    );
  }

  // ── LOCATION ────────────────────────────────────────────────────────
  if (field.type === "LOCATION") {
    const loc = value as LocationResult | null | undefined;
    return (
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        <LocationPicker
          defaultValue={loc?.formattedAddress}
          onSelect={(l) => onChange(l)}
          showUseCurrent
          showMapPick
          initialCenter={loc ? { lat: loc.latitude, lng: loc.longitude } : null}
        />
      </FieldGroup>
    );
  }

  // ── IMAGE ────────────────────────────────────────────────────────────
  if (field.type === "IMAGE") {
    return (
      <ImageField
        field={field}
        value={(value as File | string | { url: string } | null) ?? null}
        onSelect={(f) => onChange(f)}
        onClear={() => onChange(null)}
        compact={compact}
      />
    );
  }

  // ── LOCATION_LIST (not yet supported) ────────────────────────────────
  if (field.type === "LOCATION_LIST") {
    return (
      <FieldGroup label={field.label} required={field.required} compact={compact}>
        <p className="text-sm text-text-muted py-2 px-1">{t("locationListComingSoon")}</p>
      </FieldGroup>
    );
  }

  // ── TEXT (default) ──────────────────────────────────────────────────
  return (
    <FieldGroup label={field.label} required={field.required} compact={compact}>
      <input
        type="text"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? field.label}
        className="w-full min-w-0 h-[44px] border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none"
      />
    </FieldGroup>
  );
}

// GROUP — a sub-form; addable groups repeat as collapsible entry cards
function GroupField({
  field,
  value,
  update,
  compact,
}: {
  field: ApiTemplateFormField;
  value: unknown;
  update: (name: string, value: unknown) => void;
  compact?: boolean;
}) {
  const t = useTranslations("challenges");
  // Entries loaded with existing data (viewing/editing a submitted activity)
  // start expanded so all of it is visible at once, matching the review
  // screen; a fresh blank entry starts expanded too, since there's nothing
  // to hide
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const initial =
      Array.isArray(value) && value.length ? (value as Record<string, unknown>[]) : [{}];
    const withData = initial
      .map((entry, i) => [i, entry] as const)
      .filter(([, entry]) => Object.values(entry).some((v) => v !== undefined && v !== null && v !== ""));
    return withData.length ? new Set(withData.map(([i]) => i)) : new Set([0]);
  });
  // Index of the entry whose remove button is awaiting a confirming second tap
  const [confirmingRemove, setConfirmingRemove] = useState<number | null>(null);

  const subFields = [...(field.fields ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  const nameField = subFields.find((f) => f.type === "TEXT");
  const entries: Record<string, unknown>[] =
    Array.isArray(value) && value.length ? (value as Record<string, unknown>[]) : [{}];

  const setEntry = (i: number, patch: Record<string, unknown>) =>
    update(field.name, entries.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const toggleEntry = (i: number) => {
    setConfirmingRemove(null);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const addEntry = () => {
    setConfirmingRemove(null);
    update(field.name, [...entries, {}]);
    setExpanded((prev) => new Set(prev).add(entries.length));
  };

  const removeEntry = (i: number) => {
    setConfirmingRemove(null);
    update(field.name, entries.filter((_, j) => j !== i));
    // Re-key expanded indices after the removed entry shifts them down
    setExpanded((prev) => {
      const next = new Set<number>();
      prev.forEach((j) => {
        if (j < i) next.add(j);
        else if (j > i) next.add(j - 1);
      });
      return next;
    });
  };

  // Empty cards remove on first tap; filled ones need a confirming second tap
  const handleRemoveTap = (i: number, entry: Record<string, unknown>) => {
    const hasData = Object.values(entry).some((v) => v !== undefined && v !== null && v !== "");
    if (!hasData || confirmingRemove === i) removeEntry(i);
    else setConfirmingRemove(i);
  };

  return (
    <FieldGroup label={field.label} required={field.required} compact={compact}>
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => {
          const isExpanded = expanded.has(i);
          const title = ((nameField ? entry[nameField.name] : "") as string) || `#${i + 1}`;
          return (
            <div key={i} className="border border-[rgba(26,26,24,0.14)] rounded-[12px] overflow-hidden">
              <div className="flex items-center px-4 py-3 gap-2">
                <button
                  onClick={() => toggleEntry(i)}
                  className="flex-1 min-w-0 flex items-center gap-2"
                >
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#5c5c59] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                  <span className="text-base font-semibold text-text-primary truncate">{title}</span>
                </button>
                {entries.length > 1 && (
                  confirmingRemove === i ? (
                    <button
                      onClick={() => removeEntry(i)}
                      className="h-7 shrink-0 rounded-full flex items-center px-3 bg-red-600 text-white text-xs font-semibold"
                    >
                      {t("removeEntry")}?
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoveTap(i, entry)}
                      className="size-7 shrink-0 rounded-full flex items-center justify-center border border-[rgba(26,26,24,0.28)] bg-white"
                      aria-label={t("removeEntry")}
                    >
                      <X size={14} className="text-[#5c5c59]" />
                    </button>
                  )
                )}
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 flex flex-col gap-5">
                  {subFields.map((sub) =>
                    sub.type === "GROUP" || sub.type === "ITEM" ? (
                      <GroupField
                        key={sub.name}
                        field={sub}
                        value={entry[sub.name]}
                        update={(name, v) => setEntry(i, { [name]: v })}
                        compact
                      />
                    ) : (
                      <FieldControl
                        key={sub.name}
                        field={sub}
                        value={entry[sub.name]}
                        unitValue={entry[`${sub.name}__unit`] as string | undefined}
                        onChange={(v) => setEntry(i, { [sub.name]: v })}
                        onUnitChange={(u) => setEntry(i, { [`${sub.name}__unit`]: u })}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
        {field.addableInput && (
          <button onClick={addEntry} className="self-start text-sm font-semibold text-gotf-green py-1">
            + {t("addAnother")}
          </button>
        )}
      </div>
    </FieldGroup>
  );
}

export default function DynamicFieldsStep({ fields, values, update, onNext, nextLabel, disabledFields, disabledHint, resumeHint }: Props) {
  // Fields greyed out by a mutually exclusive field don't block Next —
  // they're not the ones the user is meant to fill in right now.
  const missingRequired = fields.some(
    (field) =>
      field.required &&
      !(disabledFields?.has(field.name) ?? false) &&
      !isFieldFilled(field, values[field.name]),
  );

  return (
    <>
      <div className="flex flex-col gap-5 px-5 mt-7 flex-1">
        {resumeHint && (
          <p className="text-sm text-text-muted bg-[#f0efeb] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 py-2.5">
            {resumeHint}
          </p>
        )}
        {fields.map((field) => {
          if (field.type === "GROUP" || field.type === "ITEM") {
            return <GroupField key={field.name} field={field} value={values[field.name]} update={update} />;
          }

          return (
            <FieldControl
              key={field.name}
              field={field}
              value={values[field.name]}
              unitValue={values[`${field.name}__unit`] as string | undefined}
              onChange={(v) => update(field.name, v)}
              onUnitChange={(u) => update(`${field.name}__unit`, u)}
              disabled={disabledFields?.has(field.name) ?? false}
              disabledHint={disabledHint}
            />
          );
        })}
      </div>

      <SaveButton label={nextLabel} onClick={onNext} disabled={missingRequired} />
    </>
  );
}
