"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/circles", label: "Circles", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950 border-t border-zinc-800 z-50">
      <div className="flex items-center justify-around px-2 pb-safe">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-3 px-4 min-w-[60px]"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? "text-green-500" : "text-zinc-500"}
              />
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  active ? "text-green-500" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
