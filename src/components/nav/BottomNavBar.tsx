"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-50">
      <div className="flex items-center justify-around px-2 pb-safe">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-3 px-6 min-w-15"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? "text-text-primary" : "text-text-muted"}
              />
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
