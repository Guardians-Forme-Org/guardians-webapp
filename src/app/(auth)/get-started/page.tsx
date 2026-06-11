"use client";

import Link from "next/link";
import { useState } from "react";

export default function GetStartedPage() {
  const [bgLoaded, setBgLoaded] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {/* Hero */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-[#013818]">
        <img
          src="/images/get-started.png"
          alt=""
          aria-hidden
          onLoad={() => setBgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${bgLoaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Bottom fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white via-[rgba(255,255,255,0.5)] to-transparent z-10" />

        {/* Guardians wordmark */}
        <img
          src="/images/Guardians Logo-full-white.png"
          alt="Guardians of the Future"
          className="relative z-10 w-4/5 object-contain"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4 px-5 pt-8 pb-16">
        <Link
          href="/signup"
          className="flex items-center justify-center w-[338px] h-14 bg-black text-white rounded-full text-lg font-medium"
        >
          Get Started
        </Link>

        <p className="text-base text-black">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3875e9]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
