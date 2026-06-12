"use client";

import { useTranslations } from "next-intl";

type Props = {
  name: string;
  avatarUrl?: string;
  hasNotification?: boolean;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function HomeHeader({
  name,
  avatarUrl,
  hasNotification = false,
}: Props) {
  const t = useTranslations("home");
  const initials = getInitials(name);

  return (
    <div className="flex items-center justify-between px-5 pt-14 pb-4">
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 shrink-0">
          <img
            src="/images/Guardians Logo-logo.png"
            alt="Guardians logo"
            className="w-full h-full object-contain"
          />
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full object-cover"
            />
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full flex items-center justify-center">
              <span
                className="text-white font-bold leading-none"
                style={{ fontSize: 8 }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>
        <span className="text-2xl text-text-primary">
          {t("greeting")} <span className="font-bold">{name}</span>
        </span>
      </div>
      <button className="relative p-1" aria-label="Notifications">
        {/* <Bell size={22} strokeWidth={1.8} className="text-text-primary" />
        {hasNotification && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
        )} */}
      </button>
    </div>
  );
}
