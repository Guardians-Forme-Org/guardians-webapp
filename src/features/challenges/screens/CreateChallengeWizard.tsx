"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Download,
  MessageCircle,
  Globe,
  Mail,
  MapPin,
} from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import Text from "@/components/ui/Text";
import { challenges } from "../data";
import LocationPicker, { type LocationResult } from "@/components/ui/LocationPicker";

// ── Static data ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "compost-sprint",  name: "Compost Sprint",  subtitle: "Highly Popular",  by: "Green Urban youth" },
  { id: "urban-greening",  name: "Urban Greening",  subtitle: "Since 12 March",  by: "Green Urban youth" },
  { id: "heat-mapping",    name: "Heat Mapping",    subtitle: "Since 12 March",  by: "Green Urban youth" },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

const FACILITATORS = [
  { id: "1", rank: 1, name: "Yolanda", joinDate: "12 March 2026"    },
  { id: "2", rank: 2, name: "Xavier",  joinDate: "1 December 2026"  },
  { id: "3", rank: 3, name: "Thabang", joinDate: "4 April 2026",    locked: true },
  { id: "4", rank: 4, name: "Thabang", joinDate: "24 August 2026"   },
  { id: "5", rank: 5, name: "Victor",  joinDate: "24 February 2026" },
];

const CHANNELS = [
  { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { id: "facebook" as const, label: "Facebook", icon: Globe },
  { id: "email"   as const, label: "Email",     icon: Mail },
];

const CIRCLES = ["Green Urban Youth", "Urban Watch", "Eco Homes"];

// ── Form state ─────────────────────────────────────────────────────────────────

type Channel = "whatsapp" | "facebook" | "email";

type FormData = {
  templateId: TemplateId;
  name: string;
  region: string;
  description: string;
  supportedBy: string;
  facilitatorId: string;
  channel: Channel;
  channelLink: string;
};

const initialForm: FormData = {
  templateId: "compost-sprint",
  name: "",
  region: "",
  description: "",
  supportedBy: "",
  facilitatorId: "",
  channel: "whatsapp",
  channelLink: "",
};

// ── Progress bar ───────────────────────────────────────────────────────────────

const PROGRESS_FILLED: Record<number, number> = {
  1: 1,
  2: 0, // template preview — no bar
  3: 2,
  4: 3,
  5: 5,
  6: 6,
  7: 0, // done — no bar
};

// ── Shared sub-components ──────────────────────────────────────────────────────

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
        <button onClick={onBack} className="size-10 flex items-center" aria-label="Back">
          <ChevronLeft size={20} className="text-text-muted" />
        </button>
        <button onClick={onClose} className="size-10 flex items-center justify-end" aria-label="Close">
          <X size={20} className="text-text-muted" />
        </button>
      </div>

      {filled > 0 && (
        <div className="flex gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
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
  description: string;
  boldWord?: string;
}) {
  const parts = boldWord ? description.split(boldWord) : null;
  return (
    <div className="px-10 mt-7 mb-7">
      <h1 className="text-[32px] font-bold text-gotf-green leading-tight">{title}</h1>
      <p className="text-[18px] text-black mt-4 leading-relaxed">
        {parts ? (
          <>{parts[0]}<strong>{boldWord}</strong>{parts[1]}</>
        ) : description}
      </p>
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

function RadioCircle({ selected }: { selected: boolean }) {
  return selected ? (
    <div className="size-5 rounded-full border-2 border-gotf-green flex items-center justify-center shrink-0">
      <div className="size-2.5 rounded-full bg-gotf-green" />
    </div>
  ) : (
    <div className="size-5 rounded-full border-2 border-[#ccc] shrink-0" />
  );
}

// ── Step 1 — Choose Template ───────────────────────────────────────────────────

function Step1({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (id: TemplateId) => void;
}) {
  return (
    <>
      <WizardTitle
        title="Start a Challenge"
        description="Choose a template below to create a challenge."
        boldWord="create"
      />

      {/* Search */}
      <div className="px-10 mb-6">
        <div className="flex items-center gap-2 bg-white shadow-sm rounded-full px-5 h-[50px]">
          <Search size={16} className="text-text-muted shrink-0" />
          <span className="text-base text-[#737373]">Find challenge templates</span>
        </div>
      </div>

      {/* Template options */}
      <div className="flex flex-col gap-3 px-10">
        {TEMPLATES.map((t) => {
          const selected = form.templateId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex items-center justify-between pl-[30px] pr-5 py-[18px] rounded-[16px] text-left transition-colors ${
                selected ? "border-2 border-gotf-green" : "border border-border"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-[18px] font-bold text-text-subheading">{t.name}</p>
                <p className="text-[14px] text-text-subheading">{t.subtitle}</p>
                <p className="text-[14px] text-text-muted">by {t.by}</p>
              </div>
              <RadioCircle selected={selected} />
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Step 2 — Template Preview ──────────────────────────────────────────────────

function Step2({ form }: { form: FormData }) {
  const template = TEMPLATES.find((t) => t.id === form.templateId) ?? TEMPLATES[0];
  const templateSteps = challenges[0].steps;

  return (
    <>
      <div className="px-10 mt-5 mb-8">
        <h1 className="text-[32px] font-bold text-gotf-green">{template.name}</h1>
        <p className="text-[18px] text-black mt-3 leading-relaxed">
          The {template.name} is a challenge that supports the environment ESG target
        </p>
      </div>

      <div className="px-10 mb-5">
        <p className="text-xl font-semibold text-text-subheading">Steps</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {templateSteps.map((s) => (
          <div
            key={s.id}
            className="flex gap-3.75 items-center border border-[#eee] rounded-[10px] px-4 py-2.5 mx-6"
          >
            <span className="w-2.5 text-center font-medium text-base text-black shrink-0">{s.rank}</span>
            <div className={`size-15 rounded-lg overflow-hidden shrink-0 ${s.locked ? "bg-[#ccc] opacity-50" : "bg-surface"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text-primary leading-tight">{s.title}</p>
              <p className="text-xs text-text-primary truncate mt-0.5">{s.description}</p>
              <p className="text-xs text-text-secondary">{s.phase}</p>
            </div>
            <ChevronRight size={24} className="text-text-muted shrink-0" />
          </div>
        ))}
      </div>
    </>
  );
}

// ── Step 3 — Challenge Details ─────────────────────────────────────────────────

function Step3({
  form,
  onChange,
  location,
  onLocationSelect,
}: {
  form: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  location: LocationResult | null;
  onLocationSelect: (place: LocationResult) => void;
}) {
  return (
    <>
      <WizardTitle
        title="Start a Challenge"
        description="Please fill out the fields below to create a challenge."
        boldWord="create"
      />

      <div className="flex flex-col gap-7 px-10">
        {/* Challenge Name */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Challenge Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="This will be shown to be public"
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#737373] outline-none"
          />
        </div>

        {/* Region */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Region
          </label>
          <LocationPicker
            defaultValue={location?.formattedAddress}
            onSelect={onLocationSelect}
            placeholder="Where is this challenge located?"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Tell us more about the challenge"
            rows={4}
            className="border border-[#d9d9d9] rounded-[8px] px-4 py-5 text-base placeholder:text-[#737373] outline-none resize-none"
          />
        </div>

        {/* Supported by */}
        <div className="flex flex-col gap-1.5">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Supported by
          </label>
          <p className="text-xs text-[#8f8f8c]">
            This would be the circle that will do the challenge
          </p>
          <div className="relative">
            <select
              value={form.supportedBy}
              onChange={(e) => onChange("supportedBy", e.target.value)}
              className="w-full h-11 border border-[rgba(26,26,24,0.28)] rounded-[8px] px-4 text-base text-text-primary outline-none appearance-none bg-white"
            >
              <option value=""></option>
              {CIRCLES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronRight
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted rotate-90 pointer-events-none"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Step 4 — Choose Facilitator ────────────────────────────────────────────────

function Step4({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <WizardTitle
        title="Choose a facilitator"
        description="Choose from the facilitators below to continue."
        boldWord="facilitators"
      />

      <SearchBar placeholder="Find a facilitator" />

      <div className="flex flex-col gap-7.5 px-7.5">
        {FACILITATORS.map((f) => {
          const selected = form.facilitatorId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onChange(f.id)}
              className="flex items-center gap-3.75 w-full text-left"
            >
              <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
                {f.rank}
              </span>
              <div
                className={`size-15 rounded-full overflow-hidden shrink-0 border-2 border-white ${
                  f.locked ? "bg-[#ccc] opacity-50" : "bg-[#d9d9d9]"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-base font-semibold ${selected ? "text-gotf-green" : "text-text-primary"}`}>
                  {f.name}
                </p>
                <Text variant="caption" className="text-text-secondary">
                  Joined {f.joinDate}
                </Text>
              </div>
              {selected ? (
                <RadioCircle selected />
              ) : (
                <ChevronRight size={24} className="text-text-muted shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Step 5 — Communication Channel ────────────────────────────────────────────

function Step5({
  form,
  onChannelChange,
  onLinkChange,
}: {
  form: FormData;
  onChannelChange: (ch: Channel) => void;
  onLinkChange: (v: string) => void;
}) {
  return (
    <>
      <WizardTitle
        title={"Choose a channel for communication"}
        description={"Choose one of the channels below for the circle's communication."}
        boldWord="channels"
      />

      <div className="flex flex-col gap-2.5 px-10">
        {CHANNELS.map(({ id, label, icon: Icon }) => {
          const selected = form.channel === id;
          return (
            <button
              key={id}
              onClick={() => onChannelChange(id)}
              className={`flex items-center justify-between h-[50px] px-5 rounded-[8px] border transition-colors ${
                selected ? "border-gotf-green" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={22} className={selected ? "text-gotf-green" : "text-text-muted"} />
                <span className="text-base text-text-primary">{label}</span>
              </div>
              <RadioCircle selected={selected} />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 px-10 mt-7">
        <label className="text-base font-medium text-text-primary tracking-[0.16px]">
          Communication Channel Link{" "}
          <span className="text-[rgba(60,60,67,0.29)] font-normal">(Optional)</span>
        </label>
        <input
          type="url"
          value={form.channelLink}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder="Paste your group or channel link"
          className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
        />
      </div>
    </>
  );
}

// ── Step 6 — Review & Publish ─────────────────────────────────────────────────

function Step6({
  form,
  onPublish,
}: {
  form: FormData;
  onPublish: () => void;
}) {
  const template = TEMPLATES.find((t) => t.id === form.templateId) ?? TEMPLATES[0];
  const templateSteps = challenges[0].steps;
  const facilitator = FACILITATORS.find((f) => f.id === form.facilitatorId) ?? FACILITATORS[0];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="h-60 bg-zinc-900 shrink-0 relative">
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* White card overlapping hero */}
      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
        <div className="px-10 pt-7.5">
          <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
            {form.supportedBy || "Urban Greening"}
          </span>
          <h1 className="text-[28px] font-bold text-text-subheading mt-3 leading-tight">
            {form.name || template.name}
          </h1>
          <p className="text-base text-[#666] mt-1">Since 12 March</p>

          <div className="mt-3 mb-6">
            <button
              onClick={onPublish}
              className="px-5 h-10 bg-linear-to-r from-[#008000] to-[#129612] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
            >
              Publish
            </button>
          </div>
        </div>

        {/* Home tab indicator */}
        <div className="flex px-10">
          <div className="px-5 h-10 flex items-center text-base border-b-2 border-[#303030] text-[#303030] font-medium">
            Home
          </div>
        </div>
        <div className="border-t border-progress-track" />

        {/* Location */}
        <div className="px-10 py-5">
          <div className="flex items-center gap-1.5">
            <MapPin size={16} className="text-gotf-green shrink-0" />
            <p className="text-base">
              <span className="font-semibold text-text-primary">{form.region || "Durban"}</span>
              <span className="text-[#666]">, KwaZulu Natal</span>
            </p>
          </div>
          <p className="text-base text-[#666] mt-1 ml-5.5">300m from you</p>
        </div>

        <div className="border-t border-progress-track" />

        {/* Description */}
        <div className="px-10 py-5">
          <p className="text-base text-[#666] leading-relaxed line-clamp-3">
            {form.description ||
              `"${template.name} is a challenge focused on building community environmental impact through practical, shared action."`}
          </p>
          <button className="text-base text-gotf-blue mt-2">Show more</button>
        </div>

        <div className="border-t border-progress-track" />

        {/* Progress */}
        <div className="px-10 py-7.5 flex flex-col gap-7.5">
          <div className="flex flex-col gap-3">
            <p className="text-xl font-semibold text-text-subheading">Progress</p>
            <div className="flex items-center gap-5">
              <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full" />
              <p className="text-xl text-text-primary shrink-0">0%</p>
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="flex flex-col gap-2.5">
              <Text variant="caption" className="text-text-muted">Target date</Text>
              <p className="text-base font-semibold text-text-subheading">27 September 2026</p>
            </div>
            <div className="mx-7.5 border-r border-progress-track" />
            <div className="flex flex-col gap-2.5">
              <Text variant="caption" className="text-text-muted">Time left</Text>
              <p className="text-base font-semibold text-text-subheading">1 week</p>
            </div>
          </div>
        </div>

        <div className="border-t border-progress-track" />

        {/* Facilitator */}
        <div className="flex items-center gap-5 px-7.5 py-5 border-b border-progress-track">
          <div className="size-10 rounded-full bg-surface border border-border shrink-0" />
          <div>
            <p className="text-xl font-semibold text-text-primary">{facilitator.name}</p>
            <p className="text-base font-medium text-text-secondary">Facilitator</p>
          </div>
        </div>

        {/* Members */}
        <div className="border-b border-progress-track">
          <div className="flex items-center justify-between px-7.5 pt-7 pb-5">
            <p className="text-xl font-bold text-text-subheading">
              <span className="font-normal">by</span>{" "}
              {form.supportedBy || "Green Urban youth"}
            </p>
            <button className="text-base text-gotf-blue">See all</button>
          </div>

          <div className="flex justify-between px-7.5 pb-6">
            {["Jabu", "Xoliswa", "Thabang", "Mpho", "Roni"].map((name) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white" />
                <Text variant="caption" className="text-text-subheading">{name}</Text>
              </div>
            ))}
          </div>

          <div className="flex justify-center pb-7">
            <button className="flex items-center gap-2.5 px-5 h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
              <MessageCircle size={20} className="fill-white text-white" />
              Join Conversation
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="py-6 pb-10">
          <p className="text-xl font-semibold text-text-subheading px-10 mb-4">Steps</p>
          <div className="flex flex-col gap-2.5">
            {templateSteps.map((s) => (
              <div
                key={s.id}
                className="flex gap-3.75 items-center border border-[#eee] rounded-[10px] px-4 py-2.5 mx-6"
              >
                <span className="w-2.5 text-center font-medium text-base text-black shrink-0">{s.rank}</span>
                <div className={`size-15 rounded-lg overflow-hidden shrink-0 ${s.locked ? "bg-[#ccc] opacity-50" : "bg-surface"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-text-primary leading-tight">{s.title}</p>
                  <p className="text-xs text-text-primary truncate mt-0.5">{s.description}</p>
                  <p className="text-xs text-text-secondary">{s.phase}</p>
                </div>
                <ChevronRight size={24} className="text-text-muted shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 7 — Done ─────────────────────────────────────────────────────────────

function Step7({ onDone }: { onDone: () => void }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-white overflow-hidden">
      <img src="/images/success-logo.png" alt="" aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-10">
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians"
          className="w-12 h-12 object-contain mb-6"
        />
        <h1 className="text-[32px] font-bold text-gotf-green mb-8">Challenge created</h1>

        <button className="flex items-center gap-5 w-full max-w-[322px] h-[60px] bg-white border border-border rounded-full px-10 mb-8">
          <Download size={20} className="text-text-primary shrink-0" />
          <span className="text-base font-medium text-text-primary">Challenge Details PDF</span>
        </button>
      </div>

      {/* Done button */}
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

const NEXT_LABELS: Record<number, string> = {
  1: "Next",
  2: "Continue Challenge",
  3: "Next",
  4: "Next",
  5: "Review and Publish",
};

export default function CreateChallengeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [location, setLocation] = useState<LocationResult | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, 7));
  const back = () => {
    if (step <= 1) router.back();
    else setStep((s) => s - 1);
  };
  const close = () => router.push("/discover");

  const updateForm = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  if (step === 7) return <Step7 onDone={close} />;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <WizardHeader step={step} onBack={back} onClose={close} />

      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <Step1
            form={form}
            onChange={(id) => updateForm("templateId", id)}
          />
        )}
        {step === 2 && <Step2 form={form} />}
        {step === 3 && (
          <Step3
            form={form}
            onChange={updateForm}
            location={location}
            onLocationSelect={setLocation}
          />
        )}
        {step === 4 && (
          <Step4
            form={form}
            onChange={(id) => updateForm("facilitatorId", id)}
          />
        )}
        {step === 5 && (
          <Step5
            form={form}
            onChannelChange={(ch) => updateForm("channel", ch)}
            onLinkChange={(v) => updateForm("channelLink", v)}
          />
        )}
        {step === 6 && <Step6 form={form} onPublish={next} />}
      </div>

      {/* Only steps 1–5 use the bottom Next button; step 6 uses the inline Publish */}
      {step <= 5 && (
        <WizardNextButton label={NEXT_LABELS[step] ?? "Next"} onClick={next} />
      )}
    </div>
  );
}
