"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import ChallengeHero from "../components/ChallengeHero";
import ActivityRow from "../components/ActivityRow";
import { getChallengeById, getStepById } from "../data";
import Text from "@/components/ui/Text";

type Props = { challengeId: string; stepId: string };

export default function StepScreen({ challengeId, stepId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const challenge = getChallengeById(challengeId);
  const step = getStepById(challengeId, stepId);

  if (!challenge || !step) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Step not found.</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* Hero with play button */}
      <ChallengeHero heightClass="h-70" showPlayButton />

      {/* White card */}
      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">

        {/* Identity */}
        <div className="px-10 pt-7.5 pb-0">
          <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
            {challenge.circle}
          </span>
          <h1 className="text-[28px] font-bold text-text-subheading mt-3 leading-tight">
            {step.title}
          </h1>
          <p className="text-base text-[#666] mt-1">Since {challenge.since}</p>
          <div className="mt-3 flex items-center gap-3">
            <button className="px-5 h-10 bg-linear-to-r from-[#008000] to-[#129612] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
              Join Challenge
            </button>
            <Link
              href={`/challenges/${challengeId}/steps/${stepId}/log`}
              className="flex items-center gap-1.5 px-4 h-10 bg-gotf-green text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
            >
              <ClipboardList size={16} />
              Log Evidence
            </Link>
          </div>
        </div>

        {/* Progress + Join Conversation */}
        <div className="px-10 py-7.5 border-t border-progress-track mt-5 flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="text-xl font-semibold text-text-subheading">Progress</p>
            <div className="flex items-center gap-5">
              <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gotf-yellow rounded-full"
                  style={{ width: `${step.rank * 35}%` }}
                />
              </div>
              <p className="text-xl text-text-primary shrink-0">{step.rank * 35}%</p>
            </div>
          </div>

          <button className="w-full h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full">
            Join the Conversation
          </button>
        </div>

        <div className="border-t border-[#eee]" />

        {/* Facilitator */}
        <div className="flex items-center gap-5 px-10 py-5 border-b border-[#eee]">
          <div className="size-10 rounded-full bg-surface border border-border shrink-0" />
          <div>
            <p className="text-xl font-semibold text-text-primary">{challenge.facilitator.name}</p>
            <p className="text-base font-medium text-text-secondary">{challenge.facilitator.role}</p>
          </div>
        </div>

        {/* Description */}
        <div className="px-10 py-7.5 border-b border-progress-track">
          <p className={`text-base text-text-primary leading-relaxed ${!expanded ? "line-clamp-4" : ""}`}>
            {step.description}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-base text-gotf-blue mt-2"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>

        {/* Activities */}
        <div className="px-10 pt-6 pb-8">
          <p className="text-xl font-semibold text-text-subheading mb-4">Activities</p>
          <div className="flex flex-col divide-y divide-progress-track">
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
        </div>

      </div>
    </div>
  );
}
