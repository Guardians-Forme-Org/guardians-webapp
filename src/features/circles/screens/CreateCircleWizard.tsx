"use client";

import LocationPicker, {
  type LocationResult,
} from "@/components/ui/LocationPicker";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCircle } from "@/lib/hooks/circles";
import { useUsers } from "@/lib/hooks/users";
import type { AuthUser } from "@/lib/types/auth";
import type { CreateCircleResponse } from "@/lib/types/circles";
import {
  ChevronLeft,
  Globe,
  Image as ImageIcon,
  Link2,
  Mail,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// ── Form state ─────────────────────────────────────────────────────────────────

type ChannelId = "whatsapp" | "facebook" | "email";

const CHANNELS: {
  id: ChannelId;
  label: string;
  name: string;
  icon: typeof MessageCircle;
}[] = [
  { id: "whatsapp", label: "WhatsApp", name: "WhatsApp", icon: MessageCircle },
  { id: "facebook", label: "Facebook", name: "Facebook", icon: Globe },
  { id: "email", label: "Email", name: "Email", icon: Mail },
];

function RadioCircle({ selected }: { selected: boolean }) {
  return selected ? (
    <div className="size-5 rounded-full border-2 border-gotf-green flex items-center justify-center shrink-0">
      <div className="size-2.5 rounded-full bg-gotf-green" />
    </div>
  ) : (
    <div className="size-5 rounded-full border-2 border-[#ccc] shrink-0" />
  );
}

type CircleFormData = {
  name: string;
  leads: string;
  description: string;
  channelType: ChannelId | "";
  channelUrl: string;
  region: string;
  imagePreview: string;
};

const initialForm: CircleFormData = {
  name: "",
  leads: "",
  description: "",
  channelType: "",
  channelUrl: "",
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
          <button
            onClick={onBack}
            className="size-10 flex items-center"
            aria-label="Back"
          >
            <ChevronLeft size={20} className="text-text-muted" />
          </button>
        )}
        <button
          onClick={onClose}
          className="size-10 flex items-center justify-end"
          aria-label="Close"
        >
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
      <h1 className="text-[32px] font-bold text-gotf-green leading-tight">
        {title}
      </h1>
      {description && (
        <p className="text-[18px] text-black mt-4 leading-relaxed">
          {parts ? (
            <>
              {parts[0]}
              <strong>{boldWord}</strong>
              {parts[1]}
            </>
          ) : (
            description
          )}
        </p>
      )}
    </div>
  );
}

function WizardNextButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="px-5 mb-20 pt-4 shrink-0">
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
  selectedLead,
  onSelectLead,
  onRemoveLead,
}: {
  form: CircleFormData;
  onChange: (f: keyof CircleFormData, v: string) => void;
  selectedLead: AuthUser | null;
  onSelectLead: (user: AuthUser) => void;
  onRemoveLead: () => void;
}) {
  const { data: users = [] } = useUsers();
  const [showDropdown, setShowDropdown] = useState(false);

  const query = form.leads.trim().toLowerCase();
  const filtered = query
    ? users.filter((u) => {
        const name =
          `${u.user_metadata.firstName} ${u.user_metadata.lastName}`.toLowerCase();
        return name.includes(query) || u.email.toLowerCase().includes(query);
      })
    : [];

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
              <span className="text-[10px] text-text-muted font-semibold leading-none">
                i
              </span>
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
            <span className="text-[rgba(60,60,67,0.29)] font-normal">
              (Optional)
            </span>
          </label>

          {selectedLead ? (
            <div className="flex items-center gap-3 h-[60px] border border-[#d9d9d9] rounded-[8px] px-4">
              <div className="size-8 rounded-full bg-[#d9d9d9] overflow-hidden shrink-0">
                {selectedLead.user_metadata.avatarUrl && (
                  <img
                    src={selectedLead.user_metadata.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <span className="flex-1 text-base text-text-primary">
                {selectedLead.user_metadata.firstName}{" "}
                {selectedLead.user_metadata.lastName}
              </span>
              <button onClick={onRemoveLead} className="text-text-muted">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={form.leads}
                onChange={(e) => {
                  onChange("leads", e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Search circle lead(s)"
                className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
              />
              <Search
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />

              {showDropdown && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d9d9d9] rounded-[8px] shadow-lg z-50 max-h-[200px] overflow-y-auto">
                  {filtered.map((u) => (
                    <button
                      key={u.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onSelectLead(u);
                        onChange("leads", "");
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#f5f5f5]"
                    >
                      <div className="size-8 rounded-full bg-[#d9d9d9] overflow-hidden shrink-0">
                        {u.user_metadata.avatarUrl && (
                          <img
                            src={u.user_metadata.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {u.user_metadata.firstName} {u.user_metadata.lastName}
                        </p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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

        {/* Communication Channel */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Communication Channel{" "}
            <span className="text-[rgba(60,60,67,0.29)] font-normal">
              (Optional)
            </span>
          </label>
          <div className="flex flex-col gap-2.5">
            {CHANNELS.map(({ id, label, icon: Icon }) => {
              const selected = form.channelType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange("channelType", id)}
                  className={`flex items-center justify-between h-[50px] px-5 rounded-[8px] border transition-colors ${
                    selected ? "border-gotf-green" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={22}
                      className={
                        selected ? "text-gotf-green" : "text-text-muted"
                      }
                    />
                    <span className="text-base text-text-primary">{label}</span>
                  </div>
                  <RadioCircle selected={selected} />
                </button>
              );
            })}
          </div>

          {form.channelType && (
            <div className="relative mt-1">
              <input
                type="url"
                value={form.channelUrl}
                onChange={(e) => onChange("channelUrl", e.target.value)}
                placeholder="Paste your group or channel link"
                className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
              />
              <Link2
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Step 2 — Location ─────────────────────────────────────────────────────────

function Step2({
  location,
  onSelect,
}: {
  location: LocationResult | null;
  onSelect: (place: LocationResult) => void;
}) {
  return (
    <>
      <WizardTitle title="Where is the Circle located?" />

      <div className="flex flex-col gap-5 px-10">
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Region
          </label>
          <LocationPicker
            defaultValue={location?.formattedAddress}
            onSelect={onSelect}
            placeholder="Search for your location"
          />
        </div>

        {/* Map */}
        <div className="border border-[#ccc] rounded-[10px] h-[274px] overflow-hidden relative bg-[#eef4ee]">
          {location ? (
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.latitude},${location.longitude}&zoom=14&size=600x274&scale=2&markers=color:0x003518|${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
              alt={location.formattedAddress}
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
                  <Text variant="caption" className="text-gotf-green text-xl">
                    📍
                  </Text>
                </div>
                <div className="bg-white/90 rounded-full px-3 py-1">
                  <Text variant="caption" className="text-text-subheading">
                    Select a location
                  </Text>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Step 3 — Profile Photo ─────────────────────────────────────────────────────

function Step3({
  form,
  onChange,
  onFileSelect,
  onConfirm,
  loading,
  error,
}: {
  form: CircleFormData;
  onChange: (f: keyof CircleFormData, v: string) => void;
  onFileSelect: (file: File) => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange("imagePreview", URL.createObjectURL(file));
      onFileSelect(file);
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

function Step4({
  circleName,
  joinLink,
  onDone,
}: {
  circleName: string;
  joinLink: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: silent fail
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        url: joinLink,
        title: `Join ${circleName} on Guardians`,
      });
    } catch {
      // not supported or dismissed
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-white overflow-hidden">
      <img
        src="/images/success-logo.png"
        alt=""
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-10">
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians"
          className="w-12 h-12 object-contain mb-4"
        />
        <h1 className="text-[32px] font-bold text-gotf-green mb-3">
          {circleName}
        </h1>
        <p className="text-[18px] text-[#333] mb-8 max-w-[288px] leading-snug">
          Copy and share this link to invite people to join this circle
        </p>

        {/* Copy invitation link */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-5 w-full max-w-[322px] border border-[#ccc] rounded-[10px] px-10 py-5 mb-3 text-left"
        >
          <Link2 size={20} className="text-text-primary shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-base font-bold text-black">
              {copied ? "Copied!" : "Copy invitation link"}
            </span>
            <span className="text-base text-[#bfbfbf] truncate">
              {joinLink}
            </span>
          </div>
        </button>

        {/* Circle Details PDF */}
        {/* <button
          className="flex items-center gap-5 w-full max-w-[322px] h-[60px] border border-[#ccc] rounded-full px-10"
        >
          <Download size={20} className="text-text-primary shrink-0" />
          <span className="text-base font-medium text-black">Circle Details PDF</span>
        </button> */}
      </div>

      {/* Done */}
      <div className="absolute mb-20 left-0 right-0 px-5">
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
  const {
    mutate: createCircle,
    isPending,
    error: apiError,
  } = useCreateCircle();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CircleFormData>(initialForm);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [selectedLead, setSelectedLead] = useState<AuthUser | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [createdCircle, setCreatedCircle] =
    useState<CreateCircleResponse | null>(null);

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
    const selectedChannel = CHANNELS.find((c) => c.id === form.channelType);
    createCircle(
      {
        metadata: {
          name: form.name,
          description: form.description,
          createdBy: user.id,
          creatorAvatarUrl: user.user_metadata.avatarUrl,
          communicationChannels:
            selectedChannel && form.channelUrl
              ? [
                  {
                    name: selectedChannel.name,
                    url: form.channelUrl,
                    icon: selectedChannel.name,
                  },
                ]
              : [],
          ...(selectedLead ? { circleLeadId: selectedLead.id } : {}),
          region: {
            placeId: location?.placeId ?? "",
            city: location?.city ?? "",
            suburb: location?.suburb ?? "",
            province: location?.province ?? "",
            country: location?.country ?? "",
            countryCode: location?.countryCode ?? "",
            postalCode: location?.postalCode ?? "",
            latitude: location?.latitude ?? 0,
            longitude: location?.longitude ?? 0,
            formattedAddress: location?.formattedAddress ?? "",
          },
        },
        bannerFile: bannerFile ?? undefined,
      },
      {
        onSuccess: (response) => {
          setCreatedCircle(response);
          next();
        },
      },
    );
  };

  const submitError = apiError instanceof Error ? apiError.message : null;

  if (step === 4 && createdCircle) {
    return (
      <div className="relative min-h-dvh">
        <div className="absolute top-8 left-10 z-20">
          <button
            onClick={back}
            className="size-10 flex items-center"
            aria-label="Back"
          >
            <ChevronLeft size={20} className="text-text-muted" />
          </button>
        </div>
        <div className="absolute top-8 right-10 z-20">
          <button
            onClick={close}
            className="size-10 flex items-center justify-end"
            aria-label="Close"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>
        <Step4
          circleName={createdCircle.name}
          joinLink={createdCircle.joinLink}
          onDone={close}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <WizardHeader step={step} onBack={back} onClose={close} />

      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <Step1
            form={form}
            onChange={updateForm}
            selectedLead={selectedLead}
            onSelectLead={setSelectedLead}
            onRemoveLead={() => setSelectedLead(null)}
          />
        )}
        {step === 2 && <Step2 location={location} onSelect={setLocation} />}
        {step === 3 && (
          <Step3
            form={form}
            onChange={updateForm}
            onFileSelect={setBannerFile}
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
