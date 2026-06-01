import { ChevronRight } from "lucide-react";
import Text from "@/components/ui/Text";

export type Circle = {
  id: number;
  rank: number;
  name: string;
  joinDate: string;
  image?: string;
};

type Props = {
  circle: Circle;
};

export default function CircleListItem({ circle }: Props) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Text variant="body" className="w-5 text-center font-medium text-[#0A0A0A]">
        {circle.rank}
      </Text>
      <div className="w-10 h-10 rounded-xl bg-[#D1D5DB] overflow-hidden shrink-0">
        {circle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={circle.image} alt={circle.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#c8e6c9] to-[#81c784]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Text variant="subheading" className="block font-semibold text-[#0A0A0A] truncate">
          {circle.name}
        </Text>
        <Text variant="caption" className="block text-[#9CA3AF]">
          Joined {circle.joinDate}
        </Text>
      </div>
      <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
    </div>
  );
}
