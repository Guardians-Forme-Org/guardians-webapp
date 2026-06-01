import Text from "@/components/ui/Text";

export type Member = {
  id: number;
  name: string;
  avatar?: string;
};

const PLACEHOLDER_COLORS = [
  "bg-[#FBBF24]",
  "bg-[#60A5FA]",
  "bg-[#F87171]",
  "bg-[#34D399]",
  "bg-[#A78BFA]",
];

type Props = {
  member: Member;
  index?: number;
};

export default function MemberAvatar({ member, index = 0 }: Props) {
  const bg = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-12 h-12 rounded-full overflow-hidden ${bg} shrink-0`}>
        {member.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <Text variant="caption" className="text-[#6B7280]">
        {member.name}
      </Text>
    </div>
  );
}
