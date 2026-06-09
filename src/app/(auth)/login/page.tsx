"use client";

import { useLogin } from "@/lib/hooks/auth";
import { Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "mobile" | "email";

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending, error: apiError } = useLogin();

  const [mode, setMode] = useState<Mode>("email");
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const error =
    validationError ??
    (apiError instanceof Error ? apiError.message : null);

  const handleLogin = () => {
    if (!credential.trim() || !password.trim()) {
      setValidationError("Please enter your credentials and password.");
      return;
    }
    setValidationError(null);
    login(
      { emailOrMobile: credential.trim(), password },
      { onSuccess: () => router.push("/home") }
    );
  };

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
          <button
            onClick={() => router.push("/get-started")}
            aria-label="Close"
            className="text-white/60"
          >
            <X size={22} />
          </button>
        </div>

        {/* Wordmark */}
        <div className="px-10 mt-8">
          <div className="font-black leading-tight text-gotf-yellow uppercase">
            <p className="text-[40px]">
              Guardians
              <sup className="text-xl font-black tracking-normal">s</sup>
            </p>
            <p className="text-[22px] font-semibold tracking-[0.3em] -mt-1">
              of the
            </p>
            <p className="text-[40px]">Future</p>
          </div>
        </div>
      </div>

      {/* Bottom white card */}
      <div className="bg-white rounded-t-[20px] shadow-[0_-25px_50px_0_rgba(0,56,24,0.06)] px-10 pt-8 pb-10">
        {/* Credential field */}
        <div className="flex flex-col gap-2 mb-5">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {mode === "mobile" ? "Phone Number" : "Email Address"}
          </label>
          <input
            type={mode === "email" ? "email" : "tel"}
            value={credential}
            onChange={(e) => { setCredential(e.target.value); setValidationError(null); }}
            placeholder={
              mode === "mobile"
                ? "Enter your phone number"
                : "Enter your email address"
            }
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#9a9898] outline-none"
          />
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-2 mb-5">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setValidationError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter your password"
              className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#9a9898] outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={isPending}
          className="w-full h-14 bg-black text-white rounded-full text-base font-medium mb-4 disabled:opacity-50"
        >
          {isPending
            ? "Logging in…"
            : mode === "mobile"
              ? "Login with mobile"
              : "Login with email"}
        </button>

        {/* Toggle mode */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              setMode(mode === "mobile" ? "email" : "mobile");
              setCredential("");
              setValidationError(null);
            }}
            className="text-base text-[#3875e9]"
          >
            {mode === "mobile" ? "Continue with email" : "Continue with mobile"}
          </button>
        </div>

        {/* Sign Up link */}
        <div className="flex justify-center gap-2 mb-6">
          <span className="text-base text-black">
            Don&apos;t have an account?
          </span>
          <Link href="/signup" className="text-base text-[#3875e9]">
            Sign Up
          </Link>
        </div>

        <div className="border-t border-progress-track mb-4" />

        {/* ToS */}
        <p className="text-xs text-[#767676] leading-relaxed text-center">
          By clicking login, you agree to &ldquo;Guardians of the Future&rdquo;
          and acknowledge the{" "}
          <a
            href="https://theguardians.world/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3875e9] underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://theguardians.world/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3875e9] underline"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
