"use client";

import { ChallengeCard } from "./ChallengeCard";
import { ChallengeCardSkeleton } from "./ChallengeCardSkeleton";
import { ChallengeEmptyState } from "./ChallengeEmptyState";
import type { TaggedChallenge } from "@/types/challenges";

type Props = {
  challenges: TaggedChallenge[];
  isLoading: boolean;
  onClearFilters: () => void;
};

export function ChallengeGrid({ challenges, isLoading, onClearFilters }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoading &&
        Array.from({ length: 6 }).map((_, i) => (
          <ChallengeCardSkeleton key={i} />
        ))}

      {!isLoading && challenges.length === 0 && (
        <ChallengeEmptyState onClear={onClearFilters} />
      )}

      {!isLoading &&
        challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
    </div>
  );
}
