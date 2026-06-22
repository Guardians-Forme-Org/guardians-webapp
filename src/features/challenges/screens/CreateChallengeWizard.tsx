"use client";

import LocationPicker, {
  type LocationResult,
} from "@/components/ui/LocationPicker";
import SearchBar from "@/components/ui/SearchBar";
import WizardSuccessScreen from "@/components/ui/WizardSuccessScreen";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateChallenge, useTemplates } from "@/lib/hooks/challenges";
import { useCircle } from "@/lib/hooks/circles";
import { useUsers } from "@/lib/hooks/users";
import type { AuthUser } from "@/lib/types/auth";
import type { ApiChallenge, ApiTemplate } from "@/lib/types/challenges";
import type { ApiCircle } from "@/lib/types/circles";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const CHANNELS = [
  { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { id: "facebook" as const, label: "Facebook", icon: Globe },
  { id: "email" as const, label: "Email", icon: Mail },
];

// ── Form state ─────────────────────────────────────────────────────────────────

type Channel = "whatsapp" | "facebook" | "email";

type FormData = {
  templateId: string;
  name: string;
  region: string;
  description: string;
  circleId: string;
  supportedBy: string;
  facilitatorId: string;
  channel: Channel;
  channelLink: string;
  bannerUrl: string;
};

const initialForm: FormData = {
  templateId: "",
  name: "",
  region: "",
  description: "",
  circleId: "",
  supportedBy: "",
  facilitatorId: "",
  channel: "whatsapp",
  channelLink: "",
  bannerUrl: "",
};

// ── Progress bar ───────────────────────────────────────────────────────────────

const PROGRESS_FILLED: Record<number, number> = {
  1: 1,
  2: 0, // template preview — no bar
  3: 2,
  4: 3,
  5: 5,
  6: 0,
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
        <button
          onClick={onBack}
          className="size-10 flex items-center"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-text-muted" />
        </button>
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
      <h1 className="text-[32px] font-bold text-gotf-green leading-tight">
        {title}
      </h1>
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
  templates,
  isLoading,
}: {
  form: FormData;
  onChange: (id: string) => void;
  templates: ApiTemplate[];
  isLoading: boolean;
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
        <div className="flex items-center gap-2 bg-white shadow-sm rounded-full px-5 h-12.5">
          <Search size={16} className="text-text-muted shrink-0" />
          <span className="text-base text-[#737373]">
            Find challenge templates
          </span>
        </div>
      </div>

      {/* Template options */}
      <div className="flex flex-col gap-3 px-10">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-21.5 rounded-2xl border border-border bg-surface animate-pulse"
            />
          ))
        ) : templates.length === 0 ? (
          <p className="text-base text-text-muted text-center py-8">
            No templates available
          </p>
        ) : (
          templates.map((t) => {
            const selected = form.templateId === t.templateId;
            return (
              <button
                key={t.templateId}
                onClick={() => onChange(t.templateId)}
                className={`flex items-center justify-between pl-7.5 pr-5 py-4.5 rounded-2xl text-left transition-colors ${
                  selected
                    ? "border-2 border-gotf-green"
                    : "border border-border"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-[18px] font-bold text-text-subheading">
                    {t.name}
                  </p>
                  <p className="text-[14px] text-text-subheading line-clamp-1">
                    {t.description}
                  </p>
                  <p className="text-[14px] text-text-muted">
                    {t.targetSDG.title}
                  </p>
                </div>
                <RadioCircle selected={selected} />
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

// ── SDG URL adapter ────────────────────────────────────────────────────────────

function buildSdgUrl(code: string): string {
  const number = code.replace(/\D/g, "");
  return `https://sdgs.un.org/goals/goal${number}`;
}

// ── Step 2 — Template Preview ──────────────────────────────────────────────────

function Step2({
  form,
  templates,
}: {
  form: FormData;
  templates: ApiTemplate[];
}) {
  const template =
    templates.find((t) => t.templateId === form.templateId) ?? templates[0];
  const templateSteps = template?.steps ?? [];
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const sdgNumber = template?.targetSDG?.code?.replace(/\D/g, "") ?? "";

  return (
    <>
      {/* Title + description */}
      <div className="px-10 mt-5 mb-5">
        <h1 className="text-[32px] font-bold text-gotf-green">
          {template?.name}
        </h1>
        <p className="text-[18px] text-black mt-3 leading-relaxed">
          The {template?.name} is a challenge that supports the{" "}
          <span className="font-bold">'{template?.targetSDG?.title}'</span>{" "}
          Sustainable Development Goals.
        </p>
      </div>

      {/* SDG badge */}
      {template?.targetSDG && (
        <div className="px-10 mb-7">
          <a
            href={buildSdgUrl(template.targetSDG.code)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 h-8 border-2 border-[#56c02b] rounded-[20px]"
          >
            <p className="text-[14px] text-[#1a1a1a] whitespace-nowrap">
              SDG{" "}
              <span className="font-bold">
                {sdgNumber} {template.targetSDG.title.toUpperCase()}
              </span>
            </p>
            <ExternalLink size={14} className="shrink-0 text-[#1a1a1a]" />
          </a>
        </div>
      )}

      {/* Steps */}
      <div className="px-10 mb-5">
        <p className="text-xl font-semibold text-text-subheading">Steps</p>
      </div>

      <div className="flex flex-col gap-2.5 px-6">
        {templateSteps.map((s) => {
          const expanded = expandedStepId === s.stepId;
          return (
            <div
              key={s.stepId}
              className="border border-[#eee] rounded-[10px] overflow-hidden"
            >
              <button
                onClick={() => setExpandedStepId(expanded ? null : s.stepId)}
                className="flex gap-3 items-center w-full text-left px-4 py-2.5"
              >
                <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
                  {s.stepNumber}
                </span>
                <div className="size-15 rounded-lg overflow-hidden shrink-0 bg-surface" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[#1a1a1a] leading-tight">
                    {s.title}
                  </p>
                  <p className="text-xs text-[#1a1a1a] truncate mt-0.5 opacity-80">
                    {s.description}
                  </p>
                  <p className="text-xs text-[#999]">{s.stepType}</p>
                </div>
                <ChevronRight
                  size={24}
                  className={`text-text-muted shrink-0 transition-transform duration-200 ${
                    expanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {expanded && (
                <div className="px-4 pb-4 pt-2 border-t border-[#eee]">
                  <p className="text-sm text-[#333] leading-relaxed">
                    {s.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Equipment */}
      {template?.equipments && template.equipments.length > 0 && (
        <div className="mt-7 pb-10">
          <button
            onClick={() => setEquipmentOpen((o) => !o)}
            className="flex items-center justify-between w-full px-10 mb-4"
          >
            <p className="text-xl font-semibold text-text-subheading">
              Equipment
            </p>
            <ChevronRight
              size={20}
              className={`text-text-muted transition-transform duration-200 ${
                equipmentOpen ? "rotate-90" : ""
              }`}
            />
          </button>

          {equipmentOpen && (
            <div className="flex flex-col gap-3 px-6">
              {template.equipments.map((eq, i) => (
                <div
                  key={i}
                  className="border border-[#eee] rounded-[10px] px-4 py-3"
                >
                  <p className="text-base font-semibold text-[#1a1a1a]">
                    {eq.name}
                  </p>
                  <p className="text-sm text-[#666] mt-1 leading-relaxed">
                    {eq.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Step 3 — Challenge Details ─────────────────────────────────────────────────

function Step3({
  form,
  onChange,
  onFileSelect,
  location,
  onLocationSelect,
}: {
  form: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onFileSelect: (file: File) => void;
  location: LocationResult | null;
  onLocationSelect: (place: LocationResult) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange("bannerUrl", URL.createObjectURL(file));
      onFileSelect(file);
    }
  };

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

        {/* Banner image */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Challenge Image
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-[12px] overflow-hidden border border-[#d9d9d9] bg-surface flex items-center justify-center"
          >
            {form.bannerUrl ? (
              <img
                src={form.bannerUrl}
                alt="Challenge banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <ImageIcon size={36} strokeWidth={1.2} />
                <p className="text-sm">Tap to upload an image</p>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Supported by — TODO: resolve circle name from circleId and display here */}
      </div>
    </>
  );
}

// ── Step 4 — Choose Facilitator ────────────────────────────────────────────────

function displayName(u: AuthUser) {
  const first = u.user_metadata.firstName?.trim();
  const last = u.user_metadata.lastName?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return u.user_metadata.username || u.email;
}

function Step4({
  form,
  onChange,
  users,
  isLoading,
}: {
  form: FormData;
  onChange: (id: string) => void;
  users: AuthUser[];
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? users.filter((u) =>
        displayName(u).toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <>
      <WizardTitle
        title="Choose a facilitator"
        description="Choose from the facilitators below to continue."
        boldWord="facilitators"
      />

      <div className="sticky top-0 bg-white z-10">
        <SearchBar placeholder="Find a facilitator" onChange={setSearch} />
      </div>

      <div className="flex flex-col gap-7.5 px-7.5 pb-6">
        {isLoading ? (
          <p className="text-text-secondary text-sm">Loading facilitators…</p>
        ) : (
          filtered.map((u, i) => {
            const name = displayName(u);
            const joinDate = new Date(u.created_at).toLocaleDateString(
              "en-GB",
              { day: "numeric", month: "long", year: "numeric" },
            );
            const selected = form.facilitatorId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => onChange(u.id)}
                className="flex items-center gap-3.75 w-full text-left"
              >
                <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
                  {i + 1}
                </span>
                <div className="size-15 rounded-full overflow-hidden shrink-0 border-2 border-white bg-[#d9d9d9]">
                  {u.user_metadata.avatarUrl && (
                    <img
                      src={u.user_metadata.avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base font-semibold ${selected ? "text-gotf-green" : "text-text-primary"}`}
                  >
                    {name}
                  </p>
                  <Text variant="caption" className="text-text-secondary">
                    Joined {joinDate}
                  </Text>
                </div>
                {selected ? (
                  <RadioCircle selected />
                ) : (
                  <ChevronRight
                    size={24}
                    className="text-text-muted shrink-0"
                  />
                )}
              </button>
            );
          })
        )}
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
        description={
          "Choose one of the channels below for the circle's communication."
        }
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
                <Icon
                  size={22}
                  className={selected ? "text-gotf-green" : "text-text-muted"}
                />
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
          <span className="text-[rgba(60,60,67,0.29)] font-normal">
            (Optional)
          </span>
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

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m from you`;
  return `${km.toFixed(1)}km from you`;
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-medium text-text-muted active:opacity-60 shrink-0"
    >
      <Pencil size={12} />
      {label}
    </button>
  );
}

function Step6({
  form,
  onPublish,
  templates,
  isPending,
  users,
  location,
  onGoToStep,
  circle,
}: {
  form: FormData;
  onPublish: () => void;
  templates: ApiTemplate[];
  isPending: boolean;
  users: AuthUser[];
  location: import("@/components/ui/LocationPicker").LocationResult | null;
  onGoToStep: (step: number) => void;
  circle: ApiCircle | undefined;
}) {
  const { user } = useAuth();

  const template =
    templates.find((t) => t.templateId === form.templateId) ?? templates[0];
  const templateSteps = template?.steps ?? [];

  const facilitatorUser = users.find((u) => u.id === form.facilitatorId);
  const facilitatorName = facilitatorUser
    ? displayName(facilitatorUser)
    : "Facilitator";
  const facilitatorAvatar = facilitatorUser?.user_metadata.avatarUrl ?? "";

  const circleMembers = circle?.members ?? [];

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const userLat = user?.user_metadata.location?.latitude;
  const userLon = user?.user_metadata.location?.longitude;
  const userHasLocation =
    userLat != null && userLon != null && !(userLat === 0 && userLon === 0);
  const distanceLabel =
    location && userHasLocation
      ? formatDistance(
          haversineKm(
            userLat!,
            userLon!,
            location.latitude,
            location.longitude,
          ),
        )
      : null;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="h-60 bg-zinc-900 shrink-0 relative overflow-hidden">
        {(form.bannerUrl || circle?.bannerUrl) && (
          <img
            src={form.bannerUrl || circle!.bannerUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* White card overlapping hero */}
      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
        <div className="px-10 pt-7.5">
          {circle?.name && (
            <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
              {circle.name}
            </span>
          )}
          <div className="flex items-start justify-between mt-3 gap-2">
            <h1 className="text-[28px] font-bold text-text-subheading leading-tight">
              {form.name || template?.name}
            </h1>
            <EditButton label="Edit" onClick={() => onGoToStep(3)} />
          </div>
          <p className="text-base text-[#666] mt-1">Since {today}</p>

          <div className="mt-3 mb-6">
            <button
              onClick={onPublish}
              disabled={isPending}
              className="px-5 h-10 bg-linear-to-r from-[#008000] to-[#129612] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-60"
            >
              {isPending ? "Publishing…" : "Publish"}
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
        {location && (
          <div className="px-10 py-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Location</span>
              <EditButton label="Edit" onClick={() => onGoToStep(3)} />
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={16} className="text-gotf-green shrink-0" />
              <p className="text-base">
                <span className="font-semibold text-text-primary">
                  {location.city}
                </span>
                {location.province && (
                  <span className="text-[#666]">, {location.province}</span>
                )}
              </p>
            </div>
            {distanceLabel && (
              <p className="text-base text-[#666] mt-1 ml-5.5">
                {distanceLabel}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-progress-track" />

        {/* Description */}
        <div className="px-10 py-5">
          {form.description && (
            <p className="text-base text-[#666] leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        <div className="border-t border-progress-track" />

        {/* Progress */}
        <div className="px-10 py-7.5 flex flex-col gap-7.5">
          <div className="flex flex-col gap-3">
            <p className="text-xl font-semibold text-text-subheading">
              Progress
            </p>
            <div className="flex items-center gap-5">
              <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full" />
              <p className="text-xl text-text-primary shrink-0">0%</p>
            </div>
          </div>
        </div>

        <div className="border-t border-progress-track" />

        {/* Facilitator */}
        <div className="flex items-center gap-5 px-7.5 py-5 border-b border-progress-track">
          <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-5 flex-1">
          <div className="size-10 rounded-full bg-surface border border-border shrink-0 overflow-hidden">
            {facilitatorAvatar && (
              <img
                src={facilitatorAvatar}
                alt={facilitatorName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <p className="text-xl font-semibold text-text-primary">
              {facilitatorName}
            </p>
            <p className="text-base font-medium text-text-secondary">
              Facilitator
            </p>
          </div>
          </div>
          <EditButton label="Edit" onClick={() => onGoToStep(4)} />
          </div>
        </div>

        {/* Members */}
        <div className="border-b border-progress-track">
          <div className="flex items-center justify-between px-7.5 pt-7 pb-5">
            {circle?.name && (
              <p className="text-xl font-bold text-text-subheading">
                <span className="font-normal">by</span>{" "}
                {circle.name}
              </p>
            )}
          </div>

          {circleMembers.length > 0 && (
            <div className="flex gap-2 px-7.5 pb-4">
              {circleMembers.slice(0, 5).map((m) => {
                const memberUser = users.find((u) => u.id === m.userId);
                const name = memberUser ? displayName(memberUser) : m.userId;
                const avatar = m.avatarUrl || memberUser?.user_metadata?.avatarUrl;
                return (
                  <div
                    key={m.userId}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden">
                      {avatar && (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <Text variant="caption" className="text-text-subheading">
                      {name.split(" ")[0]}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-text-muted px-7.5 pb-4">
            Showing circle members. Challenge members will appear once
            published.
          </p>

          <div className="flex justify-center pb-7">
            {form.channelLink ? (
              <div className="flex items-center gap-3">
                <a
                  href={form.channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-5 h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
                >
                  <MessageCircle size={20} className="fill-white text-white" />
                  Join Conversation
                </a>
                <EditButton label="Edit" onClick={() => onGoToStep(5)} />
              </div>
            ) : (
              <button
                onClick={() => onGoToStep(5)}
                className="flex items-center gap-1.5 text-sm text-text-muted underline underline-offset-2"
              >
                <MessageCircle size={14} />
                Add a communication link
              </button>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="py-6 pb-10">
          <p className="text-xl font-semibold text-text-subheading px-10 mb-4">
            Steps
          </p>
          <div className="flex flex-col gap-2.5">
            {templateSteps.map((s) => (
              <div
                key={s.stepId}
                className="flex gap-3.75 items-center border border-[#eee] rounded-[10px] px-4 py-2.5 mx-6"
              >
                <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
                  {s.stepNumber}
                </span>
                <div className="size-15 rounded-lg overflow-hidden shrink-0 bg-surface" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-text-primary leading-tight">
                    {s.title}
                  </p>
                  <p className="text-xs text-text-primary truncate mt-0.5">
                    {s.description}
                  </p>
                  <p className="text-xs text-text-secondary">{s.stepType}</p>
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

// ── Wizard shell ───────────────────────────────────────────────────────────────

const NEXT_LABELS: Record<number, string> = {
  1: "Next",
  2: "Continue Challenge",
  3: "Next",
  4: "Next",
  5: "Review and Publish",
};

export default function CreateChallengeWizard({
  circleId,
}: {
  circleId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...initialForm, circleId });
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [createdChallenge, setCreatedChallenge] = useState<ApiChallenge | null>(null);
  const { data: rawTemplates = [], isLoading: templatesLoading } = useTemplates();
  const templates = rawTemplates.filter((t) =>
    t.name.toLowerCase().includes("compost"),
  );
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: selectedCircle } = useCircle(circleId);
  const createChallenge = useCreateChallenge();

  const next = () => setStep((s) => Math.min(s + 1, 7));
  const back = () => {
    if (step <= 1) router.back();
    else setStep((s) => s - 1);
  };
  const close = () => router.push("/discover");

  const updateForm = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handlePublish = () => {
    const selectedChannel = CHANNELS.find((c) => c.id === form.channel);
    createChallenge.mutate(
      {
        metadata: {
          name: form.name,
          description: form.description,
          circleId: form.circleId,
          templateId: form.templateId,
          challengeCode: form.templateId,
          createdBy: user?.id ?? "",
          facilitatorId: form.facilitatorId,
          equipments: [],
          communicationChannels:
            selectedChannel && form.channelLink
              ? [
                  {
                    name: selectedChannel.label,
                    url: form.channelLink,
                    icon: selectedChannel.label,
                  },
                ]
              : [],
          location: location
            ? { ...location, address: location.formattedAddress }
            : null,
          region: location
            ? { ...location, address: location.formattedAddress }
            : null,
        },
        bannerFile: bannerFile ?? undefined,
      },
      { onSuccess: (data) => { setCreatedChallenge(data); next(); } },
    );
  };

  if (step === 7) {
    const inviteLink = createdChallenge
      ? `${window.location.origin}/challenges/${createdChallenge.challengeId}`
      : undefined;
    return (
      <WizardSuccessScreen
        title="Challenge created"
        subtitle="Copy and share this link to invite people to join this challenge"
        inviteLink={inviteLink}
        onDone={close}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <WizardHeader step={step} onBack={back} onClose={close} />

      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <Step1
            form={form}
            onChange={(id) => updateForm("templateId", id)}
            templates={templates}
            isLoading={templatesLoading}
          />
        )}
        {step === 2 && <Step2 form={form} templates={templates} />}
        {step === 3 && (
          <Step3
            form={form}
            onChange={updateForm}
            onFileSelect={setBannerFile}
            location={location}
            onLocationSelect={setLocation}
          />
        )}
        {step === 4 && (
          <Step4
            form={form}
            onChange={(id) => updateForm("facilitatorId", id)}
            users={users}
            isLoading={usersLoading}
          />
        )}
        {step === 5 && (
          <Step5
            form={form}
            onChannelChange={(ch) => updateForm("channel", ch)}
            onLinkChange={(v) => updateForm("channelLink", v)}
          />
        )}
        {step === 6 && (
          <Step6
            form={form}
            onPublish={handlePublish}
            templates={templates}
            isPending={createChallenge.isPending}
            users={users}
            location={location}
            onGoToStep={setStep}
            circle={selectedCircle}
          />
        )}
      </div>

      {/* Only steps 1–5 use the bottom Next button; step 6 uses the inline Publish */}
      {step <= 5 && (
        <WizardNextButton label={NEXT_LABELS[step] ?? "Next"} onClick={next} />
      )}
    </div>
  );
}
