"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Home, Compass, User } from "lucide-react";

type Props = {
  avatarUrl?: string;
  isAuthenticated?: boolean;
};

export default function BottomNavBar({ avatarUrl, isAuthenticated = true }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");

  const NAV_TABS = [
    { href: "/home", label: t("navHome"), icon: Home },
    { href: "/discover", label: t("navDiscover"), icon: Compass },
    { href: "/profile", label: t("navProfile"), icon: null },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-50">
      <div className="flex items-center justify-around px-2 pb-safe">
        {NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const isProfile = href === "/profile";

          if (isProfile && !isAuthenticated) {
            return (
              <button
                key={href}
                onClick={() => {
                  sessionStorage.setItem("guardians_return_to", "/profile");
                  router.push("/");
                }}
                className="flex flex-col items-center gap-1 py-3 px-6 min-w-15"
              >
                <User size={22} strokeWidth={1.8} className="text-text-muted" />
                <span className="text-[10px] font-medium text-text-muted">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-3 px-6 min-w-15"
            >
              {isProfile ? (
                avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={t("profileAlt")}
                    className={`w-[22px] h-[22px] rounded-full object-cover ${
                      active ? "ring-2 ring-gotf-yellow" : "ring-1 ring-border"
                    }`}
                  />
                ) : (
                  <User
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "text-text-primary" : "text-text-muted"}
                  />
                )
              ) : Icon ? (
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "text-text-primary" : "text-text-muted"}
                />
              ) : null}
              <span className={`text-[10px] font-medium ${active ? "text-text-primary" : "text-text-muted"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
