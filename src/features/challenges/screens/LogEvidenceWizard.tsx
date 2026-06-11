"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  X,
  Camera,
  Upload,
  AlertTriangle,
  ExternalLink,
  Plus,
  Minus,
  CheckCircle,
} from "lucide-react";
import LocationPicker, { type LocationResult } from "@/components/ui/LocationPicker";
import Text from "@/components/ui/Text";

// ── Types ─────────────────────────────────────────────────────────────────────

type Intervention = { id: number; name: string; count: number };

type LogFormData = {
  // Step 1
  siteName: string;
  permissionHolder: string;
  permissionConfirmed: boolean;
  markComplete: boolean;
  // Step 2
  locationResult: LocationResult | null;
  baselinePhoto: string;
  plantingPhoto: string;
  // Step 3
  estimatedArea: string;
  areaUnit: "m²" | "ha" | "km²" | "acres";
  siteCondition: string;
  surfaceType: string;
  greenSurfaceType: string;
  // Step 4
  interventions: Intervention[];
};

const GREEN_SURFACE_OPTIONS = [
  "Garden bed",
  "Food garden",
  "Lawn / grass",
  "Tree planting",
  "Shrub planting",
  "Wetland / pond",
  "Other",
];

const SURFACE_TYPE_OPTIONS = [
  "Concrete / paving",
  "Bare soil",
  "Gravel",
  "Asphalt",
  "Rubble",
  "Existing vegetation",
];

// ── Shared primitives ─────────────────────────────────────────────────────────

