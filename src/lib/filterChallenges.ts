import type {
  ActiveFilters,
  FinderAnswers,
  TaggedChallenge,
} from "@/types/challenges";

export function filterChallenges(
  challenges: TaggedChallenge[],
  filters: ActiveFilters,
): TaggedChallenge[] {
  return challenges.filter((challenge) => {
    const tags = challenge.tags;

    // Challenges without tags pass all filters — API data not yet tagged
    if (!tags) return true;

    if (filters.domains.length > 0) {
      const domainMatch = filters.domains.some((d) =>
        tags.domain.includes(d),
      );
      if (!domainMatch) return false;
    }

    if (filters.time.length > 0) {
      if (!filters.time.includes(tags.time)) return false;
    }

    if (filters.team.length > 0) {
      if (!filters.team.includes(tags.team)) return false;
    }

    if (filters.validation.length > 0) {
      if (!filters.validation.includes(tags.validation)) return false;
    }

    return true;
  });
}

export function scoreChallenge(
  challenge: TaggedChallenge,
  answers: FinderAnswers,
): number {
  const tags = challenge.tags;
  if (!tags) return 0;

  let score = 0;
  if (answers.domain && tags.domain.includes(answers.domain)) score++;
  if (answers.time && tags.time === answers.time) score++;
  if (answers.team && tags.team === answers.team) score++;
  return score;
}

export function matchLabel(
  score: number,
): "Strong match" | "Good match" | "Possible" {
  if (score === 3) return "Strong match";
  if (score === 2) return "Good match";
  return "Possible";
}
