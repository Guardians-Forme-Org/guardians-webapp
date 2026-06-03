import Text from "@/components/ui/Text";
import { ChevronRight } from "lucide-react";

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
    <div className="flex items-center gap-1 py-3.5">
      <Text
        variant="body"
        className="w-5 text-center font-medium text-text-primary"
      >
        {circle.rank}
      </Text>
      <div className="size-12 rounded-lg bg-[#D1D5DB] overflow-hidden shrink-0 mr-2">
        {circle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={circle.image}
            alt={circle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#c8e6c9] to-[#81c784]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Text
          variant="subheading"
          className="block font-semibold text-text-primary truncate"
        >
          {circle.name}
        </Text>
        <Text variant="caption" className="block text-text-muted">
          Joined {circle.joinDate}
        </Text>
      </div>
      <ChevronRight size={16} className="text-text-muted shrink-0" />
    </div>
  );
}
