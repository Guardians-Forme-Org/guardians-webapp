import Text from "@/components/ui/Text";

export type Challenge = {
  id: number;
  title: string;
  challengeName: string;
  circleName: string;
  currentStep: number;
  totalSteps: number;
  image?: string;
};

type Props = {
  challenge: Challenge;
};

export default function ChallengeCard({ challenge }: Props) {
  const progress = Math.round(
    (challenge.currentStep / challenge.totalSteps) * 100,
  );

  return (
    <div className="w-[55%] shrink-0 overflow-hidden bg-white ">
      <div className="h-24 bg-[#D1D5DB] relative overflow-hidden rounded-xl">
        {challenge.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={challenge.image}
            alt={challenge.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#d4e8d1] to-[#a8d5a2]" />
        )}
      </div>
      <div className="p-3 mt-2">
        <Text
          variant="subheading"
          className="block font-bold text-text-primary truncate mb-0.5 tracking-normal"
        >
          {challenge.title}
        </Text>
        <Text variant="caption" className="block truncate mb-0.5 font-semibold">
          {challenge.challengeName}
        </Text>
        <Text variant="caption" className="block text-text-muted truncate mb-3">
          {challenge.circleName}
        </Text>
        <div className="h-1 rounded-full overflow-hidden mb-1.5 flex">
          <div
            className="h-full bg-gotf-yellow transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="h-full bg-progress-track transition-all"
            style={{ width: `${101 - progress}%` }}
          />
        </div>
        <Text variant="caption" className="text-text-muted">
          {challenge.currentStep} of {challenge.totalSteps} Steps
        </Text>
      </div>
    </div>
  );
}
