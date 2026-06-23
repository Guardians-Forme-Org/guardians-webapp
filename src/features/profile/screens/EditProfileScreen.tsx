"use client";

import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateUser } from "@/lib/hooks/users";
import { ChevronLeft, Image as ImageIcon, User } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useRef, useState } from "react";

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
  const router = useRouter();
  const { user, loginData } = useAuth();
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
  const [avatarPreview, setAvatarPreview] = useState(resolvedAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleSave = () => {
    if (!user) return;
    updateUser.mutate(
      {
        userId: user.id,
        payload: {
          firstName,
          lastName,
          mobile,
          ...(!avatarFile ? { avatarUrl: avatarPreview } : {}),
        },
        avatarFile: avatarFile ?? undefined,
      },
      { onSuccess: () => router.back() },
    );
  };

  const error = updateUser.error instanceof Error ? updateUser.error.message : null;

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="size-10 flex items-center" aria-label="Back">
          <ChevronLeft size={22} className="text-text-muted" />
        </button>
        <Text variant="label" className="font-semibold text-base text-black">Edit Profile</Text>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-7.5 pb-10">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative"
            aria-label="Change photo"
          >
            <div className="w-24 h-24 rounded-full bg-surface border-2 border-border overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-text-muted" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 size-7 rounded-full bg-gotf-green flex items-center justify-center shadow-sm">
              <ImageIcon size={14} className="text-white" />
            </div>
          </button>
          <p className="text-sm text-text-muted">Tap to change photo</p>
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
          <Field label="First name" value={firstName} onChange={setFirstName} placeholder="Enter first name" />
          <Field label="Last name" value={lastName} onChange={setLastName} placeholder="Enter last name" />
          <Field label="Mobile" value={mobile} onChange={setMobile} type="tel" placeholder="Enter mobile number" />

          {/* Email — read-only */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium text-text-primary">
              Email{" "}
              <span className="text-[rgba(60,60,67,0.4)] font-normal text-sm">(cannot be changed)</span>
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
          {updateUser.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
