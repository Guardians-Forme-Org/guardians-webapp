"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useForgotPassword } from "@/lib/hooks/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!email.trim()) {
      setError(t("forgotPasswordErrorEmail"));
      return;
    }
    setError(null);
    forgotPassword(
      { email: email.trim() },
      {
        onSuccess: () => setSent(true),
        onError: (err) =>
          setError(err instanceof Error ? err.message : t("forgotPasswordErrorGeneric")),
      },
    );
  };

  if (sent) {
    return (
      <div className="relative min-h-dvh bg-white flex flex-col items-center justify-center overflow-hidden">
        <img
          src="/images/success-logo.png"
          alt=""
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-10">
          <img src="/images/Guardians Logo-logo.png" alt="" className="w-12 h-12 object-contain mb-2" />
          <h1 className="text-[32px] font-bold text-black">{t("forgotPasswordSentTitle")}</h1>
          <p className="text-xl font-medium text-[#808080] leading-snug">
            {t("forgotPasswordSentSubtitle")}
          </p>
          <p className="text-base font-semibold text-black">{email}</p>
          <p className="text-base text-[#808080] leading-snug mt-1">
            {t("forgotPasswordSentInstruction")}
          </p>
        </div>

        <div className="absolute bottom-10 left-0 right-0 px-5">
          <button
            onClick={() => router.push("/login")}
            className="w-full h-14 bg-black text-white rounded-full text-base font-medium"
          >
            {t("forgotPasswordBackToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#013818]">
      {/* Hero */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <img
          src="/images/get-started.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <div className="relative z-10 flex items-center justify-between px-10 pt-10">
          <img
            src="/images/Guardians Logo-logo.png"
            alt=""
            className="w-8 h-8 object-contain"
            style={{ filter: "brightness(0) invert(1) opacity(0.8)" }}
          />
          <button
            onClick={() => router.push("/login")}
            aria-label={tCommon("close")}
            className="text-white/60"
          >
            <X size={22} />
          </button>
        </div>

        <div className="relative z-10 px-10 mt-8">
          <img
            src="/images/Guardians Logo-word-white.png"
            alt="Guardians of the Future"
            className="w-[99%] object-contain"
          />
        </div>
      </div>

      {/* White card */}
      <div className="bg-white rounded-t-[20px] shadow-[0_-25px_50px_0_rgba(0,56,24,0.06)] px-10 pt-8 pb-10">
        <h2 className="text-[26px] font-bold text-black mb-2">
          {t("forgotPasswordTitle1")}<br />{t("forgotPasswordTitle2")}
        </h2>
        <p className="text-base text-[#808080] mb-6 leading-relaxed">
          {t("forgotPasswordBody")}
        </p>

        <div className="flex flex-col gap-2 mb-5">
          <label className="text-base font-medium text-text-primary tracking-[0.16px]">
            {t("emailLabel")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={t("emailPlaceholder")}
            className="h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#9a9898] outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full h-14 bg-black text-white rounded-full text-base font-medium mb-4 disabled:opacity-50"
        >
          {isPending ? t("forgotPasswordSending") : t("forgotPasswordButton")}
        </button>

        <div className="flex justify-center">
          <button
            onClick={() => router.push("/login")}
            className="text-base text-[#3875e9]"
          >
            {t("forgotPasswordBackToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
