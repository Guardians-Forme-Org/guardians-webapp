"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import BottomNavBar from "@/components/nav/BottomNavBar";
import { getToken, getStoredSession } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

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

// Public paths — readable without a session; auth prompt only on join actions
function isPublicPath(pathname: string): boolean {
  if (pathname === "/discover") return true;
  if (pathname === "/home") return true;
  if (pathname.startsWith("/circles/") && !pathname.startsWith("/circles/create")) return true;
  if (
    pathname.startsWith("/challenges/") &&
    !pathname.startsWith("/challenges/create") &&
    !pathname.includes("/log")
  ) return true;
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
  const isPublic = isPublicPath(pathname);
  const mainRef = useRef<HTMLElement>(null);
  const { user: authUser } = useAuth();
  const { user, loginData } = getStoredSession();
  const avatarUrl =
    user?.user_metadata?.avatarUrl ||
    loginData?.circles
      ?.flatMap((c) => c.members)
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    loginData?.challenges
      ?.flatMap((c) => c.members ?? [])
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    undefined;

  // Auth gate — save intended path then redirect to onboarding (skip for public routes)
  useEffect(() => {
    if (!getToken() && !isPublic) {
      sessionStorage.setItem("guardians_return_to", pathname);
      router.replace("/");
    }
  }, [router, pathname, isPublic]);

  // Reset scroll on every navigation — Next.js only resets window.scrollY,
  // not the scroll position of inner overflow-y-auto containers.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  // While auth check runs, render nothing to avoid flash (public routes skip this)
  if (typeof window !== "undefined" && !getToken() && !isPublic) return null;

  return (
    <div
      className={`relative flex flex-col min-h-full max-w-md mx-auto bg-white shadow-xl ${
        wizard ? "overflow-hidden" : ""
      }`}
    >
      <main ref={mainRef} className={`flex-1 overflow-y-auto ${wizard ? "" : "pb-safe-nav"}`}>
        {children}
      </main>
      {!wizard && <BottomNavBar avatarUrl={avatarUrl} isAuthenticated={!!authUser} />}
    </div>
  );
}
