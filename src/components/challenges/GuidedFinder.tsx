"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { GuidedFinderStep } from "./GuidedFinderStep";
import { scoreChallenge, matchLabel } from "@/lib/filterChallenges";
import { DOMAIN_CONFIG } from "@/lib/challengeDomains";
import type {
  ChallengeDomain,
  ChallengeTimeCommitment,
  ChallengeTeamSize,
  FinderAnswers,
  TaggedChallenge,
} from "@/types/challenges";

type Props = {
  open: boolean;
  onClose: () => void;
  challenges: TaggedChallenge[];
};

const INITIAL_ANSWERS: FinderAnswers = {
  domain: null,
  time: null,
  team: null,
};

const MATCH_LABEL_KEY = {
  "Strong match": "challenges.finder.strong_match",
  "Good match": "challenges.finder.good_match",
  Possible: "challenges.finder.possible",
} as const;

const MATCH_LABEL_CLASS = {
  "Strong match": "text-domain-mitigation bg-domain-mitigation-bg border-domain-mitigation-border",
  "Good match": "text-domain-resilience bg-domain-resilience-bg border-domain-resilience-border",
  Possible: "text-muted-foreground bg-muted border-border",
} as const;

export function GuidedFinder({ open, onClose, challenges }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<FinderAnswers>(INITIAL_ANSWERS);
  const [showResults, setShowResults] = useState(false);

  if (!open) return null;

  const domainOptions = Object.values(DOMAIN_CONFIG).map((d) => ({
    value: d.key as string,
    label: t(d.labelKey),
  }));

  const timeOptions: { value: ChallengeTimeCommitment; label: string }[] = [
    { value: "half_day", label: t("challenges.filters.half_day") },
    { value: "full_day", label: t("challenges.filters.full_day") },
    { value: "multi_day", label: t("challenges.filters.multi_day") },
    { value: "multi_week", label: t("challenges.filters.multi_week") },
    { value: "ongoing", label: t("challenges.filters.ongoing") },
  ];

  const teamOptions: { value: ChallengeTeamSize; label: string }[] = [
    { value: "individual", label: t("challenges.filters.individual") },
    { value: "small", label: t("challenges.filters.small") },
    { value: "circle", label: t("challenges.filters.circle") },
    { value: "large", label: t("challenges.filters.large") },
  ];

  const steps = [
    {
      question: t("challenges.finder.q1"),
      options: domainOptions,
      key: "domain" as const,
    },
    {
      question: t("challenges.finder.q2"),
      options: timeOptions,
      key: "time" as const,
    },
    {
      question: t("challenges.finder.q3"),
      options: teamOptions,
      key: "team" as const,
    },
  ];

  const scored = challenges
    .map((c) => ({ challenge: c, score: scoreChallenge(c, answers) }))
    .sort((a, b) => b.score - a.score);

  function handleClose() {
    setStep(0);
    setAnswers(INITIAL_ANSWERS);
    setShowResults(false);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-semibold text-sm">{t("challenges.finder.title")}</p>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {!showResults ? (
            <div className="space-y-8">
              {steps.map((s, i) => (
                <GuidedFinderStep
                  key={s.key}
                  question={s.question}
                  options={s.options}
                  selected={answers[s.key]}
                  onSelect={(val) =>
                    setAnswers((prev) => ({ ...prev, [s.key]: val }))
                  }
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {scored.map(({ challenge, score }) => {
                const label = matchLabel(score);
                return (
                  <div
                    key={challenge.id}
                    className="rounded-lg border border-border p-3 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">
                        {challenge.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${MATCH_LABEL_CLASS[label]}`}
                      >
                        {t(MATCH_LABEL_KEY[label])}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {challenge.description}
                    </p>
                    <Link
                      href={`/challenges/${challenge.id}`}
                      onClick={handleClose}
                      className="text-xs underline"
                    >
                      {t("challenges.card.view")}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-between">
          {showResults ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResults(false)}
            >
              {t("challenges.finder.back")}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowResults(true)}
              >
                {t("challenges.finder.see_results")}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
