"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);

  function next() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      router.push("/circles");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <p className="text-sm text-muted-foreground text-center">
          {t("auth.onboarding.progress", { current: step, total: TOTAL_STEPS })}
        </p>

        <div className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? "bg-foreground" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">
              {t("auth.onboarding.step1.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.onboarding.step1.description")}
            </p>
            <Button className="w-full" onClick={next}>
              {t("auth.onboarding.step1.cta")}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">
              {t("auth.onboarding.step2.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.onboarding.step2.description")}
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/circles" className={buttonVariants({ variant: "outline" })}>
                {t("auth.onboarding.step2.browseCircles")}
              </Link>
              <Link href="/circles/new" className={buttonVariants({ variant: "outline" })}>
                {t("auth.onboarding.step2.createCircle")}
              </Link>
              <Button onClick={next}>{t("auth.onboarding.continue")}</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">
              {t("auth.onboarding.step3.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.onboarding.step3.description")}
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/challenges" className={buttonVariants({ variant: "outline" })}>
                {t("auth.onboarding.step3.browseChallenges")}
              </Link>
              <Button onClick={next}>{t("auth.onboarding.finish")}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
