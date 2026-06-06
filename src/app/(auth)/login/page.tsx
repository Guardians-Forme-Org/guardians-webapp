"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  return (
    <div className="min-h-dvh flex flex-col bg-gotf-green">
      {/* Top — dark green section */}
      <div className="relative flex-1 flex flex-col">
        {/* Logo + Close */}
        <div className="flex items-center justify-between px-10 pt-10">
          <img
            src="/images/Guardians Logo-logo.png"
            alt=""
            className="w-8 h-8 object-contain"
            style={{ filter: "brightness(0) invert(1) opacity(0.8)" }}
          />
          <button onClick={() => router.push("/get-started")} aria-label="Close" className="text-white/60">
            <X size={22} />
          </button>
        </div>

        {/* Wordmark */}
        <div className="px-10 mt-8">
          <div className="font-black leading-tight text-gotf-yellow uppercase">
            <p className="text-[40px]">
              Guardians<sup className="text-xl font-black tracking-normal">s</sup>
            </p>
            <p className="text-[22px] font-semibold tracking-[0.3em] -mt-1">of the</p>
            <p className="text-[40px]">Future</p>
          </div>
        </div>
      </div>

      {/* Bottom white card */}
      <div className="bg-white rounded-t-[20px] shadow-[0_-25px_50px_0_rgba(0,56,24,0.06)] px-10 pt-8 pb-10">
        {/* Phone field */}
        <div className="flex flex-col gap-2 mb-5">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#9a9898] outline-none"
          />
        </div>

        {/* Login button */}
        <button
          onClick={() => router.push("/login/verify")}
          className="w-full h-14 bg-black text-white rounded-full text-base font-medium mb-4"
        >
          Login with mobile
        </button>

        {/* Continue with email */}
        <div className="flex justify-center mb-4">
          <button className="text-base text-[#3875e9]">Continue with email</button>
        </div>

        {/* Sign Up link */}
        <div className="flex justify-center gap-2 mb-6">
          <span className="text-base text-black">Don&apos;t have an account?</span>
          <Link href="/signup" className="text-base text-[#3875e9]">Sign Up</Link>
        </div>

        <div className="border-t border-progress-track mb-4" />

        {/* ToS */}
        <p className="text-xs text-[#767676] leading-relaxed text-center">
          By clicking login, you agree to &ldquo;Guardians of the Future&rdquo; you acknowledge and agree to the{" "}
          <a href="https://theguardians.world/" target="_blank" rel="noopener noreferrer" className="text-[#3875e9] underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="https://theguardians.world/" target="_blank" rel="noopener noreferrer" className="text-[#3875e9] underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
