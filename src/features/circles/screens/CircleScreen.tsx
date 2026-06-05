"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import CircleHero from "../components/CircleHero";
import { getCircleById, type Circle, type CircleChallenge } from "../data";
import Text from "@/components/ui/Text";

// ── Sub-components ─────────────────────────────────────────────────────────────

function CircleChallengeRow({ item }: { item: CircleChallenge }) {
  return (
    <Link href={`/challenges/${item.id}`}>
      <div className="flex items-center gap-3.75">
        <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
          {item.rank}
        </span>
        <div
          className={`size-15 rounded-lg overflow-hidden shrink-0 ${
            item.locked ? "bg-[#ccc] opacity-50" : "bg-surface"
          }`}
        />
        <div className="flex-1 min-w-0 px-1">
          <p className="text-base font-semibold text-text-primary leading-tight">{item.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">Joined {item.joinedDate}</p>
          <div className="mt-1.5 h-[3px] bg-[#787878] rounded-full overflow-hidden">
            <div className="h-full bg-gotf-yellow rounded-full" style={{ width: `${item.progress}%` }} />
          </div>
        </div>
        <ChevronRight size={24} className="text-text-muted shrink-0" />
      </div>
    </Link>
  );
}

function GuardianRow({ circle }: { circle: Circle }) {
  return (
    <div className="py-7.5 border-b border-progress-track">
      {/* Header */}
      <div className="flex items-center justify-between px-7.5 mb-6">
        <p className="text-xl font-bold text-text-subheading">Guardians</p>
        <Link href={`/circles/${circle.id}/members`} className="text-base text-gotf-blue">
          See all
        </Link>
      </div>

      {/* 5 named avatars */}
      <div className="flex justify-between px-7.5">
        {circle.members.slice(0, 5).map((member) => (
          <div key={member.id} className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white" />
            <Text variant="caption" className="text-text-subheading">{member.name}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

type Props = { circleId: string };

export default function CircleScreen({ circleId }: Props) {
  const [joined, setJoined] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const circle = getCircleById(circleId);

  if (!circle) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Circle not found.</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-full">
      <CircleHero />

      {/* White card */}
      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">

        {/* Identity */}
        <div className="px-10 pt-7.5">
          <h1 className="text-[28px] font-bold text-text-subheading leading-tight">{circle.name}</h1>
          <p className="text-base text-[#666] mt-1">Since {circle.since}</p>

          <div className="flex items-center gap-1.5 mt-2">
            <MapPin size={16} className="text-gotf-green shrink-0" />
            <p className="text-base">
              <span className="font-semibold text-text-primary">{circle.location.city}</span>
              <span className="text-[#666]">{", "}{circle.location.region}</span>
            </p>
          </div>

          {/* Join / Joined button */}
          <div className="mt-3 mb-6">
            <button
              onClick={() => setJoined((v) => !v)}
              className={`px-5 h-10 text-base font-semibold rounded-full text-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.15)] ${
                joined
                  ? "bg-[#333] w-36"
                  : "bg-linear-to-r from-[#008000] to-[#129612]"
              }`}
            >
              {joined ? "Circle joined" : "Join Circle"}
            </button>
          </div>
        </div>

        {/* Guardians section */}
        <GuardianRow circle={circle} />

        {/* Stats grid — 4 rows */}
        <div>
          {/* Row 0: Guardians + Active Challenges */}
          <div className="flex border-b border-progress-track">
            <div className="flex-1 flex flex-col gap-2 px-10 pt-6 pb-5">
              <Text variant="caption" className="text-text-muted">Guardians</Text>
              <p className="text-2xl font-semibold text-text-subheading">{circle.totalGuardians}</p>
            </div>
            <div className="flex-1 flex flex-col gap-2 px-5 pt-6 pb-5">
              <Text variant="caption" className="text-text-muted">Active Challenges</Text>
              <p className="text-2xl font-semibold text-text-subheading">{circle.activeChallenges}</p>
            </div>
          </div>

          {/* Rows 1–3: impact stats pairs */}
          {[[0, 1], [2, 3], [4, 5]].map(([a, b]) => (
            <div key={a} className="flex border-b border-progress-track">
              {[circle.impactStats[a], circle.impactStats[b]].map((stat) => (
                <div key={stat.label} className="flex-1 flex flex-col gap-2 px-10 pt-6 pb-5 first:px-10 [&:nth-child(2)]:px-5">
                  <Text variant="caption" className="text-text-muted">{stat.label}</Text>
                  <p className="text-2xl font-semibold text-text-subheading">{stat.value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="px-10 py-7.5 border-b border-progress-track">
          <p className={`text-base text-text-primary leading-relaxed ${!expanded ? "line-clamp-4" : ""}`}>
            {circle.description}
          </p>
          <button onClick={() => setExpanded((v) => !v)} className="text-base text-gotf-blue mt-2">
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>

        {/* Facilitator */}
        <div className="flex items-center gap-5 px-7.5 py-7.5 border-b border-progress-track">
          <div className="size-10 rounded-full bg-surface border border-border shrink-0" />
          <div>
            <p className="text-xl font-semibold text-text-primary">{circle.lead.name}</p>
            <p className="text-base font-medium text-text-secondary">{circle.lead.role}</p>
          </div>
        </div>

        {/* Challenges section */}
        <div className="px-7.5 py-7.5 pb-10">
          <div className="flex items-center justify-between mb-7.5">
            <p className="text-xl font-bold text-text-subheading">Challenges</p>
            <p className="text-base text-text-secondary">{circle.totalGuardians} Total Guardians</p>
          </div>

          <div className="flex flex-col gap-7.5">
            {circle.challenges.map((challenge) => (
              <CircleChallengeRow key={challenge.id} item={challenge} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
