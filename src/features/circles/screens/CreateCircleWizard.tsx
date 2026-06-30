"use client";

import LocationPicker, {
  type LocationResult,
} from "@/components/ui/LocationPicker";
import Avatar from "@/components/ui/Avatar";
import Text from "@/components/ui/Text";
import WizardSuccessScreen from "@/components/ui/WizardSuccessScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCircle, useUpdateCircle } from "@/lib/hooks/circles";
import { useUsers } from "@/lib/hooks/users";
import { compressImage } from "@/lib/compressImage";
import type { AuthUser } from "@/lib/types/auth";
import type { ApiCircle, CreateCircleResponse } from "@/lib/types/circles";
import {
  ChevronLeft,
  Globe,
  Image as ImageIcon,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ── Form state ─────────────────────────────────────────────────────────────────

type ChannelId = "whatsapp" | "facebook" | "email" | "channel";

const CHANNELS: {
  id: ChannelId;
  label: string;
  name: string;
  icon: typeof MessageCircle;
}[] = [
  { id: "whatsapp", label: "WhatsApp", name: "WhatsApp", icon: MessageCircle },
  { id: "facebook", label: "Facebook", name: "Facebook", icon: Globe },
  { id: "email", label: "Email", name: "Email", icon: Mail },
  { id: "channel", label: "Other", name: "Channel", icon: Link2 },
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
  channelType: "", // empty = user hasn't selected a channel yet
  channelUrl: "",
  region: "",
  imagePreview: "",
};

// ── Shared sub-components ──────────────────────────────────────────────────────

const PROGRESS_FILLED: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 0 };

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
            aria-label={tCommon("back")}
          >
            <ChevronLeft size={20} className="text-text-muted" />
          </button>
        )}
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
          {Array.from({ length: 5 }).map((_, i) => {
            const targetStep = i + 1;
            const isFilled = i < filled;
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
  const t = useTranslations("circles");
  const { data: users = [] } = useUsers();
  const [showDropdown, setShowDropdown] = useState(false);

  const query = form.leads.trim().toLowerCase();
  const filtered = query
    ? users.filter((u) => {
        const name =
          `${u.user_metadata.firstName} ${u.user_metadata.lastName}`.toLowerCase();
        return name.includes(query) || u.email.toLowerCase().includes(query);
      })
    : users;

  return (
    <>
      <WizardTitle
        title={t("aboutCircle")}
        description={t("aboutCircleDesc")}
      />

      <div className="flex flex-col gap-7 px-10">
        {/* Circle Name */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-base font-medium text-text-primary tracking-[0.16px]">
              {t("circleNameLabel")}
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
            placeholder={t("circleNamePlaceholder")}
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
          />
        </div>

        {/* Circle Lead(s) */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {t("circleLeadLabel")}{" "}
            <span className="text-[rgba(60,60,67,0.29)] font-normal">
              {t("optional")}
            </span>
          </label>

          {selectedLead ? (
            <div className="flex items-center gap-3 h-[60px] border border-[#d9d9d9] rounded-[8px] px-4">
              <Avatar
                src={selectedLead.user_metadata.avatarUrl}
                alt={`${selectedLead.user_metadata.firstName} ${selectedLead.user_metadata.lastName}`}
                className="size-8 rounded-full shrink-0"
              />
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
                placeholder={t("searchLeadPlaceholder")}
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
                      <Avatar
                        src={u.user_metadata.avatarUrl}
                        alt={`${u.user_metadata.firstName} ${u.user_metadata.lastName}`}
                        className="size-8 rounded-full shrink-0"
                      />
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
            {t("circleDescLabel")}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder={t("circleDescPlaceholder")}
            rows={4}
            className="border border-[#d9d9d9] rounded-[8px] px-4 py-5 text-base placeholder:text-[#bfbfbf] outline-none resize-none"
          />
        </div>

        {/* Communication Channel */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {t("communicationChannelLabel")}{" "}
            <span className="text-[rgba(60,60,67,0.29)] font-normal">
              {t("optional")}
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
                placeholder={t("channelLinkPlaceholder")}
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
  const t = useTranslations("circles");
  return (
    <>
      <WizardTitle title={t("whereLocated")} />

      <div className="flex flex-col gap-5 px-10">
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {t("regionLabel")}
          </label>
          <LocationPicker
            defaultValue={location?.formattedAddress}
            onSelect={onSelect}
            placeholder={t("locationSearchPlaceholder")}
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
                    {t("selectLocation")}
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
  onNext,
}: {
  form: CircleFormData;
  onChange: (f: keyof CircleFormData, v: string) => void;
  onFileSelect: (file: File) => void;
  onNext: () => void;
}) {
  const t = useTranslations("circles");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange("imagePreview", URL.createObjectURL(file));
    const compressed = await compressImage(file);
    onFileSelect(compressed);
  };

  const handleRemove = () => {
    onChange("imagePreview", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <WizardTitle
        title={t("uploadProfile")}
        description={t("uploadProfileDesc")}
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
              <Text variant="caption">{t("noImageSelected")}</Text>
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
          {t("uploadImage")}
        </button>

        {/* Remove */}
        <button
          onClick={handleRemove}
          className="w-full h-14 border border-[#ccc] rounded-full text-[18px] font-medium text-[#1e1e1e]"
        >
          {t("remove")}
        </button>

        <button
          onClick={onNext}
          className="w-full h-14 bg-black text-white rounded-full text-[18px] font-medium"
        >
          {t("review")}
        </button>
      </div>
    </>
  );
}

// ── Step 4 — Review ───────────────────────────────────────────────────────────

function ReviewSection({
  label,
  stepIndex,
  onEdit,
  children,
}: {
  label: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("circles");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
        <button
          onClick={() => onEdit(stepIndex)}
          className="flex items-center gap-1 text-xs font-medium text-text-muted active:opacity-60"
        >
          <Pencil size={13} />
          {t("edit")}
        </button>
      </div>
      {children}
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-medium text-text-primary">{label}</label>
      <div className="min-h-[44px] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 py-2.5 bg-[#f9f9f9]">
        <p className="text-base text-text-primary break-all">{value}</p>
      </div>
    </div>
  );
}

function Step4Review({
  form,
  location,
  selectedLead,
  onGoToStep,
  onConfirm,
  isPending,
  error,
  isEdit,
}: {
  form: CircleFormData;
  location: LocationResult | null;
  selectedLead: AuthUser | null;
  onGoToStep: (step: number) => void;
  onConfirm: () => void;
  isPending: boolean;
  error: string | null;
  isEdit?: boolean;
}) {
  const t = useTranslations("circles");
  const channelLabel = CHANNELS.find((c) => c.id === form.channelType)?.label;

  return (
    <>
      <div className="px-10 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-gotf-green leading-tight">{t("reviewTitle")}</h1>
        <p className="text-base text-text-muted mt-1">{t("checkDetails")}</p>
      </div>

      <div className="flex flex-col gap-6 px-10">
        <ReviewSection label={t("circleDetailsSection")} stepIndex={1} onEdit={onGoToStep}>
          {form.name && <ReadOnlyRow label={t("nameLabel")} value={form.name} />}
          {form.description && <ReadOnlyRow label={t("descriptionLabel")} value={form.description} />}
          {selectedLead && (
            <ReadOnlyRow
              label={t("circleLeadReview")}
              value={`${selectedLead.user_metadata.firstName ?? ""} ${selectedLead.user_metadata.lastName ?? ""}`.trim()}
            />
          )}
          {channelLabel && (
            <ReadOnlyRow
              label={t("channelLabel")}
              value={form.channelUrl ? `${channelLabel} — ${form.channelUrl}` : channelLabel}
            />
          )}
        </ReviewSection>

        {location && (
          <ReviewSection label={t("locationSection")} stepIndex={2} onEdit={onGoToStep}>
            <div className="flex items-start gap-2 min-h-[44px] border border-[rgba(26,26,24,0.14)] rounded-[8px] px-3 py-2.5 bg-[#f9f9f9]">
              <MapPin size={14} className="text-gotf-green shrink-0 mt-0.5" />
              <p className="text-base text-text-primary break-words">{location.formattedAddress}</p>
            </div>
          </ReviewSection>
        )}

        {form.imagePreview && (
          <ReviewSection label={t("profilePhotoSection")} stepIndex={3} onEdit={onGoToStep}>
            <img
              src={form.imagePreview}
              alt="Circle profile"
              className="w-full h-48 object-cover rounded-[12px] border border-[rgba(26,26,24,0.14)]"
            />
          </ReviewSection>
        )}
      </div>

      <div className="flex-1" />
      <div className="px-10 pb-8 pt-4 flex flex-col gap-3 shrink-0">
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="w-full h-14 bg-black text-white rounded-full text-[18px] font-medium disabled:opacity-50"
        >
          {isPending ? (isEdit ? t("saving") : t("creating")) : (isEdit ? t("saveChanges") : t("createCircle"))}
        </button>
      </div>
    </>
  );
}

// ── Step 5 — Done ─────────────────────────────────────────────────────────────

// ── Wizard shell ───────────────────────────────────────────────────────────────

const CIRCLE_DRAFT_KEY = "create-circle-draft";

function channelIdFromName(name: string): ChannelId {
  const lower = name.toLowerCase();
  if (lower.includes("whatsapp")) return "whatsapp";
  if (lower.includes("facebook")) return "facebook";
  if (lower.includes("email")) return "email";
  return "channel";
}

export default function CreateCircleWizard({
  editCircle,
}: {
  editCircle?: ApiCircle;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: allUsers = [] } = useUsers();
  const isEdit = !!editCircle;

  const ch0 = editCircle?.communicationChannels?.[0];

  const createCircle = useCreateCircle();
  const updateCircle = useUpdateCircle();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CircleFormData>(
    isEdit
      ? {
          name: editCircle.name,
          leads: "",
          description: editCircle.description,
          channelType: ch0 ? channelIdFromName(ch0.name) : "",
          channelUrl: ch0?.url ?? "",
          region: editCircle.region?.formattedAddress ?? "",
          imagePreview: editCircle.bannerUrl ?? "",
        }
      : initialForm,
  );
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [selectedLead, setSelectedLead] = useState<AuthUser | null>(() => {
    if (!editCircle?.circleLead) return null;
    const lead = editCircle.circleLead as {
      id?: string;
      userId?: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      avatarUrl?: string;
    };
    const nameParts = lead.name?.split(" ") ?? [];
    return {
      id: lead.userId ?? lead.id ?? "",
      email: "",
      aud: "",
      role: "",
      invited_at: "",
      confirmed_at: "",
      confirmation_sent_at: "",
      app_metadata: {},
      user_metadata: {
        firstName: lead.firstName ?? nameParts[0] ?? "",
        lastName: lead.lastName ?? nameParts.slice(1).join(" ") ?? "",
        avatarUrl: lead.avatarUrl ?? "",
        email: "",
        email_verified: false,
        id: lead.userId ?? lead.id ?? "",
        location: {} as never,
        mobile: "",
        phone_verified: false,
        preferredLanguage: { code: "", id: "", name: "" },
        sub: "",
        username: "",
      },
      created_at: "",
      updated_at: "",
    };
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [createdCircle, setCreatedCircle] = useState<CreateCircleResponse | null>(null);

  // Resolve lead name from users list once loaded (edit mode)
  useEffect(() => {
    if (!isEdit || !editCircle?.circleLead || !allUsers.length) return;
    const lead = editCircle.circleLead as { id?: string; userId?: string } | null;
    const leadId = lead?.userId ?? lead?.id;
    if (!leadId) return;
    const found = allUsers.find((u) => u.id === leadId);
    if (found) setSelectedLead(found);
  }, [allUsers, isEdit, editCircle]);

  // Load draft from localStorage (create mode only)
  useEffect(() => {
    if (isEdit) return;
    const saved = localStorage.getItem(CIRCLE_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm((f) => ({ ...f, ...parsed.form, imagePreview: "", leads: "" }));
        if (parsed.location) setLocation(parsed.location);
        if (parsed.step) setStep(parsed.step);
        if (parsed.selectedLead) setSelectedLead(parsed.selectedLead);
      } catch { /* ignore corrupt draft */ }
    }
  }, [isEdit]);

  // Persist draft to localStorage (create mode only)
  useEffect(() => {
    if (isEdit) return;
    const { imagePreview: _img, ...serializableForm } = form;
    localStorage.setItem(CIRCLE_DRAFT_KEY, JSON.stringify({ form: { ...serializableForm, leads: "" }, location, step, selectedLead }));
  }, [form, location, step, selectedLead, isEdit]);

  const next = () => {
    // In edit mode skip step 2 (location)
    if (isEdit && step === 1) { setStep(3); return; }
    if (isEdit && step === 3) { setStep(4); return; }
    setStep((s) => Math.min(s + 1, 5));
  };

  const back = () => {
    if (step <= 1) { router.back(); return; }
    // In edit mode skip step 2 going backwards
    if (isEdit && step === 3) { setStep(1); return; }
    setStep((s) => s - 1);
  };

  const close = () => {
    if (!isEdit) localStorage.removeItem(CIRCLE_DRAFT_KEY);
    router.back();
  };

  const updateForm = (field: keyof CircleFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const buildChannels = () => {
    const selectedChannel = CHANNELS.find((c) => c.id === form.channelType);
    return selectedChannel && form.channelUrl
      ? [{ name: selectedChannel.name, url: form.channelUrl, icon: selectedChannel.name }]
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

  const handleSubmit = async () => {
    if (!user) return;

    if (isEdit) {
      updateCircle.mutate(
        {
          circleId: editCircle!.circleId,
          payload: {
            name: form.name,
            description: form.description,
            communicationChannels: buildChannels(),
            ...(selectedLead ? { circleLeadId: selectedLead.id } : {}),
            ...(bannerFile ? {} : { bannerUrl: form.imagePreview }),
          },
          bannerFile: bannerFile ?? undefined,
        },
        { onSuccess: () => router.push(`/circles/${editCircle!.circleId}`) },
      );
    } else {
      const resolvedBanner = await resolveBanner();
      createCircle.mutate(
        {
          metadata: {
            name: form.name,
            description: form.description,
            createdBy: user.id,
            creatorAvatarUrl: user.user_metadata.avatarUrl,
            communicationChannels: buildChannels(),
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
          bannerFile: resolvedBanner,
        },
        { onSuccess: (response) => { localStorage.removeItem(CIRCLE_DRAFT_KEY); setCreatedCircle(response); next(); } },
      );
    }
  };

  const isPending = isEdit ? updateCircle.isPending : createCircle.isPending;
  const apiError = isEdit ? updateCircle.error : createCircle.error;
  const submitError = apiError instanceof Error ? apiError.message : null;

  const t = useTranslations("circles");

  if (!isEdit && step === 5 && createdCircle) {
    return (
      <WizardSuccessScreen
        title={createdCircle.name}
        subtitle={t("inviteSubtitle")}
        inviteLink={`${window.location.origin}/circles/${createdCircle.circleId}`}
        onDone={close}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <WizardHeader step={step} onBack={back} onClose={close} onGoToStep={isEdit ? undefined : setStep} />

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
            onNext={next}
          />
        )}
        {step === 4 && (
          <Step4Review
            form={form}
            location={location}
            selectedLead={selectedLead}
            onGoToStep={setStep}
            onConfirm={handleSubmit}
            isPending={isPending}
            error={submitError}
            isEdit={isEdit}
          />
        )}
      </div>

      {step < 3 && <WizardNextButton label={t("next")} onClick={next} />}
    </div>
  );
}
