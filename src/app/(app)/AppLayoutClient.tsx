"use client";

import { usePathname } from "next/navigation";
import BottomNavBar from "@/components/nav/BottomNavBar";

// These routes are wizard flows — they get the auth-style layout:
// no bottom nav, no pb-safe-nav padding, overflow-hidden container.
const WIZARD_PATHS = [
  "/challenges/create",
  "/circles/create",
  "/challenges/",   // step log wizard
];

function isWizardPath(pathname: string) {
  return (
    WIZARD_PATHS.some((p) => pathname.startsWith(p)) &&
    // But the challenge list / circle list themselves should keep the nav
    pathname !== "/challenges" &&
    pathname !== "/circles"
  );
}

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const wizard = isWizardPath(pathname);

  return (
    <div
      className={`relative flex flex-col min-h-full max-w-md mx-auto bg-white shadow-xl ${
        wizard ? "overflow-hidden" : ""
      }`}
    >
      <main className={`flex-1 overflow-y-auto ${wizard ? "" : "pb-safe-nav"}`}>
        {children}
      </main>
      {!wizard && <BottomNavBar />}
    </div>
  );
}
