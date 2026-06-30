"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { X, Eye, EyeOff } from "lucide-react";
import { useResetPassword } from "@/lib/hooks/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const { mutate: resetPassword, isPending } = useResetPassword();

  const [token, setToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(searchParams.get("token"));
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setAccessToken(hash.get("access_token"));
  }, [searchParams]);

  const handleSubmit = () => {
    if (!newPassword || !confirmPassword) {
      setError(t("resetPasswordErrorMissing"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("resetPasswordErrorMismatch"));
      return;
    }
    if (!token) {
      setError(t("resetPasswordErrorInvalidLink"));
      return;
    }
    setError(null);
    resetPassword(
      { token, newPassword, accessToken: accessToken ?? undefined },
      {
        onSuccess: () => setDone(true),
        onError: (err) =>
          setError(err instanceof Error ? err.message : t("resetPasswordErrorInvalidLink")),
      },
    );
  };

  if (done) {
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
          <h1 className="text-[32px] font-bold text-black">{t("resetPasswordSuccessTitle")}</h1>
          <p className="text-xl font-medium text-[#808080] leading-snug">
            {t("resetPasswordSuccessBody")}
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
    <div className="flex flex-col min-h-dvh bg-white px-10 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain" />
        <button onClick={() => router.push("/login")} aria-label={tCommon("close")} className="text-text-muted">
          <X size={22} />
        </button>
      </div>

      <h1 className="text-[32px] font-bold text-black leading-tight mb-2">
        {t("resetPasswordTitle1")}<br />{t("resetPasswordTitle2")}
      </h1>

      {token === null && (
        <p className="text-sm text-red-600 mt-4">{t("resetPasswordErrorInvalidLink")}</p>
      )}

      {token !== null && (
        <div className="flex flex-col gap-5 mt-8">
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium text-text-primary tracking-[0.16px]">
              {t("resetPasswordLabel")}
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                placeholder={t("resetPasswordPlaceholder")}
                className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#9a9898] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base font-medium text-text-primary tracking-[0.16px]">
              {t("resetPasswordConfirmLabel")}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={t("resetPasswordConfirmPlaceholder")}
                className="w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#9a9898] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className="flex-1" />

      {token !== null && (
        <div className="pb-10">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full h-14 bg-black text-white rounded-full text-base font-medium disabled:opacity-50"
          >
            {isPending ? t("resetPasswordLoading") : t("resetPasswordButton")}
          </button>
        </div>
      )}
    </div>
  );
}
