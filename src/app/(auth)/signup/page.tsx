"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Search, Image as ImageIcon, MapPin } from "lucide-react";
import OTPInput from "@/components/ui/OTPInput";

// ── Types & state ──────────────────────────────────────────────────────────────

type AuthMethod = "phone" | "email";

type FormData = {
  phone: string;
  email: string;
  authMethod: AuthMethod;
  firstName: string;
  lastName: string;
  region: string;
  imagePreview: string;
};

const initForm: FormData = {
  phone: "",
  email: "",
  authMethod: "phone",
  firstName: "",
  lastName: "",
  region: "",
  imagePreview: "",
};

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex gap-2.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-2 rounded-full ${i < filled ? "bg-gotf-green" : "bg-[#ccc]"}`}
        />
      ))}
    </div>
  );
}

// ── Shared header ──────────────────────────────────────────────────────────────

function AuthHeader({
  progress,
  onClose,
}: {
  progress: number;
  onClose: () => void;
}) {
  return (
    <div className="px-10 pt-8">
      <div className="flex items-center justify-between mb-6">
        <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain" />
        <button onClick={onClose} aria-label="Close" className="text-text-muted">
          <X size={22} />
        </button>
      </div>
      <ProgressBar filled={progress} />
    </div>
  );
}

function BottomButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="px-10 pb-10 pt-4 shrink-0">
      <button
        onClick={onClick}
        className="w-full h-14 bg-black text-white rounded-full text-xl font-medium"
      >
        {label}
      </button>
    </div>
  );
}

function TermsFooter() {
  return (
    <p className="text-[11px] text-black text-center pb-4 px-10">
      Guardians of the Future{" "}
      <a
        href="https://theguardians.world/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Terms and Condition
      </a>
    </p>
  );
}

// ── Step 1 — Authenticate ──────────────────────────────────────────────────────

function Step1({
  form,
  onChange,
  onNext,
  onClose,
}: {
  form: FormData;
  onChange: (f: keyof FormData, v: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={1} onClose={onClose} />

      <div className="px-10 mt-7 mb-8">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          Let us<br />authenticate you
        </h1>
        <p className="text-[18px] text-black mt-4 leading-relaxed">
          Please provide your <strong>mobile number</strong> or <strong>email</strong> to receive a 6 digit code.
        </p>
      </div>

      <div className="flex flex-col gap-6 px-10">
        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="Enter phone number"
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
          />
        </div>

        <div className="border-t border-progress-track" />

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Enter your email address"
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
          />
        </div>
      </div>

      <div className="flex-1" />
      <BottomButton label="Receive Code" onClick={onNext} />
    </div>
  );
}

// ── Step 2 — OTP ───────────────────────────────────────────────────────────────

function Step2({
  form,
  onNext,
  onClose,
}: {
  form: FormData;
  onNext: () => void;
  onClose: () => void;
}) {
  const sentTo = form.email
    ? `xxxxx${form.email.slice(-12)}`
    : `xxx-xxx-${form.phone.slice(-4) || "5422"}`;

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={2} onClose={onClose} />

      <div className="px-10 mt-7 mb-8">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          What is your<br />verification code?
        </h1>
        <p className="text-[18px] text-black mt-4 leading-relaxed">
          Enter the 6-digit code we sent to{" "}
          <strong>{sentTo}</strong>
        </p>
      </div>

      <div className="px-10">
        <OTPInput />
        <button className="text-gotf-blue text-base mt-5 text-center w-full">
          Resend the code
        </button>
      </div>

      <div className="flex-1" />
      <BottomButton label="Confirm" onClick={onNext} />
      <TermsFooter />
    </div>
  );
}

// ── Step 3 — Profile ───────────────────────────────────────────────────────────

function Step3({
  form,
  onChange,
  onNext,
  onClose,
}: {
  form: FormData;
  onChange: (f: keyof FormData, v: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={3} onClose={onClose} />

      <div className="px-10 mt-7 mb-8">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          Tell us more<br />about yourself
        </h1>
      </div>

      <div className="flex flex-col gap-7 px-10">
        {/* First Name */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">First Name</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="What's your first name"
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Last Name</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="What's your last name"
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
          />
        </div>

        {/* Region */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Region</label>
          <div className="relative">
            <input
              type="text"
              value={form.region}
              onChange={(e) => onChange("region", e.target.value)}
              placeholder="Search for your location"
              className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
            />
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomButton label="Save" onClick={onNext} />
      <TermsFooter />
    </div>
  );
}

// ── Step 3b — Location ─────────────────────────────────────────────────────────

function Step3b({
  form,
  onChange,
  onNext,
  onClose,
}: {
  form: FormData;
  onChange: (f: keyof FormData, v: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={3} onClose={onClose} />

      <div className="px-10 mt-7 mb-7">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          Where are<br />you located?
        </h1>
      </div>

      <div className="flex flex-col gap-5 px-10">
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Region</label>
          <div className="relative">
            <input
              type="text"
              value={form.region}
              onChange={(e) => onChange("region", e.target.value)}
              placeholder="Search for your location"
              className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
            />
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Map placeholder */}
        <div className="border border-[#ccc] rounded-[10px] h-[274px] overflow-hidden relative bg-[#eef4ee] flex items-center justify-center">
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
              <p className="text-xs text-text-subheading">{form.region || "Select a location"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomButton label="Continue" onClick={onNext} />
      <TermsFooter />
    </div>
  );
}

// ── Step 4 — Profile photo ─────────────────────────────────────────────────────

function Step4({
  form,
  onChange,
  onNext,
  onClose,
}: {
  form: FormData;
  onChange: (f: keyof FormData, v: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange("imagePreview", URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={4} onClose={onClose} />

      {/* Image preview */}
      <div className="flex justify-center mt-7 mb-5 px-10">
        <div className="w-[322px] h-[322px] rounded-[16px] overflow-hidden bg-surface border border-border flex items-center justify-center">
          {form.imagePreview ? (
            <img src={form.imagePreview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <ImageIcon size={44} strokeWidth={1.2} />
              <p className="text-sm">No image selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Actions at bottom inside a gray tray */}
      <div className="bg-[#eee] mx-2.5 rounded-[10px] px-10 pt-10 pb-[70px] flex flex-col gap-2.5 mt-auto">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-14 bg-white rounded-full text-lg font-medium text-[#1e1e1e]"
        >
          Upload Image
        </button>
        <button
          onClick={() => onChange("imagePreview", "")}
          className="w-full h-14 bg-white rounded-full text-lg font-medium text-[#1e1e1e]"
        >
          Remove
        </button>
        <button
          onClick={onNext}
          className="w-full h-14 bg-black text-white rounded-full text-lg font-medium"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// ── Step 5 — Success ───────────────────────────────────────────────────────────

function Step5({ onDone }: { onDone: () => void }) {
  return (
    <div className="relative min-h-dvh bg-white flex flex-col items-center justify-center overflow-hidden">
      {/* Decorative concentric circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[560px] rounded-full border border-[#e0f5ee] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[420px] rounded-full bg-[#edfaf4] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[290px] rounded-full bg-[#d8f5e9] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-4 px-10">
        <img src="/images/Guardians Logo-logo.png" alt="" className="w-12 h-12 object-contain mb-2" />
        <h1 className="text-[32px] font-bold text-black">Success</h1>
        <p className="text-xl font-medium text-[#808080] leading-snug">
          Welcome to<br />Guardians of the Future
        </p>
      </div>

      {/* Done button */}
      <div className="absolute bottom-10 left-0 right-0 px-5">
        <button
          onClick={onDone}
          className="w-full h-14 bg-black text-white rounded-full text-base font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Wizard shell ───────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initForm);

  const next = () => setStep((s) => s + 1);
  const close = () => router.push("/get-started");
  const updateForm = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  if (step === 1) return <Step1 form={form} onChange={updateForm} onNext={next} onClose={close} />;
  if (step === 2) return <Step2 form={form} onNext={next} onClose={close} />;
  if (step === 3) return <Step3 form={form} onChange={updateForm} onNext={next} onClose={close} />;
  if (step === 4) return <Step3b form={form} onChange={updateForm} onNext={next} onClose={close} />;
  if (step === 5) return <Step4 form={form} onChange={updateForm} onNext={next} onClose={close} />;
  return <Step5 onDone={() => router.push("/home")} />;
}