function WizardHeader({
  step,
  total = 5,
  onBack,
  onClose,
}: {
  step: number;
  total?: number;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="px-5 pt-8">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="size-10 flex items-center" aria-label="Back">
          <ChevronLeft size={20} className="text-text-muted" />
        </button>
        <button onClick={onClose} className="size-10 flex items-center justify-end" aria-label="Close">
          <X size={20} className="text-text-muted" />
        </button>
      </div>
      <div className="flex gap-2.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full ${i < step ? "bg-gotf-green" : "bg-[#ccc]"}`}
          />
        ))}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-base font-medium text-text-primary tracking-[0.16px]">
          {label}
        </label>
        {required && <div className="size-1.5 rounded-full bg-[#d85a30] shrink-0" />}
        {!required && (
          <span className="text-[11px] text-[#8f8f8c] bg-[#f0efeb] border border-[rgba(26,26,24,0.14)] px-1.5 py-0.5 rounded">
            optional
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-[#8f8f8c]">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-[44px] bg-white border rounded-[8px] px-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none ${
          error ? "border-[#e24b4a]" : "border-[rgba(26,26,24,0.28)]"
        }`}
      />
      {error && (
        <div className="flex items-center gap-1 text-[#a32d2d]">
          <AlertTriangle size={13} />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`border border-[rgba(26,26,24,0.14)] rounded-[12px] p-[14.5px] flex gap-3 items-start ${
        disabled ? "opacity-65 bg-[#f0efeb]" : "bg-white"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-[#5c5c59] mt-1 leading-relaxed">{description}</p>
        {badge && (
          <div className="mt-2 inline-flex items-center gap-1 bg-[#faeeda] border border-[#fac775] rounded px-2 py-0.5">
            <AlertTriangle size={10} className="text-[#633806]" />
            <span className="text-[11px] font-semibold text-[#633806]">{badge}</span>
          </div>
        )}
      </div>
      {/* Toggle switch */}
      <button
        onClick={!disabled ? onChange : undefined}
        disabled={disabled}
        aria-checked={checked}
        role="switch"
        className={`relative shrink-0 w-11 h-[26px] rounded-full mt-0.5 transition-colors ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${checked ? "bg-gotf-green" : "bg-[#f0efeb] border border-[rgba(26,26,24,0.28)]"}`}
      >
        <div
          className={`absolute top-1 size-[18px] rounded-full transition-transform ${
            checked ? "bg-white translate-x-[18px]" : "bg-[#8f8f8c] translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function UploadZone({
  value,
  onChange,
  label,
  hint,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  hint: string;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const fileName = value ? value.split("/").pop() || "Uploaded" : null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(URL.createObjectURL(file));
  };

  if (fileName) {
    return (
      <FieldGroup label={label} hint={hint} required={required}>
        <div className="flex items-center gap-2.5 bg-white border border-[rgba(26,26,24,0.14)] rounded-[8px] p-2.5">
          <div className="size-11 rounded-[8px] bg-[#eaf3de] flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-gotf-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate">{fileName}</p>
            <p className="text-[11px] text-[#8f8f8c]">Uploaded</p>
          </div>
          <button
            onClick={() => onChange("")}
            className="size-9 flex items-center justify-center text-text-muted"
          >
            <X size={18} />
          </button>
        </div>
      </FieldGroup>
    );
  }

  return (
    <FieldGroup label={label} hint={hint} required={required}>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => ref.current?.click()}
        className={`w-full border-[1.5px] border-dashed rounded-[12px] py-6 flex flex-col items-center gap-2 ${
          required ? "border-[rgba(26,26,24,0.28)]" : "border-[rgba(26,26,24,0.14)]"
        }`}
      >
        <div className="size-11 rounded-[8px] bg-[#f0efeb] flex items-center justify-center">
          <Camera size={22} className="text-[#5c5c59]" />
        </div>
        <p className="text-[14px] font-semibold text-text-primary">Tap to upload</p>
        <p className="text-xs text-[#8f8f8c]">JPG, PNG, HEIF · max 10 MB</p>
        {required && (
          <span className="text-[11px] font-semibold text-[#791f1f] bg-[#fcebeb] border border-[#f7c1c1] rounded px-2 py-0.5">
            Required
          </span>
        )}
      </button>
    </FieldGroup>
  );
}

function InterventionRow({
  item,
  onChange,
  onRemove,
}: {
  item: Intervention;
  onChange: (updated: Intervention) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        placeholder="Species or intervention name"
        className="flex-1 h-[50px] bg-white border border-[#d9d9d9] rounded-[8px] px-3 text-base text-text-primary placeholder:text-[#bfbfbf] outline-none"
      />
      <div className="flex items-center border border-[rgba(26,26,24,0.28)] rounded-full h-10 overflow-hidden">
        <button
          onClick={() => onChange({ ...item, count: Math.max(0, item.count - 1) })}
          className="w-9 h-full bg-[#f0efeb] flex items-center justify-center text-[#5c5c59]"
        >
          <Minus size={14} />
        </button>
        <div className="w-9 h-full flex items-center justify-center border-x border-[rgba(26,26,24,0.14)]">
          <span className="text-[14px] font-semibold text-text-primary">{item.count}</span>
        </div>
        <button
          onClick={() => onChange({ ...item, count: item.count + 1 })}
          className="w-9 h-full bg-[#f0efeb] flex items-center justify-center text-[#5c5c59]"
        >
          <Plus size={14} />
        </button>
      </div>
      <button onClick={onRemove} className="size-9 flex items-center justify-center text-text-muted">
        <X size={18} />
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  status,
  statusColor,
  link,
}: {
  label: string;
  value: string;
  unit: string;
  status: string;
  statusColor: "amber" | "green";
  link: string;
}) {
  const badge =
    statusColor === "amber"
      ? "bg-[#faeeda] border-[#fac775] text-[#633806]"
      : "bg-[#eaf3de] border-[#c0dd97] text-[#27500a]";

  return (
    <div className="border border-[rgba(26,26,24,0.1)] rounded-[12px] p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#5c5c59]">{label}</p>
        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full tracking-[0.4px] ${badge}`}>
          {status}
        </span>
      </div>
      <div>
        <p className="text-[28px] font-semibold text-text-primary tracking-tight leading-tight">{value}</p>
        <p className="text-[13px] text-[#5c5c59]">{unit}</p>
      </div>
      <button className="flex items-center gap-1.5 text-[12px] text-[#1d9e75]">
        {link}
        <ExternalLink size={12} />
      </button>
    </div>
  );
}

function GateBanner({ message }: { message: string }) {
  return (
    <div className="bg-[#faeeda] border border-[#fac775] rounded-[8px] flex gap-2.5 items-start p-3">
      <AlertTriangle size={20} className="text-[#633806] shrink-0 mt-0.5" />
      <p className="text-[13px] text-[#633806] leading-relaxed">{message}</p>
    </div>
  );
}

function SaveButton({ label = "Save", onClick }: { label?: string; onClick: () => void }) {
  return (
    <div className="px-5 pb-8 pt-4 shrink-0">
      <button
        onClick={onClick}
        className="w-full h-14 bg-black text-white rounded-full text-xl font-medium"
      >
        {label}
      </button>
    </div>
  );
}

// ── Step 1 — Site Details & Baseline ─────────────────────────────────────────

function Step1({ form, update, onNext }: { form: LogFormData; update: (k: keyof LogFormData, v: unknown) => void; onNext: () => void }) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          Site Details<br />&amp; Baseline
        </h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <FieldGroup label="Site Name" hint="The official or colloquial name of this site" required>
          <TextInput
            value={form.siteName}
            onChange={(v) => update("siteName", v)}
            placeholder="e.g. Sandton Taxi Rank Verge"
          />
        </FieldGroup>

        <FieldGroup label="Permission Holder" hint="Name of the person or body that granted access">
          <TextInput
            value={form.permissionHolder}
            onChange={(v) => update("permissionHolder", v)}
            placeholder="Full name or organisation"
          />
        </FieldGroup>

        <ToggleCard
          label="Written permission confirmed"
          description="Confirm you have signed permission from the landowner before continuing."
          checked={form.permissionConfirmed}
          onChange={() => update("permissionConfirmed", !form.permissionConfirmed)}
        />

        <ToggleCard
          label="Mark challenge as complete"
          description="Unlocks after all three steps are validated."
          checked={form.markComplete}
          onChange={() => update("markComplete", !form.markComplete)}
          disabled={!form.permissionConfirmed}
          badge={!form.permissionConfirmed ? "Unlock after step 3" : undefined}
        />

        {!form.permissionConfirmed && (
          <GateBanner message="Written permission required. Toggle the switch above to continue to step 2." />
        )}
      </div>

      <div className="flex-1" />
      <SaveButton onClick={onNext} />
    </>
  );
}

