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
    <div className="flex items-center gap-3.75">
      <Text
        variant="body"
        className="w-2.5 text-center font-medium text-text-primary shrink-0"
      >
        {circle.rank}
      </Text>
      <div className="size-15 rounded-lg bg-[#D1D5DB] overflow-hidden shrink-0">
        {circle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={circle.image}
            alt={circle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center">
            <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain opacity-20" />
          </div>
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
