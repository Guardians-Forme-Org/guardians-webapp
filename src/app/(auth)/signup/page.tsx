"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { useRegister } from "@/lib/hooks/auth";
import LocationPicker, { type LocationResult } from "@/components/ui/LocationPicker";
import Text from "@/components/ui/Text";

// ── Types ──────────────────────────────────────────────────────────────────────

type FormData = {
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  location: LocationResult | null;
  imagePreview: string;
};

const initForm: FormData = {
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  location: null,
  imagePreview: "",
};

// ── Shared primitives ──────────────────────────────────────────────────────────

function ProgressBar({ filled, total = 4 }: { filled: number; total?: number }) {
  return (
    <div className="flex gap-2.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`flex-1 h-2 rounded-full ${i < filled ? "bg-gotf-green" : "bg-[#ccc]"}`} />
      ))}
    </div>
  );
}

function AuthHeader({ progress, onClose }: { progress: number; onClose: () => void }) {
  return (
    <div className="px-10 pt-8">
      <div className="flex items-center justify-between mb-6">
        <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain" />
        <button onClick={onClose} aria-label="Close" className="text-text-muted"><X size={22} /></button>
      </div>
      <ProgressBar filled={progress} />
    </div>
  );
}

function BottomButton({
  label,
  onClick,
  loading,
  disabled,
}: {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="px-10 pb-10 pt-4 shrink-0">
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="w-full h-14 bg-black text-white rounded-full text-xl font-medium disabled:opacity-50"
      >
        {loading ? "Please wait…" : label}
      </button>
    </div>
  );
}

function TermsFooter() {
  return (
    <p className="text-[11px] text-black text-center pb-4 px-10">
      Guardians of the Future{" "}
      <a href="https://theguardians.world/" target="_blank" rel="noopener noreferrer" className="underline">
        Terms and Condition
      </a>
    </p>
  );
}

// ── Step 1 — Credentials + Password ───────────────────────────────────────────

function Step1({
  form,
  onChange,
  onNext,
  onClose,
  error,
}: {
  form: FormData;
  onChange: (f: keyof FormData, v: string) => void;
  onNext: () => void;
  onClose: () => void;
  error: string | null;
}) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={1} onClose={onClose} />
      <div className="px-10 mt-7 mb-8">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          Let us<br />authenticate you
        </h1>
        <p className="text-[18px] text-black mt-4 leading-relaxed">
          Provide your <strong>mobile number</strong> or <strong>email</strong> and choose a password.
        </p>
      </div>

      <div className="flex flex-col gap-5 px-10">
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

        <div className="border-t border-progress-track" />

        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              placeholder="Create a password"
              className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              placeholder="Repeat your password"
              className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex-1" />
      <BottomButton label="Continue" onClick={onNext} />
    </div>
  );
}

// ── Step 2 — Profile info ──────────────────────────────────────────────────────