// ── Step 2 — Site Description (location + photos) ─────────────────────────────

function Step2({ form, update, onNext }: { form: LogFormData; update: (k: keyof LogFormData, v: unknown) => void; onNext: () => void }) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">Site Description</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <FieldGroup label="Location" required>
          <LocationPicker
            defaultValue={form.locationResult?.formattedAddress ?? ""}
            onSelect={(place) => update("locationResult", place)}
            placeholder="Find the location"
            className="w-full h-[44px] bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 pr-10 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none"
          />
        </FieldGroup>

        <UploadZone
          label="Baseline Photo(s)"
          hint="Clear photo showing the site before any work begins"
          required
          value={form.baselinePhoto}
          onChange={(v) => update("baselinePhoto", v)}
        />

        <UploadZone
          label="Planting Photo"
          hint="Photo showing species being planted"
          value={form.plantingPhoto}
          onChange={(v) => update("plantingPhoto", v)}
        />
      </div>

      <div className="flex-1" />
      <SaveButton onClick={onNext} />
    </>
  );
}

// ── Step 3 — Site Description (measurements + surface) ───────────────────────

function Step3({ form, update, onNext }: { form: LogFormData; update: (k: keyof LogFormData, v: unknown) => void; onNext: () => void }) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black leading-tight">Site Description</h1>
      </div>

      <div className="flex flex-col gap-5 px-5">
        <FieldGroup label="Estimated Site Area" hint="Total footprint of the site boundary" required>
          <div className="flex">
            <input
              type="number"
              value={form.estimatedArea}
              onChange={(e) => update("estimatedArea", e.target.value)}
              placeholder="0"
              className="flex-1 h-[44px] bg-white border border-r-0 border-[rgba(26,26,24,0.28)] rounded-l-[8px] px-3 text-base text-text-primary outline-none"
            />
            <div className="relative h-[44px] shrink-0">
              <select
                value={form.areaUnit}
                onChange={(e) => update("areaUnit", e.target.value)}
                className="h-full w-20 bg-[#f0efeb] border border-[rgba(26,26,24,0.28)] rounded-r-[8px] px-2 text-xs font-semibold text-[#5c5c59] outline-none appearance-none cursor-pointer pr-5"
              >
                <option value="m²">m²</option>
                <option value="ha">ha</option>
                <option value="km²">km²</option>
                <option value="acres">acres</option>
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5c5c59] pointer-events-none text-[10px]">▾</div>
            </div>
          </div>
        </FieldGroup>

        <FieldGroup
          label="Current Site Condition"
          hint="Describe the site before any work begins — surface type, vegetation, litter, etc."
          required
        >
          <div className="relative">
            <textarea
              value={form.siteCondition}
              onChange={(e) => update("siteCondition", e.target.value)}
              maxLength={500}
              rows={5}
              className="w-full bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 py-3 text-base text-text-primary placeholder:text-[rgba(26,26,24,0.5)] outline-none resize-none"
              placeholder="Describe conditions before work begins"
            />
            <p className="text-right text-[11px] text-[#8f8f8c] mt-1">
              {form.siteCondition.length} / 500
            </p>
          </div>
        </FieldGroup>

        <FieldGroup label="Surface Type" hint="Dominant surface material before greening" required>
          <div className="relative">
            <select
              value={form.surfaceType}
              onChange={(e) => update("surfaceType", e.target.value)}
              className="w-full h-[44px] bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary outline-none appearance-none"
            >
              <option value="">Select surface type</option>
              {SURFACE_TYPE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none text-text-muted">▾</div>
          </div>
        </FieldGroup>

        <FieldGroup label="Type of green surface created" hint="Primary category of the greened area" required>
          <div className="relative">
            <select
              value={form.greenSurfaceType}
              onChange={(e) => update("greenSurfaceType", e.target.value)}
              className="w-full h-[44px] bg-white border border-[rgba(26,26,24,0.28)] rounded-[8px] px-3 text-base text-text-primary outline-none appearance-none"
            >
              <option value="">Select green surface type</option>
              {GREEN_SURFACE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none text-text-muted">▾</div>
          </div>
        </FieldGroup>
      </div>

      <div className="flex-1" />
      <SaveButton onClick={onNext} />
    </>
  );
}

