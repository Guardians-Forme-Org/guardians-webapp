"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNavBar from "@/components/nav/BottomNavBar";
import { getToken } from "@/lib/auth";

// Wizard flows — no bottom nav, no pb-safe-nav padding
const WIZARD_PATHS = [
  "/challenges/create",
  "/circles/create",
];

function isWizardPath(pathname: string) {
  if (WIZARD_PATHS.some((p) => pathname.startsWith(p))) return true;
  // Step log wizard: /challenges/[id]/steps/[stepId]/log
  if (/^\/challenges\/[^/]+\/steps\/[^/]+\/log/.test(pathname)) return true;
  return false;
}

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const wizard = isWizardPath(pathname);

  // Auth gate — redirect to login if no valid token
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  // While auth check runs, render nothing to avoid flash
  if (typeof window !== "undefined" && !getToken()) return null;

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
