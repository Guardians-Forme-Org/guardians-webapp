"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import LogoSpinner from "@/components/ui/LogoSpinner";

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<1 | 2>(1);

  useEffect(() => {
    localStorage.setItem("gotf_splash_seen", "1");
    const t1 = setTimeout(() => setPhase(2), 1800);
    const t2 = setTimeout(() => router.push("/onboarding"), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  return (
    <div
      className={`min-h-dvh flex items-center justify-center transition-colors duration-700 ${
        phase === 1 ? "bg-black" : "bg-white"
      }`}
    >
      {phase === 1 ? (
        /* Splash 1 — black + circular logo */
        <LogoSpinner inverted />
      ) : (
        /* Splash 2 — white + wordmark */
        <div>
          <img
            src="/images/Guardians Logo-full.png"
            alt="Guardians of the Future"
            className="w-56 object-contain"
          />
        </div>
      )}
    </div>
  );
}