// ── Step 4 — Interventions ────────────────────────────────────────────────────

function Step4({ form, update, onNext }: { form: LogFormData; update: (k: keyof LogFormData, v: unknown) => void; onNext: () => void }) {
  const addIntervention = () => {
    update("interventions", [
      ...form.interventions,
      { id: Date.now(), name: "", count: 1 },
    ]);
  };

  const updateIntervention = (updated: Intervention) => {
    update(
      "interventions",
      form.interventions.map((i) => (i.id === updated.id ? updated : i))
    );
  };

  const removeIntervention = (id: number) => {
    update("interventions", form.interventions.filter((i) => i.id !== id));
  };

  return (
    <>
      <div className="px-5 mt-7 mb-2">
        <h1 className="text-[32px] font-bold text-black">Progress</h1>
        <p className="text-[18px] text-black mt-2">Specify any interventions on the site.</p>
      </div>

      <div className="flex flex-col gap-4 px-5 mt-4">
        {/* Interventions card */}
        <div className="border border-[rgba(26,26,24,0.28)] rounded-[8px] p-5 flex flex-col gap-4">
          <p className="text-base font-medium text-text-primary">Interventions</p>
          {form.interventions.map((item) => (
            <InterventionRow
              key={item.id}
              item={item}
              onChange={updateIntervention}
              onRemove={() => removeIntervention(item.id)}
            />
          ))}
        </div>

        {/* Add Intervention */}
        <button
          onClick={addIntervention}
          className="w-full border-[1.5px] border-dashed border-[rgba(26,26,24,0.28)] rounded-[8px] h-20 flex flex-col items-center justify-center gap-1.5"
        >
          <div className="flex items-center gap-1.5 text-[#787575]">
            <Plus size={16} />
            <span className="text-base font-medium">Add Intervention</span>
          </div>
          <p className="text-base text-[#b6b6b7]">Planted, Cleaned etc</p>
        </button>

        <ToggleCard
          label="Mark Challenge Complete"
          description="Unlocks after all three steps are validated."
          checked={form.markComplete}
          onChange={() => update("markComplete", !form.markComplete)}
          disabled
          badge="Unlock after step 3"
        />
      </div>

      <div className="flex-1" />
      <SaveButton onClick={onNext} />
    </>
  );
}

