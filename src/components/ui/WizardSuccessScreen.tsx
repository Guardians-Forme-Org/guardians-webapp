"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  inviteLink?: string;
  onDone: () => void;
};

export default function WizardSuccessScreen({ title, subtitle, inviteLink, onDone }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!inviteLink) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url: inviteLink, title });
      } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(inviteLink).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-white overflow-hidden">
      <img
        src="/images/success-logo.png"
        alt=""
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-10">
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians"
          className="w-12 h-12 object-contain mb-4"
        />
        <h1 className="text-[32px] font-bold text-gotf-green mb-3">{title}</h1>
        {subtitle && (
          <p className="text-[18px] text-[#333] mb-8 max-w-[288px] leading-snug">{subtitle}</p>
        )}

        {inviteLink && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-5 w-full max-w-[322px] border border-[#ccc] rounded-[10px] px-10 py-5 text-left"
          >
            <Link2 size={20} className="text-text-primary shrink-0" />
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-base font-bold text-black">
                {copied ? "Copied!" : "Copy invitation link"}
              </span>
              <span className="text-base text-[#bfbfbf] truncate">{inviteLink}</span>
            </div>
          </button>
        )}
      </div>

      <div className="left-0 right-0 w-full px-5 z-10 mt-8">
        <button
          onClick={onDone}
          className="w-full h-14 bg-black text-white rounded-full text-[18px] font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}
