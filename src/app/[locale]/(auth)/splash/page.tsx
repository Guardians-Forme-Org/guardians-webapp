"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<1 | 2>(1);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 1800);
    const t2 = setTimeout(() => router.push("/onboarding"), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [router]);

  return (
    <div
      className={`min-h-dvh flex items-center justify-center transition-colors duration-700 ${
        phase === 1 ? "bg-black" : "bg-white"
      }`}
    >
      {phase === 1 ? (
        /* Splash 1 — black + circular logo */
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians"
          className="w-[193px] object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
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
