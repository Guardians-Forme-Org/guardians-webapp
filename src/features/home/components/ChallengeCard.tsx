import Link from "next/link";
import Text from "@/components/ui/Text";
import type { ApiCircleChallenge } from "@/lib/types/circles";
import { calcChallengeProgress } from "@/lib/utils";

type Props = {
  challenge: ApiCircleChallenge;
};

export default function ChallengeCard({ challenge }: Props) {
  const { percent: progress, completedCount } = calcChallengeProgress(challenge);

  const location = challenge.location?.city
    ? [challenge.location.city, challenge.location.province].filter(Boolean).join(", ")
    : null;

  return (
    <Link href={`/challenges/${challenge.challengeId}`} className="w-[55%] shrink-0 overflow-hidden bg-white">
      <div className="h-24 bg-[#D1D5DB] relative overflow-hidden rounded-xl">
        {challenge.bannerUrl ? (
          <img
            src={challenge.bannerUrl}
            alt={challenge.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center">
            <img src="/images/Guardians Logo-full.png" alt="" className="w-20 h-20 object-contain opacity-20" />
          </div>
        )}
      </div>
      <div className="p-3 mt-2">
        <Text
          variant="subheading"
          className="block font-bold text-text-primary truncate mb-0.5 tracking-normal"
        >
          {challenge.name}
        </Text>
        {location && (
          <Text variant="caption" className="block text-text-muted truncate mb-3">
            {location}
          </Text>
        )}
        <div className="h-1 rounded-full overflow-hidden mb-1.5 flex">
          <div
            className="h-full bg-gotf-yellow transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="h-full bg-progress-track transition-all"
            style={{ width: `${100 - progress}%` }}
          />
        </div>
        <Text variant="caption" className="text-text-muted">
          {completedCount} of {challenge.steps} Steps
        </Text>
      </div>
    </Link>
  );
}
