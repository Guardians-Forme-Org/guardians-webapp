"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="flex items-center gap-4">
          <img
            src="/images/Guardians Logo-logo.png"
            alt=""
            className="w-[70px] h-[70px] object-contain"
          />
          <div className="font-black leading-tight tracking-wide text-black uppercase">
            <p className="text-[28px]">
              Guardians
            </p>
            <p className="text-[14px] font-semibold tracking-[0.25em] -mt-1">of the</p>
            <p className="text-[28px]">Future</p>
          </div>
        </div>
      )}
    </div>
  );
}
