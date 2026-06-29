"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  X,
  Camera,
  AlertTriangle,
  ExternalLink,
  FileText,
  Plus,
  Minus,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

// ── Progress header ───────────────────────────────────────────────────────────

export function WizardHeader({
  step,
  total = 5,
  onBack,
  onClose,
  onGoToStep,
}: {
  step: number;
  total?: number;
  onBack: () => void;
  onClose: () => void;
  onGoToStep?: (step: number) => void;
}) {
  const tCommon = useTranslations("common");
  return (
    <div className="px-5 pt-8">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="size-10 flex items-center" aria-label={tCommon("back")}>
          <ChevronLeft size={20} className="text-text-muted" />
        </button>
        <button onClick={onClose} className="size-10 flex items-center justify-end" aria-label={tCommon("close")}>
          <X size={20} className="text-text-muted" />
        </button>
      </div>
      <div className="flex gap-2.5">
        {Array.from({ length: total }).map((_, i) => {
          const targetStep = i + 1;
          const isFilled = i < step;
          const isClickable = onGoToStep && isFilled && targetStep < step;
          return isClickable ? (
            <button
              key={i}
              onClick={() => onGoToStep(targetStep)}
              className="flex-1 h-2 rounded-full bg-gotf-green"
              aria-label={`Go to step ${targetStep}`}
            />
          ) : (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${isFilled ? "bg-gotf-green" : "bg-[#ccc]"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Form primitives ───────────────────────────────────────────────────────────

export function FieldGroup({
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
  const t = useTranslations("challenges");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-base font-medium text-text-primary tracking-[0.16px]">
          {label}
        </label>
        {required && <div className="size-1.5 rounded-full bg-[#d85a30] shrink-0" />}
        {!required && (
          <span className="text-[11px] text-[#8f8f8c] bg-[#f0efeb] border border-[rgba(26,26,24,0.14)] px-1.5 py-0.5 rounded">
            {t("optionalBadge")}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-[#8f8f8c]">{hint}</p>}
      {children}
    </div>
  );
}

export function TextInput({
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

export function ToggleCard({
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

export function UploadZone({
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
  const t = useTranslations("challenges");
  const ref = useRef<HTMLInputElement>(null);
  const fileName = value ? value.split("/").pop() || t("uploaded") : null;

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
            <p className="text-[11px] text-[#8f8f8c]">{t("uploaded")}</p>
          </div>
          <button onClick={() => onChange("")} className="size-9 flex items-center justify-center text-text-muted">
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
        <p className="text-[14px] font-semibold text-text-primary">{t("tapToUploadFiles")}</p>
        <p className="text-xs text-[#8f8f8c]">{t("fileFormats")}</p>
        {required && (
          <span className="text-[11px] font-semibold text-[#791f1f] bg-[#fcebeb] border border-[#f7c1c1] rounded px-2 py-0.5">
            {t("required")}
          </span>
        )}
      </button>
    </FieldGroup>
  );
}

export type Intervention = { id: number; name: string; count: number };

export function InterventionRow({
  item,
  onChange,
  onRemove,
}: {
  item: Intervention;
  onChange: (updated: Intervention) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("challenges");
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        placeholder={t("interventionPlaceholder")}
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

export function MetricCard({
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

export function GateBanner({ message }: { message: string }) {
  return (
    <div className="bg-[#faeeda] border border-[#fac775] rounded-[8px] flex gap-2.5 items-start p-3">
      <AlertTriangle size={20} className="text-[#633806] shrink-0 mt-0.5" />
      <p className="text-[13px] text-[#633806] leading-relaxed">{message}</p>
    </div>
  );
}

export function SaveButton({ label = "Save", onClick }: { label?: string; onClick: () => void }) {
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

export function ReadOnlyField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-medium text-text-primary">{label}</label>
      {multiline ? (
        <div className="border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 py-3 bg-[#f9f9f9] min-h-[80px]">
          <p className="text-base text-text-primary">{value}</p>
        </div>
      ) : (
        <div className="h-[44px] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 flex items-center bg-[#f9f9f9]">
          <p className="text-base text-text-primary truncate">{value}</p>
        </div>
      )}
    </div>
  );
}

// ── File thumbnail ─────────────────────────────────────────────────────────────

export function FileThumb({ file }: { file: File }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (file.type.startsWith("image/")) {
    return src ? <img src={src} alt="" className="w-full h-full object-cover" /> : null;
  }
  if (file.type.includes("pdf")) {
    return <FileText size={20} className="text-red-500" />;
  }
  return <FileText size={20} className="text-[#8f8f8c]" />;
}
