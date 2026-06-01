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
      <div className="h-22 bg-[#D1D5DB] relative overflow-hidden rounded-xl">
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
          className="block font-bold text-[#0A0A0A] truncate mb-0.5"
        >
          {challenge.title}
        </Text>
        <Text variant="caption" className="block truncate mb-0.5">
          {challenge.challengeName}
        </Text>
        <Text variant="caption" className="block text-[#9CA3AF] truncate mb-3">
          {challenge.circleName}
        </Text>
        <div className="h-1 rounded-full overflow-hidden mb-1.5 flex">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="h-full bg-gray-400 transition-all"
            style={{ width: `${101 - progress}%` }}
          />
        </div>
        <Text variant="caption" className="text-[#9CA3AF]">
          {challenge.currentStep} of {challenge.totalSteps} Steps
        </Text>
      </div>
    </div>
  );
}