function Step2({
  form,
  onChange,
  onLocationSelect,
  onNext,
  onClose,
}: {
  form: FormData;
  onChange: (f: keyof FormData, v: string) => void;
  onLocationSelect: (place: LocationResult) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={2} onClose={onClose} />
      <div className="px-10 mt-7 mb-8">
        <h1 className="text-[32px] font-bold text-black leading-tight">
          Tell us more<br />about yourself
        </h1>
      </div>

      <div className="flex flex-col gap-7 px-10">
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
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">Region</label>
          <LocationPicker
            defaultValue={form.location?.formattedAddress ?? ""}
            onSelect={onLocationSelect}
            placeholder="Search for your location"
          />
          <div className="border border-[#ccc] rounded-[10px] h-[200px] overflow-hidden relative bg-[#eef4ee]">
            {form.location ? (
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${form.location.latitude},${form.location.longitude}&zoom=14&size=600x200&scale=2&markers=color:0x003518|${form.location.latitude},${form.location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                alt={form.location.formattedAddress}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(#c8d8c8 1px, transparent 1px), linear-gradient(90deg, #c8d8c8 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="size-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <Text variant="caption" className="text-gotf-green text-xl">📍</Text>
                  </div>
                  <div className="bg-white/90 rounded-full px-3 py-1">
                    <Text variant="caption" className="text-text-subheading">Select a location</Text>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <BottomButton label="Continue" onClick={onNext} />
      <TermsFooter />
    </div>
  );
}

// ── Step 3 — Profile photo + Submit ───────────────────────────────────────────

function Step3({
  form,
  onChange,
  onConfirm,
  onClose,
  loading,
  error,
}: {
  form: FormData;
  onChange: (f: keyof FormData, v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange("imagePreview", URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <AuthHeader progress={3} onClose={onClose} />

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

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {error && <p className="text-sm text-red-600 text-center px-10 mb-2">{error}</p>}

      <div className="bg-[#eee] mx-2.5 rounded-[10px] px-10 pt-10 pb-[70px] flex flex-col gap-2.5 mt-auto">
        <button onClick={() => fileRef.current?.click()} className="w-full h-14 bg-white rounded-full text-lg font-medium text-[#1e1e1e]">
          Upload Image
        </button>
        <button onClick={() => onChange("imagePreview", "")} className="w-full h-14 bg-white rounded-full text-lg font-medium text-[#1e1e1e]">
          Remove
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full h-14 bg-black text-white rounded-full text-lg font-medium disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}

// ── Step 4 — Success ───────────────────────────────────────────────────────────

function Step4({ onDone }: { onDone: () => void }) {
  return (
    <div className="relative min-h-dvh bg-white flex flex-col items-center justify-center overflow-hidden">
      <img
        src="/images/success-logo.png"
        alt=""
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center gap-4 px-10">
        <img src="/images/Guardians Logo-logo.png" alt="" className="w-12 h-12 object-contain mb-2" />
        <h1 className="text-[32px] font-bold text-black">Success</h1>
        <p className="text-xl font-medium text-[#808080] leading-snug">
          Welcome to<br />Guardians of the Future
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

// ── Wizard shell ───────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter();
  const { mutate: register, isPending, error: apiError } = useRegister();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initForm);
  const [validationError, setValidationError] = useState<string | null>(null);

  const next = () => setStep((s) => s + 1);
  const close = () => router.push("/get-started");
  const updateForm = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));
  const updateLocation = (place: LocationResult) =>
    setForm((f) => ({ ...f, location: place }));

  const handleStep1Next = () => {
    if (!form.email && !form.phone) {
      setValidationError("Please enter an email or phone number.");
      return;
    }
    if (!form.password) {
      setValidationError("Please create a password.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }
    setValidationError(null);
    next();
  };

  const handleSubmit = () => {
    const payload = {
      email: form.email,
      mobile: form.phone,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      preferredLanguage: { id: "en", name: "English", code: "en" },
      location: form.location ?? {
        placeId: "",
        city: "",
        suburb: "",
        province: "",
        country: "",
        countryCode: "",
        postalCode: "",
        latitude: 0,
        longitude: 0,
        formattedAddress: "",
      },
    };
    register(payload, { onSuccess: next });
  };

  const submitError =
    apiError instanceof Error ? apiError.message : null;

  if (step === 1)
    return (
      <Step1
        form={form}
        onChange={updateForm}
        onNext={handleStep1Next}
        onClose={close}
        error={validationError}
      />
    );
  if (step === 2)
    return <Step2 form={form} onChange={updateForm} onLocationSelect={updateLocation} onNext={next} onClose={close} />;
  if (step === 3)
    return (
      <Step3
        form={form}
        onChange={updateForm}
        onConfirm={handleSubmit}
        onClose={close}
        loading={isPending}
        error={submitError}
      />
    );
  return <Step4 onDone={() => router.push("/login")} />;
}
