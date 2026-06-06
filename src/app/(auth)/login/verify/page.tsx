"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import OTPInput from "@/components/ui/OTPInput";

export default function LoginVerifyPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col bg-white px-10 pt-8">
      {/* Logo + Close */}
      <div className="flex items-center justify-between mb-10">
        <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain" />
        <button onClick={() => router.push("/login")} aria-label="Close" className="text-text-muted">
          <X size={22} />
        </button>
      </div>

      {/* Title */}
      <h1 className="text-[32px] font-bold text-black leading-tight mb-6">
        What is your<br />One Time Pin?
      </h1>

      {/* Description */}
      <p className="text-[18px] text-black mb-10 leading-relaxed">
        Enter the 6-digit code we sent to xxx-xxx-<strong>5422</strong>
      </p>

      {/* OTP */}
      <OTPInput />

      {/* Resend */}
      <button className="text-gotf-blue text-base mt-5 text-center w-full">
        Resend the code
      </button>

      <div className="flex-1" />

      {/* Confirm */}
      <div className="pb-10">
        <button
          onClick={() => router.push("/home")}
          className="w-full h-14 bg-black text-white rounded-full text-base font-medium"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
