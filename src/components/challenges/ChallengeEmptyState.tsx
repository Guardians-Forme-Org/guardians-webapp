"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type Props = {
  onClear: () => void;
};

export function ChallengeEmptyState({ onClear }: Props) {
  const { t } = useTranslation();
  return (
    <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm text-muted-foreground">{t("challenges.library.empty")}</p>
      <Button variant="outline" size="sm" onClick={onClear}>
        {t("challenges.library.empty_cta")}
      </Button>
    </div>
  );
}
