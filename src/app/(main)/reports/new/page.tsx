"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useChallenge } from "@/hooks/useChallenge";
import { useSubmitReport } from "@/hooks/useSubmitReport";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function ReportForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challengeId") ?? "";


  const { data: challenge, isLoading } = useChallenge(challengeId);
  const submitReport = useSubmitReport();

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [verifierId, setVerifierId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const tier = challenge?.validation_tier?.level ?? 1;

  const maxStep = tier === 1 ? 1 : tier === 2 ? 2 : 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (step < maxStep) {
      setStep((s) => s + 1);
      return;
    }

    await submitReport.mutateAsync({
      challenge_id: challengeId,
      challenge_title: challenge?.title,
      description,
      quantity: Number(quantity),
      evidence_url: evidenceUrl || undefined,
      verifier_id: verifierId || undefined,
    });

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4 text-center">
        <h1 className="text-2xl font-semibold">{t("reports.new.success.title")}</h1>
        <p className="text-muted-foreground">{t("reports.new.success.description")}</p>
        <Link href="/circles" className={buttonVariants()}>
          {t("reports.new.success.viewCircle")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{t("reports.new.title")}</h1>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : challenge ? (
        <div className="p-3 rounded-md border space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {t("reports.new.challengeContext")}
          </p>
          <p className="font-medium">{challenge.title}</p>
          <div className="flex gap-1 flex-wrap">
            {challenge.category && (
              <Badge variant="secondary">{challenge.category.name}</Badge>
            )}
            {challenge.validation_tier && (
              <Badge variant="outline">
                L{challenge.validation_tier.level} {challenge.validation_tier.name}
              </Badge>
            )}
          </div>
        </div>
      ) : null}

      {submitReport.isError && (
        <p className="text-sm text-destructive">{t("reports.new.errorTitle")}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-medium">{t("reports.new.step1Title")}</h2>
            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium">
                {t("reports.new.descriptionLabel")}
              </label>
              <Textarea
                id="description"
                placeholder={t("reports.new.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="quantity" className="text-sm font-medium">
                {t("reports.new.quantityLabel")}
              </label>
              <Input
                id="quantity"
                type="number"
                min="0"
                placeholder={t("reports.new.quantityPlaceholder")}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {step === 2 && tier >= 2 && (
          <div className="space-y-4">
            <h2 className="font-medium">{t("reports.new.step2Title")}</h2>
            <div className="space-y-1">
              <label htmlFor="evidence" className="text-sm font-medium">
                {t("reports.new.evidenceLabel")}
              </label>
              <Input
                id="evidence"
                type="url"
                placeholder="https://..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && tier === 3 && (
          <div className="space-y-4">
            <h2 className="font-medium">{t("reports.new.step3Title")}</h2>
            <div className="space-y-1">
              <label htmlFor="verifier" className="text-sm font-medium">
                {t("reports.new.verifierLabel")}
              </label>
              <Input
                id="verifier"
                placeholder={t("reports.new.verifierPlaceholder")}
                value={verifierId}
                onChange={(e) => setVerifierId(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              {t("reports.new.back")}
            </Button>
          )}
          <Button type="submit" disabled={submitReport.isPending}>
            {submitReport.isPending
              ? t("reports.new.submitting")
              : step < maxStep
              ? t("reports.new.next")
              : t("reports.new.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ReportNewPage() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  );
}
