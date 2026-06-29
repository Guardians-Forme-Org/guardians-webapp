"use client";

import LocationPicker, {
  type LocationResult,
} from "@/components/ui/LocationPicker";
import SearchBar from "@/components/ui/SearchBar";
import WizardSuccessScreen from "@/components/ui/WizardSuccessScreen";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateChallenge, useUpdateChallenge, useTemplates } from "@/lib/hooks/challenges";
import { useCircle } from "@/lib/hooks/circles";
import { useUsers } from "@/lib/hooks/users";
import type { AuthUser } from "@/lib/types/auth";
import type { ApiChallenge, ApiTemplate } from "@/lib/types/challenges";
import type { ApiCircle, ApiCircleChallenge } from "@/lib/types/circles";
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
import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Avatar from "@/components/ui/Avatar";

const CHALLENGE_DRAFT_KEY = (circleId: string) => `create-challenge-draft-${circleId}`;

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

// Which wizard step each segment index navigates to when clicked
const SEGMENT_TO_STEP: (number | null)[] = [1, 3, 4, 5, 5, null];

// ── Shared sub-components ──────────────────────────────────────────────────────

function WizardHeader({
  step,
  onBack,
  onClose,
  onGoToStep,
}: {
  step: number;
  onBack: () => void;
  onClose: () => void;
  onGoToStep?: (step: number) => void;
}) {
  const tCommon = useTranslations("common");
  const filled = PROGRESS_FILLED[step] ?? 0;

  return (
    <div className="px-10 pt-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="size-10 flex items-center"
          aria-label={tCommon("back")}
        >
          <ChevronLeft size={20} className="text-text-muted" />
        </button>
        <button
          onClick={onClose}
          className="size-10 flex items-center justify-end"
          aria-label={tCommon("close")}
        >
          <X size={20} className="text-text-muted" />
        </button>
      </div>

      {filled > 0 && (
        <div className="flex gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => {
            const targetStep = SEGMENT_TO_STEP[i];
            const isFilled = i < filled;
            const isClickable = onGoToStep && isFilled && targetStep !== null && targetStep < step;
            return isClickable ? (
              <button
                key={i}
                onClick={() => onGoToStep(targetStep!)}
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
  const t = useTranslations("challenges");
  return (
    <>
      <WizardTitle
        title={t("startChallenge")}
        description={t("searchTemplates")}
      />

      {/* Search */}
      <div className="px-10 mb-6">
        <div className="flex items-center gap-2 bg-white shadow-sm rounded-full px-5 h-12.5">
          <Search size={16} className="text-text-muted shrink-0" />
          <span className="text-base text-[#737373]">
            {t("searchTemplates")}
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
            {t("noTemplates")}
          </p>
        ) : (
          templates.map((tmpl) => {
            const selected = form.templateId === tmpl.templateId;
            return (
              <button
                key={tmpl.templateId}
                onClick={() => onChange(tmpl.templateId)}
                className={`flex items-center justify-between pl-7.5 pr-5 py-4.5 rounded-2xl text-left transition-colors ${
                  selected
                    ? "border-2 border-gotf-green"
                    : "border border-border"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-[18px] font-bold text-text-subheading">
                    {tmpl.name}
                  </p>
                  <p className="text-[14px] text-text-subheading line-clamp-1">
                    {tmpl.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(tmpl.SDGAlignments ?? []).map((sdg) => (
                      <span key={sdg.code} className="text-[12px] text-text-muted bg-[rgba(86,192,43,0.12)] rounded-full px-2 py-0.5">
                        {sdg.code}
                      </span>
                    ))}
                  </div>
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
  const t = useTranslations("challenges");
  const template =
    templates.find((tmpl) => tmpl.templateId === form.templateId) ?? templates[0];
  const templateSteps = template?.steps ?? [];
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  return (
    <>
      {/* Title + description */}
      <div className="px-10 mt-5 mb-5">
        <h1 className="text-[32px] font-bold text-gotf-green">
          {template?.name}
        </h1>
        {template?.description && (
          <p className="text-[18px] text-black mt-3 leading-relaxed">
            {template.description}
          </p>
        )}
      </div>

      {/* SDG + Impact Domain pills */}
      {((template?.SDGAlignments?.length ?? 0) > 0 || (template?.impactDomains?.length ?? 0) > 0) && (
        <div className="px-10 mb-7 flex flex-wrap gap-2">
          {(template?.SDGAlignments ?? []).map((sdg) => (
            <a
              key={sdg.code}
              href={buildSdgUrl(sdg.code)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 h-8 border-2 border-[#56c02b] rounded-[20px]"
            >
              <span className="text-[13px] text-[#1a1a1a] font-medium whitespace-nowrap">
                {sdg.code.replace("SDG", "SDG ")} · {sdg.name}
              </span>
              <ExternalLink size={12} className="shrink-0 text-[#1a1a1a]" />
            </a>
          ))}
          {(template?.impactDomains ?? []).map((domain) => (
            <span
              key={domain.code}
              className="inline-flex items-center px-3 h-8 bg-[rgba(0,0,0,0.06)] rounded-[20px] text-[13px] text-[#1a1a1a] font-medium whitespace-nowrap"
            >
              {domain.name}
            </span>
          ))}
        </div>
      )}

      {/* Steps */}
      <div className="px-10 mb-5">
        <p className="text-xl font-semibold text-text-subheading">{t("steps")}</p>
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
              {t("equipment")}
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
  isEdit,
}: {
  form: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onFileSelect: (file: File) => void;
  location: LocationResult | null;
  onLocationSelect: (place: LocationResult) => void;
  isEdit?: boolean;
}) {
  const t = useTranslations("challenges");
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
        title={t("startChallenge")}
        description={t("challengeDescPlaceholder")}
      />

      <div className="flex flex-col gap-7 px-10">
        {/* Challenge Name */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {t("challengeName")}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder={t("challengeNamePlaceholder")}
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#737373] outline-none"
          />
        </div>

        {/* Region */}
        {!isEdit && (
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium text-text-primary tracking-[0.16px]">
              {t("region")}
            </label>
            <LocationPicker
              defaultValue={location?.formattedAddress}
              onSelect={onLocationSelect}
              placeholder={t("challengeLocationPlaceholder")}
            />
          </div>
        )}
        {isEdit && form.region && (
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium text-text-primary tracking-[0.16px]">
              {t("region")}
            </label>
            <div className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 flex items-center bg-[#f9f9f9]">
              <p className="text-base text-text-muted">{form.region}</p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {t("description")}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder={t("challengeDescPlaceholder")}
            rows={4}
            className="border border-[#d9d9d9] rounded-[8px] px-4 py-5 text-base placeholder:text-[#737373] outline-none resize-none"
          />
        </div>

        {/* Banner image */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {t("challengeImage")}
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
                <p className="text-sm">{t("tapToUpload")}</p>
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
  circleMembers,
  currentUserId,
}: {
  form: FormData;
  onChange: (id: string) => void;
  users: AuthUser[];
  isLoading: boolean;
  circleMembers: import("@/lib/types/circles").CircleMember[];
  currentUserId: string;
}) {
  const t = useTranslations("challenges");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const memberIds = new Set(circleMembers.map((m) => m.userId));
  const memberUsers = users.filter((u) => memberIds.has(u.id));

  // Pin current user first, then alphabetical
  const sorted = [
    ...memberUsers.filter((u) => u.id === currentUserId),
    ...memberUsers.filter((u) => u.id !== currentUserId).sort((a, b) =>
      displayName(a).localeCompare(displayName(b)),
    ),
  ];

  const filtered = search
    ? sorted.filter((u) =>
        displayName(u).toLowerCase().includes(search.toLowerCase()),
      )
    : sorted;

  return (
    <>
      <WizardTitle
        title={t("chooseFacilitator")}
        description={t("findFacilitator")}
      />

      <div className="sticky top-0 bg-white z-10">
        <SearchBar placeholder={t("findFacilitator")} onChange={setSearch} />
      </div>

      <div className="flex flex-col gap-7.5 px-7.5 pb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.75 animate-pulse">
              <div className="w-2.5 h-4 bg-surface rounded shrink-0" />
              <div className="size-15 rounded-full bg-surface shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-4 w-32 bg-surface rounded" />
                <div className="h-3 w-24 bg-surface rounded" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">
            {search ? t("noResults") : t("noCircleMembers")}
          </p>
        ) : (
          filtered.map((u, i) => {
            const name = displayName(u);
            const isCurrentUser = u.id === currentUserId;
            const joinDate = new Date(u.created_at).toLocaleDateString(
              locale,
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
                <Avatar
                  src={u.user_metadata.avatarUrl}
                  alt={name}
                  className="size-15 rounded-full shrink-0 border-2 border-white"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-base font-semibold ${selected ? "text-gotf-green" : "text-text-primary"}`}
                    >
                      {name}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs font-medium text-gotf-green bg-[rgba(86,192,43,0.12)] px-2 py-0.5 rounded-full">
                        {t("you")}
                      </span>
                    )}
                  </div>
                  <Text variant="caption" className="text-text-secondary">
                    {t("facilitatorJoined", { date: joinDate })}
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
  const t = useTranslations("challenges");
  return (
    <>
      <WizardTitle
        title={t("chooseChannel")}
        description={t("channelLinkPlaceholder")}
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
          {t("channelLinkLabel")}{" "}
          <span className="text-[rgba(60,60,67,0.29)] font-normal">
            {t("optional")}
          </span>
        </label>
        <input
          type="url"
          value={form.channelLink}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder={t("channelLinkPlaceholder")}
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
  error,
  users,
  location,
  onGoToStep,
  circle,
  isEdit,
}: {
  form: FormData;
  onPublish: () => void;
  templates: ApiTemplate[];
  isPending: boolean;
  error: string | null;
  users: AuthUser[];
  location: import("@/components/ui/LocationPicker").LocationResult | null;
  onGoToStep: (step: number) => void;
  circle: ApiCircle | undefined;
  isEdit?: boolean;
}) {
  const t = useTranslations("challenges");
  const locale = useLocale();
  const { user } = useAuth();

  const template =
    templates.find((tmpl) => tmpl.templateId === form.templateId) ?? templates[0];
  const templateSteps = template?.steps ?? [];

  const facilitatorUser = users.find((u) => u.id === form.facilitatorId);
  const facilitatorName = facilitatorUser
    ? displayName(facilitatorUser)
    : t("facilitator");
  const facilitatorAvatar = facilitatorUser?.user_metadata.avatarUrl ?? "";

  const circleMembers = circle?.members ?? [];

  const today = new Date().toLocaleDateString(locale, {
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
          <div className="flex items-center gap-2 flex-wrap">
            {circle?.name && (
              <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
                {circle.name}
              </span>
            )}
            {(template?.SDGAlignments ?? []).map((sdg) => (
              <span key={sdg.code} className="inline-block bg-[rgba(86,192,43,0.2)] rounded-[20px] px-3 py-1 text-[14px] font-medium text-text-subheading">
                {sdg.code.replace("SDG", "SDG ")}
              </span>
            ))}
            {(template?.impactDomains ?? []).map((domain) => (
              <span key={domain.code} className="inline-block bg-[rgba(0,0,0,0.06)] rounded-[20px] px-3 py-1 text-[14px] font-medium text-text-subheading">
                {domain.name}
              </span>
            ))}

          </div>
          <div className="flex items-start justify-between mt-3 gap-2">
            <h1 className="text-[28px] font-bold text-text-subheading leading-tight min-w-0 break-words">
              {form.name || template?.name}
            </h1>
            <EditButton label={t("edit")} onClick={() => onGoToStep(3)} />
          </div>
          <p className="text-base text-[#666] mt-1">{t("since", { date: today })}</p>

          <div className="mt-3 mb-6 flex flex-col gap-2">
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              onClick={onPublish}
              disabled={isPending}
              className="px-5 h-10 bg-linear-to-r from-[#008000] to-[#129612] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-60 self-start"
            >
              {isPending ? (isEdit ? t("savingChanges") : t("publishing")) : (isEdit ? t("saveChanges") : t("publishButton"))}
            </button>
          </div>
        </div>

        {/* Home tab indicator */}
        <div className="flex px-10">
          <div className="px-5 h-10 flex items-center text-base border-b-2 border-[#303030] text-[#303030] font-medium">
            {t("tabHome")}
          </div>
        </div>
        <div className="border-t border-progress-track" />

        {/* Location */}
        {location && (
          <div className="px-10 py-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t("locationSection")}</span>
              <EditButton label={t("edit")} onClick={() => onGoToStep(3)} />
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
            <p className="text-base text-[#666] leading-relaxed break-words">
              {form.description}
            </p>
          )}
        </div>

        <div className="border-t border-progress-track" />

        {/* Progress */}
        <div className="px-10 py-7.5 flex flex-col gap-7.5">
          <div className="flex flex-col gap-3">
            <p className="text-xl font-semibold text-text-subheading">
              {t("progress")}
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
          <div className="min-w-0">
            <p className="text-xl font-semibold text-text-primary break-words">
              {facilitatorName}
            </p>
            <p className="text-base font-medium text-text-secondary">
              {t("facilitator")}
            </p>
          </div>
          </div>
          <EditButton label={t("edit")} onClick={() => onGoToStep(4)} />
          </div>
        </div>

        {/* Members */}
        <div className="border-b border-progress-track">
          <div className="flex items-center justify-between px-7.5 pt-7 pb-5">
            {circle?.name && (
              <p className="text-xl font-bold text-text-subheading">
                <span className="font-normal">{t("by")}</span>{" "}
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
                    <Avatar src={avatar} alt={name} className="size-16 rounded-full border-2 border-white" />
                    <Text variant="caption" className="text-text-subheading">
                      {name.split(" ")[0]}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-text-muted px-7.5 pb-4">
            {t("circleMembers")}
          </p>

          <div className="flex justify-center pb-7 px-7.5">
            {form.channelLink ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={form.channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-5 h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] shrink-0"
                >
                  <MessageCircle size={20} className="fill-white text-white" />
                  {t("joinConversation")}
                </a>
                <EditButton label={t("edit")} onClick={() => onGoToStep(5)} />
              </div>
            ) : (
              <button
                onClick={() => onGoToStep(5)}
                className="flex items-center gap-1.5 text-sm text-text-muted underline underline-offset-2"
              >
                <MessageCircle size={14} />
                {t("addCommunicationLink")}
              </button>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="py-6 pb-10">
          <p className="text-xl font-semibold text-text-subheading px-10 mb-4">
            {t("steps")}
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

function channelIdFromName(name: string): Channel {
  const lower = name.toLowerCase();
  if (lower.includes("whatsapp")) return "whatsapp";
  if (lower.includes("facebook")) return "facebook";
  return "email";
}

export default function CreateChallengeWizard({
  circleId,
  editChallenge,
}: {
  circleId: string;
  editChallenge?: ApiCircleChallenge;
}) {
  const t = useTranslations("challenges");
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!editChallenge;

  const ch0 = editChallenge?.communicationChannels?.[0];
  const facilitatorId =
    (editChallenge?.facilitator as { id?: string; userId?: string } | null)?.id ??
    (editChallenge?.facilitator as { id?: string; userId?: string } | null)?.userId ??
    "";

  const [step, setStep] = useState(isEdit ? 3 : 1);
  const [form, setForm] = useState<FormData>(
    isEdit
      ? {
          templateId: editChallenge.templateId ?? editChallenge.challengeCode,
          name: editChallenge.name,
          region: editChallenge.region?.formattedAddress ?? "",
          description: editChallenge.description,
          circleId: editChallenge.circleId,
          supportedBy: "",
          facilitatorId,
          channel: ch0 ? channelIdFromName(ch0.name) : "whatsapp",
          channelLink: ch0?.url ?? "",
          bannerUrl: editChallenge.bannerUrl ?? "",
        }
      : { ...initialForm, circleId },
  );
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [createdChallenge, setCreatedChallenge] = useState<ApiChallenge | null>(null);
  const { data: rawTemplates = [], isLoading: templatesLoading } = useTemplates();
  const templates = rawTemplates.filter((t) => {
    const name = t.name.toLowerCase();
    return name.includes("compost") || name.includes("greening");
  });
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: selectedCircle } = useCircle(circleId);
  const createChallenge = useCreateChallenge();
  const updateChallenge = useUpdateChallenge();

  // Load draft from localStorage (create mode only)
  useEffect(() => {
    if (isEdit) return;
    const saved = localStorage.getItem(CHALLENGE_DRAFT_KEY(circleId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm((f) => ({ ...f, ...parsed.form, bannerUrl: "" }));
        if (parsed.location) setLocation(parsed.location);
        if (parsed.step) setStep(parsed.step);
      } catch { /* ignore corrupt draft */ }
    }
  }, [circleId, isEdit]);

  // Persist draft to localStorage (create mode only)
  useEffect(() => {
    if (isEdit) return;
    const { bannerUrl: _url, ...serializableForm } = form;
    localStorage.setItem(CHALLENGE_DRAFT_KEY(circleId), JSON.stringify({ form: serializableForm, location, step }));
  }, [form, location, step, circleId, isEdit]);

  const next = () => setStep((s) => Math.min(s + 1, 7));
  const back = () => {
    if (isEdit && step <= 3) router.back();
    else if (!isEdit && step <= 1) router.back();
    else setStep((s) => s - 1);
  };
  const close = () => {
    if (!isEdit) localStorage.removeItem(CHALLENGE_DRAFT_KEY(circleId));
    router.back();
  };

  const updateForm = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const buildChannels = () => {
    const selectedChannel = CHANNELS.find((c) => c.id === form.channel);
    return selectedChannel && form.channelLink
      ? [{ name: selectedChannel.label, url: form.channelLink, icon: selectedChannel.label }]
      : [];
  };

  const resolveBanner = async (): Promise<File | undefined> => {
    if (bannerFile) return bannerFile;
    try {
      const res = await fetch("/images/Guardians Logo-logo.png");
      const blob = await res.blob();
      return new File([blob], "banner.png", { type: blob.type });
    } catch {
      return undefined;
    }
  };

  const handlePublish = async () => {
    const locationPayload = location
      ? { ...location, address: location.formattedAddress }
      : null;

    if (isEdit) {
      updateChallenge.mutate(
        {
          challengeId: editChallenge!.challengeId,
          payload: {
            name: form.name,
            description: form.description,
            facilitatorId: form.facilitatorId,
            communicationChannels: buildChannels(),
            ...(bannerFile ? {} : { bannerUrl: form.bannerUrl }),
          },
          bannerFile: bannerFile ?? undefined,
        },
        { onSuccess: () => router.push(`/challenges/${editChallenge!.challengeId}`) },
      );
    } else {
      const resolvedBanner = await resolveBanner();
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
            communicationChannels: buildChannels(),
            location: locationPayload,
            region: locationPayload,
          },
          bannerFile: resolvedBanner,
        },
        { onSuccess: (data) => { localStorage.removeItem(CHALLENGE_DRAFT_KEY(circleId)); setCreatedChallenge(data); next(); } },
      );
    }
  };

  if (!isEdit && step === 7) {
    const inviteLink = createdChallenge
      ? `${window.location.origin}/challenges/${createdChallenge.challengeId}`
      : undefined;
    return (
      <WizardSuccessScreen
        title={t("challengeCreated")}
        subtitle={t("challengeCreatedSubtitle")}
        inviteLink={inviteLink}
        onDone={close}
      />
    );
  }

  const isPending = isEdit ? updateChallenge.isPending : createChallenge.isPending;
  const apiError = isEdit ? updateChallenge.error : createChallenge.error;
  const submitError = apiError instanceof Error ? apiError.message : null;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <WizardHeader step={step} onBack={back} onClose={close} onGoToStep={isEdit ? undefined : setStep} />

      <div className="flex-1 overflow-y-auto">
        {step === 1 && !isEdit && (
          <Step1
            form={form}
            onChange={(id) => {
              updateForm("templateId", id);
              const tmpl = templates.find((t) => t.templateId === id);
              if (tmpl?.description) updateForm("description", tmpl.description);
            }}
            templates={templates}
            isLoading={templatesLoading}
          />
        )}
        {step === 2 && !isEdit && <Step2 form={form} templates={templates} />}
        {step === 3 && (
          <Step3
            form={form}
            onChange={updateForm}
            onFileSelect={setBannerFile}
            location={location}
            onLocationSelect={setLocation}
            isEdit={isEdit}
          />
        )}
        {step === 4 && (
          <Step4
            form={form}
            onChange={(id) => updateForm("facilitatorId", id)}
            users={users}
            isLoading={usersLoading}
            circleMembers={selectedCircle?.members ?? []}
            currentUserId={user?.id ?? ""}
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
            isPending={isPending}
            error={submitError}
            users={users}
            location={location}
            onGoToStep={setStep}
            circle={selectedCircle}
            isEdit={isEdit}
          />
        )}
      </div>

      {step <= 5 && (
        <WizardNextButton
          label={
            step === 2 ? t("continueChallenge") :
            step === 5 ? t("reviewAndPublish") :
            t("next")
          }
          onClick={next}
        />
      )}
    </div>
  );
}
