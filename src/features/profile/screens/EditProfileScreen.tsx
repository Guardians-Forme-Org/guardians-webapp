"use client";

import Text from "@/components/ui/Text";
import LocationPicker, { type LocationResult } from "@/components/ui/LocationPicker";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateUser } from "@/lib/hooks/users";
import { compressImage } from "@/lib/compressImage";
import { ChevronLeft, Image as ImageIcon } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-base font-medium text-text-primary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[56px] border border-[#d9d9d9] rounded-[10px] px-4 text-base placeholder:text-[#bfbfbf] outline-none focus:border-gotf-green transition-colors"
      />
    </div>
  );
}

export default function EditProfileScreen() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user, loginData, patchUserMetadata } = useAuth();
  const updateUser = useUpdateUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = user?.user_metadata;

  const resolvedAvatarUrl =
    meta?.avatarUrl ||
    loginData?.circles
      .flatMap((c) => c.members)
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    loginData?.challenges
      .flatMap((c) => c.members ?? [])
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    "";

  const [firstName, setFirstName] = useState(meta?.firstName ?? "");
  const [lastName, setLastName] = useState(meta?.lastName ?? "");
  const [mobile, setMobile] = useState(meta?.mobile ?? "");
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(resolvedAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cachedAvatarFile, setCachedAvatarFile] = useState<File | null>(null);

  // Pre-fetch and compress the current avatar so the backend always receives a file on save
  useEffect(() => {
    if (!resolvedAvatarUrl || resolvedAvatarUrl.startsWith("blob:")) return;
    fetch(resolvedAvatarUrl)
      .then((r) => r.blob())
      .then((blob) => compressImage(new File([blob], "avatar", { type: blob.type || "image/jpeg" })))
      .then(setCachedAvatarFile)
      .catch(() => {});
  }, []);

  const currentLocationLabel =
    (meta?.location as { formattedAddress?: string; address?: string } | undefined)
      ?.formattedAddress ||
    (meta?.location as { address?: string } | undefined)?.address ||
    "";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    setAvatarFile(compressed);
  };

  const handleSave = async () => {
    if (!user) return;

    let fileToSend = avatarFile ?? cachedAvatarFile;
    if (!fileToSend) {
      const res = await fetch("/images/Guardians Logo-logo.png");
      const blob = await res.blob();
      fileToSend = new File([blob], "avatar.png", { type: "image/png" });
    }

    updateUser.mutate(
      {
        payload: { firstName, lastName, mobile, ...(location ? { location } : {}) },
        avatarFile: fileToSend,
      },
      {
        onSuccess: () => {
          patchUserMetadata({ firstName, lastName, mobile, avatarUrl: avatarPreview, ...(location ? { location } : {}) });
          router.back();
        },
      },
    );
  };

  const error = updateUser.error instanceof Error ? updateUser.error.message : null;

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="size-10 flex items-center" aria-label={t("editProfile")}>
          <ChevronLeft size={22} className="text-text-muted" />
        </button>
        <Text variant="label" className="font-semibold text-base text-black">{t("editProfile")}</Text>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-7.5 pb-10">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative"
            aria-label={t("tapToChangePhoto")}
          >
            <Avatar src={avatarPreview} className="w-24 h-24 rounded-full border-2 border-border" />
            <div className="absolute bottom-0 right-0 size-7 rounded-full bg-gotf-green flex items-center justify-center shadow-sm">
              <ImageIcon size={14} className="text-white" />
            </div>
          </button>
          <p className="text-sm text-text-muted">{t("tapToChangePhoto")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5">
          <Field label={t("firstNameLabel")} value={firstName} onChange={setFirstName} placeholder={t("firstNamePlaceholder")} />
          <Field label={t("lastNameLabel")} value={lastName} onChange={setLastName} placeholder={t("lastNamePlaceholder")} />
          <Field label={t("mobileLabel")} value={mobile} onChange={setMobile} type="tel" placeholder={t("mobilePlaceholder")} />

          {/* Location */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium text-text-primary">{tCommon("locationTitle")}</label>
            <LocationPicker
              defaultValue={currentLocationLabel}
              onSelect={setLocation}
              className="w-full h-[56px] border border-[#d9d9d9] rounded-[10px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none focus:border-gotf-green transition-colors"
            />
          </div>

          {/* Email — read-only */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium text-text-primary">
              {t("emailLabel")}{" "}
              <span className="text-[rgba(60,60,67,0.4)] font-normal text-sm">{t("emailCannotChange")}</span>
            </label>
            <div className="h-[56px] border border-[#e8e8e8] rounded-[10px] px-4 flex items-center bg-[#f9f9f9]">
              <p className="text-base text-text-muted">{user?.email ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="px-7.5 pb-10 pt-4 shrink-0">
        {error && <p className="text-sm text-red-600 text-center mb-3">{error}</p>}
        <button
          onClick={handleSave}
          disabled={updateUser.isPending}
          className="w-full h-14 bg-black text-white rounded-full text-[18px] font-medium disabled:opacity-50"
        >
          {updateUser.isPending ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}
