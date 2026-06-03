"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import ChallengeHero from "../components/ChallengeHero";
import ActivityRow from "../components/ActivityRow";
import { getChallengeById, type Challenge, type Step } from "../data";
import Text from "@/components/ui/Text";

// ── Sub-components ─────────────────────────────────────────────────────────────

function CircleBadge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
      {label}
    </span>
  );
}

function JoinChallengeButton() {
  return (
    <button className="px-5 h-10 bg-linear-to-r from-[#008000] to-[#129612] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
      Join Challenge
    </button>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="subheading" className="font-semibold text-[20px]">Progress</Text>
      <div className="flex items-center gap-5">
        <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full overflow-hidden">
          <div className="h-full bg-gotf-yellow rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xl text-text-primary font-normal shrink-0">{progress}%</p>
      </div>
    </div>
  );
}

function StepRow({ step, challengeId }: { step: Step; challengeId: string }) {
  return (
    <Link href={`/challenges/${challengeId}/steps/${step.id}`}>
      <div className="flex gap-3.75 items-center border border-[#eee] rounded-[10px] px-4 py-2.5 mx-6">
        <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
          {step.rank}
        </span>
        <div
          className={`size-15 rounded-lg overflow-hidden shrink-0 ${
            step.locked ? "bg-[#ccc] opacity-50" : "bg-surface"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-text-primary leading-tight">{step.title}</p>
          <p className="text-xs text-text-primary truncate mt-0.5">{step.description}</p>
          <p className="text-xs text-text-secondary">{step.phase}</p>
        </div>
        <ChevronRight size={24} className="text-text-muted shrink-0" />
      </div>
    </Link>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

function HomeTab({ challenge }: { challenge: Challenge }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Location */}
      <div className="px-10 py-5">
        <div className="flex items-center gap-1.5">
          <MapPin size={16} className="text-gotf-green shrink-0" />
          <p className="text-base text-[#666]">
            <span className="font-semibold text-text-primary">{challenge.location.city}</span>
            {", "}{challenge.location.region}
          </p>
        </div>
        <p className="text-base text-[#666] mt-1 ml-5.5">{challenge.distance}</p>
      </div>

      <div className="border-t border-progress-track" />

      {/* Description */}
      <div className="px-10 py-5">
        <p className={`text-base text-[#666] leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
          {challenge.description}
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-base text-gotf-blue mt-2"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>

      <div className="border-t border-progress-track" />

      {/* Progress */}
      <div className="px-10 py-7.5 flex flex-col gap-7.5">
        <ProgressBar progress={challenge.progress} />
        <div className="flex items-stretch">
          <div className="flex flex-col gap-2.5">
            <Text variant="caption" className="text-text-muted">Target date</Text>
            <p className="text-base font-semibold text-text-subheading">{challenge.targetDate}</p>
          </div>
          <div className="mx-7.5 border-r border-progress-track" />
          <div className="flex flex-col gap-2.5">
            <Text variant="caption" className="text-text-muted">Time left</Text>
            <p className="text-base font-semibold text-text-subheading">{challenge.timeLeft}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-progress-track" />

      {/* Facilitator */}
      <div className="flex items-center gap-5 px-7.5 py-5">
        <div className="size-10 rounded-full bg-surface border border-border shrink-0" />
        <div>
          <p className="text-xl font-semibold text-text-primary">{challenge.facilitator.name}</p>
          <p className="text-base font-medium text-text-secondary">{challenge.facilitator.role}</p>
        </div>
      </div>

      <div className="border-t border-progress-track" />

      {/* Members */}
      <div className="py-7.5">
        <div className="flex items-center justify-between px-7.5 mb-5">
          <p className="text-xl font-bold text-text-subheading">
            <span className="font-normal">by</span>{" "}
            {challenge.circle}
          </p>
          <Link href="#" className="text-base text-gotf-blue">See all</Link>
        </div>

        <div className="flex justify-between px-7.5 mb-6">
          {challenge.members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-2">
              <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white" />
              <Text variant="caption" className="text-text-subheading">{member.name}</Text>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button className="px-5 h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
            Join Conversation
          </button>
        </div>
      </div>

      <div className="border-t border-progress-track" />

      {/* Impact stats */}
      {[[0, 1], [2, 3], [4, 5]].map(([a, b]) => (
        <div key={a} className="flex">
          {[challenge.impactStats[a], challenge.impactStats[b]].map((stat) => (
            <div key={stat.label} className="flex-1 flex flex-col gap-2 px-10 pt-6 pb-7.5 border-b border-progress-track">
              <Text variant="caption" className="text-text-muted">{stat.label}</Text>
              <p className="text-2xl font-semibold text-text-subheading">{stat.value}</p>
            </div>
          ))}
        </div>
      ))}

      {/* Steps */}
      <div className="py-6">
        <p className="text-xl font-semibold text-text-subheading px-10 mb-4">Steps</p>
        <div className="flex flex-col gap-2.5">
          {challenge.steps.map((step) => (
            <StepRow key={step.id} step={step} challengeId={challenge.id} />
          ))}
        </div>
      </div>
    </>
  );
}

function ActivitiesTab({ challenge }: { challenge: Challenge }) {
  return (
    <div className="flex flex-col divide-y divide-progress-track px-10">
      {challenge.activities.map((activity) => (
        <div key={activity.id} className="py-5">
          <ActivityRow
            title={activity.title}
            date={activity.date}
            avatarCount={activity.avatarCount}
          />
        </div>
      ))}
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

type Props = { challengeId: string };

export default function ChallengeScreen({ challengeId }: Props) {
  const [tab, setTab] = useState<"home" | "activities">("home");
  const challenge = getChallengeById(challengeId);

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Challenge not found.</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-full">
      <ChallengeHero />

      {/* White card slides up over hero */}
      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">

        {/* Identity */}
        <div className="px-10 pt-7.5 pb-0">
          <CircleBadge label={challenge.circle} />
          <h1 className="text-[28px] font-bold text-text-subheading mt-3 leading-tight">
            {challenge.title}
          </h1>
          <p className="text-base text-[#666] mt-1">Since {challenge.since}</p>
          <div className="mt-3">
            <JoinChallengeButton />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex px-10 mt-5">
          {(["home", "activities"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 h-10 flex items-center text-base capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-[#303030] text-[#303030] font-medium"
                  : "text-text-muted"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="border-t border-progress-track" />

        {/* Tab content */}
        {tab === "home" ? (
          <HomeTab challenge={challenge} />
        ) : (
          <ActivitiesTab challenge={challenge} />
        )}
      </div>
    </div>
  );
}