// ── Step 5 — Computed metrics (read-only) ─────────────────────────────────────

function Step5({ onSubmit }: { onSubmit: () => void }) {
  return (
    <>
      <div className="px-5 mt-7 mb-2">
        <h1 className="text-[32px] font-bold text-black">Progress</h1>
        <p className="text-[18px] text-black mt-2">Read Only</p>
      </div>

      <div className="flex flex-col gap-3 px-5 mt-5">
        <MetricCard
          label="Heat mitigation proxy"
          value="3.2"
          unit="°C estimated surface cooling"
          status="Pending review"
          statusColor="amber"
          link="How is this calculated?"
        />
        <MetricCard
          label="Annual stormwater absorption"
          value="12,400"
          unit="litres / year"
          status="Calculated"
          statusColor="green"
          link="View methodology"
        />
      </div>

      <div className="flex-1" />
      <div className="px-5 pb-8 pt-4 shrink-0">
        <button
          onClick={onSubmit}
          className="w-full h-14 bg-gotf-green text-white rounded-full text-xl font-semibold"
        >
          Submit Evidence
        </button>
        <p className="text-xs text-text-muted text-center mt-3">
          Your site data will be saved and submitted for review.
        </p>
      </div>
    </>
  );
}

// ── Success ───────────────────────────────────────────────────────────────────

function SuccessScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-white overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[560px] rounded-full border border-[#e0f5ee] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[420px] rounded-full bg-[#edfaf4] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[290px] rounded-full bg-[#d8f5e9] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center gap-4 px-10">
        <CheckCircle size={52} className="text-gotf-green" strokeWidth={1.5} />
        <h1 className="text-[32px] font-bold text-gotf-green">Evidence submitted</h1>
        <p className="text-xl text-[#5c5c59] leading-snug">
          Your site data has been<br />submitted for review.
        </p>
      </div>

      <div className="absolute bottom-10 left-0 right-0 px-5">
        <button onClick={onDone} className="w-full h-14 bg-black text-white rounded-full text-base font-medium">
          Done
        </button>
      </div>
    </div>
  );
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

const STORAGE_KEY = (stepId: string) => `log-evidence-draft-${stepId}`;

const initForm = (): LogFormData => ({
  siteName: "",
  permissionHolder: "",
  permissionConfirmed: false,
  markComplete: false,
  locationResult: null,
  baselinePhoto: "",
  plantingPhoto: "",
  estimatedArea: "",
  areaUnit: "ha",
  siteCondition: "",
  surfaceType: "",
  greenSurfaceType: "",
  interventions: [{ id: 1, name: "", count: 1 }],
});

type Props = { challengeId: string; stepId: string };

export default function LogEvidenceWizard({ challengeId, stepId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<LogFormData>(initForm);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(stepId));
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch { /* ignore corrupt draft */ }
    }
  }, [stepId]);

  // Persist draft to localStorage on every form change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY(stepId), JSON.stringify(form));
  }, [form, stepId]);

  const update = (key: keyof LogFormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const next = () => setStep((s) => s + 1);
  const back = () => {
    if (step <= 1) router.back();
    else setStep((s) => s - 1);
  };
  const close = () => router.push(`/challenges/${challengeId}/steps/${stepId}`);

  const submit = () => {
    // Clear draft after successful submit
    localStorage.removeItem(STORAGE_KEY(stepId));
    setSubmitted(true);
  };

  if (submitted) {
    return <SuccessScreen onDone={() => router.push(`/challenges/${challengeId}`)} />;
  }

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <WizardHeader step={step} onBack={back} onClose={close} />

      <div className="flex-1 overflow-y-auto flex flex-col">
        {step === 1 && <Step1 form={form} update={update} onNext={next} />}
        {step === 2 && <Step2 form={form} update={update} onNext={next} />}
        {step === 3 && <Step3 form={form} update={update} onNext={next} />}
        {step === 4 && <Step4 form={form} update={update} onNext={next} />}
        {step === 5 && <Step5 onSubmit={submit} />}
      </div>
    </div>
  );
}
