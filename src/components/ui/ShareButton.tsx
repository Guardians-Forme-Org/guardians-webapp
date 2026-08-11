"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  className?: string;
};

export default function ShareButton({ className }: Props) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("common");

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label={copied ? t("linkCopied") : t("shareLink")}
      className={
        className ??
        "size-10 rounded-full bg-white border border-border flex items-center justify-center z-20"
      }
    >
      <Share2 size={16} className="text-text-primary" />
    </button>
  );
}
