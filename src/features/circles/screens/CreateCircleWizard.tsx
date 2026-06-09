"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  X,
  Search,
  MapPin,
  Link2,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCircle } from "@/lib/hooks/circles";

// ── Form state ─────────────────────────────────────────────────────────────────

type CircleFormData = {
  name: string;
  leads: string;
  description: string;
  region: string;
  imagePreview: string;
};

const initialForm: CircleFormData = {
  name: "",
  leads: "",
  description: "",
  region: "",
  imagePreview: "",
};

// ── Shared sub-components ──────────────────────────────────────────────────────

const PROGRESS_FILLED: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 0 };

function WizardHeader({
  step,
  onBack,
  onClose,
}: {
  step: number;
  onBack: () => void;
  onClose: () => void;
}) {
  const filled = PROGRESS_FILLED[step] ?? 0;

  return (
    <div className="px-10 pt-8">
      <div className="flex items-center justify-between mb-6">
        {step === 1 ? (
          <img
            src="/images/Guardians Logo-logo.png"
            alt="Guardians"
            className="w-8 h-8 object-contain"
          />
        ) : (
          <button onClick={onBack} className="size-10 flex items-center" aria-label="Back">
            <ChevronLeft size={20} className="text-text-muted" />
          </button>
        )}
        <button onClick={onClose} className="size-10 flex items-center justify-end" aria-label="Close">
          <X size={20} className="text-text-muted" />
        </button>
      </div>

      {filled > 0 && (
        <div className="flex gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${i < filled ? "bg-gotf-green" : "bg-[#ccc]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WizardTitle({
  title,
  description,
  boldWord,
}: {
  title: string;
  description?: string;
  boldWord?: string;
}) {
  const parts = boldWord && description ? description.split(boldWord) : null;
  return (
    <div className="px-10 mt-7 mb-7">
      <h1 className="text-[32px] font-bold text-gotf-green leading-tight">{title}</h1>
      {description && (
        <p className="text-[18px] text-black mt-4 leading-relaxed">
          {parts ? (
            <>{parts[0]}<strong>{boldWord}</strong>{parts[1]}</>
          ) : description}
        </p>
      )}
    </div>
  );
}

function WizardNextButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="px-5 pb-10 pt-4 shrink-0">
      <button
        onClick={onClick}
        className="w-full h-14 bg-black text-white rounded-full text-[18px] font-medium"
      >
        {label}
      </button>
    </div>
  );
}

// ── Step 1 — About the Circle ──────────────────────────────────────────────────

function Step1({
  form,
  onChange,
}: {
  form: CircleFormData;
  onChange: (f: keyof CircleFormData, v: string) => void;
}) {
  return (
    <>
      <WizardTitle
        title="About the Circle"
        description="Please fill out the below to be able to create a circle."
        boldWord="create"
      />

      <div className="flex flex-col gap-7 px-10">
        {/* Circle Name */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-base font-medium text-text-primary tracking-[0.16px]">
              Circle Name
            </label>
            <div className="size-4 rounded-full border border-text-muted flex items-center justify-center shrink-0">
              <span className="text-[10px] text-text-muted font-semibold leading-none">i</span>
            </div>
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="What's your circle name?"
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
          />
        </div>

        {/* Circle Lead(s) */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Circle Lead(s){" "}
            <span className="text-[rgba(60,60,67,0.29)] font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.leads}
              onChange={(e) => onChange("leads", e.target.value)}
              placeholder="Search circle lead(s)"
              className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
            />
            <Search
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Circle Description */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Circle description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Tell us more about the circle"
            rows={4}
            className="border border-[#d9d9d9] rounded-[8px] px-4 py-5 text-base placeholder:text-[#bfbfbf] outline-none resize-none"
          />
        </div>
      </div>
    </>
  );
}

// ── Step 2 — Location ─────────────────────────────────────────────────────────

function Step2({
  form,
  onChange,
}: {
  form: CircleFormData;
  onChange: (f: keyof CircleFormData, v: string) => void;
}) {
  return (
    <>
      <WizardTitle title="Where is the Circle located?" />

      <div className="flex flex-col gap-5 px-10">
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Region
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.region}
              onChange={(e) => onChange("region", e.target.value)}
              placeholder="Search for your location"
              className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
            />
            <Search
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Map placeholder */}
        <div className="border border-[#ccc] rounded-[10px] h-[274px] overflow-hidden flex items-center justify-center relative bg-[#eef4ee]">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#c8d8c8 1px, transparent 1px), linear-gradient(90deg, #c8d8c8 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="size-10 rounded-full bg-white shadow-sm flex items-center justify-center">
              <MapPin size={22} className="text-gotf-green" fill="#e8f7f0" strokeWidth={2} />
            </div>
            <div className="bg-white/90 rounded-full px-3 py-1">
              <Text variant="caption" className="text-text-subheading">
                {form.region || "Select a location"}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Step 3 — Profile Photo ─────────────────────────────────────────────────────

function Step3({
  form,
  onChange,
  onConfirm,
  loading,
  error,
}: {
  form: CircleFormData;
  onChange: (f: keyof CircleFormData, v: string) => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onChange("imagePreview", url);
    }
  };

  const handleRemove = () => {
    onChange("imagePreview", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <WizardTitle
        title="Upload Circle profile"
        description="The profile image will be seen on your dashboard and the Guardian platform."
      />

      <div className="px-10 flex flex-col gap-4">
        {/* Image preview */}
        <div className="w-[322px] h-[322px] rounded-[16px] overflow-hidden bg-surface border border-border flex items-center justify-center self-center">
          {form.imagePreview ? (
            <img
              src={form.imagePreview}
              alt="Circle profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <ImageIcon size={40} strokeWidth={1.2} />
              <Text variant="caption">No image selected</Text>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-14 border border-[#ccc] rounded-full text-[18px] font-medium text-[#1e1e1e]"
        >
          Upload Image
        </button>

        {/* Remove */}
        <button
          onClick={handleRemove}
          className="w-full h-14 border border-[#ccc] rounded-full text-[18px] font-medium text-[#1e1e1e]"
        >
          Remove
        </button>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {/* Confirm */}
        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full h-14 bg-black text-white rounded-full text-[18px] font-medium disabled:opacity-50"
        >
          {loading ? "Creating…" : "Confirm"}
        </button>
      </div>
    </>
  );
}

// ── Step 4 — Done ─────────────────────────────────────────────────────────────

function Step4({ onDone }: { onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("http:link/CircleX");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: silent fail
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ url: "http:link/CircleX", title: "Join my Circle on Guardians" });
    } catch {
      // not supported or dismissed
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-white overflow-hidden">
      {/* Concentric mint circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[560px] rounded-full border border-[#e0f5ee] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[420px] rounded-full bg-[#edfaf4] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[290px] rounded-full bg-[#d8f5e9] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-10">
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians"
          className="w-12 h-12 object-contain mb-4"
        />
        <h1 className="text-[32px] font-bold text-gotf-green mb-3">Circle created</h1>
        <p className="text-[18px] text-[#333] mb-8 max-w-[288px] leading-snug">
          Copy and share this link to invite people to join this circle
        </p>

        {/* Copy invitation link */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-5 w-full max-w-[322px] border border-[#ccc] rounded-[10px] px-10 py-5 mb-3 text-left"
        >
          <Link2 size={20} className="text-text-primary shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-base font-bold text-black">
              {copied ? "Copied!" : "Copy invitation link"}
            </span>
            <span className="text-base text-[#bfbfbf]">http:link/CircleX</span>
          </div>
        </button>

        {/* Circle Details PDF */}
        <button
          className="flex items-center gap-5 w-full max-w-[322px] h-[60px] border border-[#ccc] rounded-full px-10"
        >
          <Download size={20} className="text-text-primary shrink-0" />
          <span className="text-base font-medium text-black">Circle Details PDF</span>
        </button>
      </div>

      {/* Done */}
      <div className="absolute bottom-10 left-0 right-0 px-5">
        <button
          onClick={onDone}
          className="w-full h-14 bg-black text-white rounded-full text-[18px] font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Wizard shell ───────────────────────────────────────────────────────────────

export default function CreateCircleWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const { mutate: createCircle, isPending, error: apiError } = useCreateCircle();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CircleFormData>(initialForm);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => {
    if (step <= 1) router.back();
    else setStep((s) => s - 1);
  };
  const close = () => router.push("/discover");
  const updateForm = (field: keyof CircleFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!user) return;
    createCircle(
      {
        name: form.name,
        description: form.description,
        createdBy: user.id,
        creatorAvatarUrl: user.user_metadata.avatarUrl,
        region: { name: form.region, latitude: 0, longitude: 0 },
      },
      { onSuccess: next }
    );
  };

  const submitError = apiError instanceof Error ? apiError.message : null;

  if (step === 4) {
    return (
      <div className="relative min-h-dvh">
        <div className="absolute top-8 left-10 z-20">
          <button onClick={back} className="size-10 flex items-center" aria-label="Back">
            <ChevronLeft size={20} className="text-text-muted" />
          </button>
        </div>
        <div className="absolute top-8 right-10 z-20">
          <button onClick={close} className="size-10 flex items-center justify-end" aria-label="Close">
            <X size={20} className="text-text-muted" />
          </button>
        </div>
        <Step4 onDone={close} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <WizardHeader step={step} onBack={back} onClose={close} />

      <div className="flex-1 overflow-y-auto">
        {step === 1 && <Step1 form={form} onChange={updateForm} />}
        {step === 2 && <Step2 form={form} onChange={updateForm} />}
        {step === 3 && (
          <Step3
            form={form}
            onChange={updateForm}
            onConfirm={handleSubmit}
            loading={isPending}
            error={submitError}
          />
        )}
      </div>

      {step < 3 && <WizardNextButton label="Next" onClick={next} />}
    </div>
  );
}
