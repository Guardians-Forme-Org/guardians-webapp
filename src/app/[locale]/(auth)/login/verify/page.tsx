"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import OTPInput from "@/components/ui/OTPInput";

export default function LoginVerifyPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-dvh flex flex-col bg-white px-10 pt-8">
      {/* Logo + Close */}
      <div className="flex items-center justify-between mb-10">
        <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain" />
        <button onClick={() => router.push("/login")} aria-label={tCommon("close")} className="text-text-muted">
          <X size={22} />
        </button>
      </div>

      {/* Title */}
      <h1 className="text-[32px] font-bold text-black leading-tight mb-6">
        {t("verifyHeading1")}<br />{t("verifyHeading2")}
      </h1>

      {/* Description */}
      <p className="text-[18px] text-black mb-10 leading-relaxed">
        {t.rich("verifyDescription", {
          suffix: "5422",
          strong: (chunks) => <strong key="s">{chunks}</strong>,
        })}
      </p>

      {/* OTP */}
      <OTPInput />

      {/* Resend */}
      <button className="text-gotf-blue text-base mt-5 text-center w-full">
        {t("resendCode")}
      </button>

      <div className="flex-1" />

      {/* Confirm */}
      <div className="pb-10">
        <button
          onClick={() => {
            const returnTo = sessionStorage.getItem("guardians_return_to");
            sessionStorage.removeItem("guardians_return_to");
            router.push(returnTo ?? "/home");
          }}
          className="w-full h-14 bg-black text-white rounded-full text-base font-medium"
        >
          {t("confirm")}
        </button>
      </div>
    </div>
  );
}
