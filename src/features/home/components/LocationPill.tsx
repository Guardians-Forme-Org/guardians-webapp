import Text from "@/components/ui/Text";
import { ChevronDown, MapPin } from "lucide-react";

type Props = {
  city: string;
  country: string;
};

export default function LocationPill({ city, country }: Props) {
  return (
    <button className="flex items-center justify-center gap-1.5 px-5 mb-5">
      <MapPin size={13} className="text-[#003518] shrink-0" />
      <Text variant="body" className="text-gotf-green font-medium">
        {city},
      </Text>
      <Text variant="body">{country}</Text>
      <ChevronDown size={13} className="text-[#6B7280] ml-0.5" />
    </button>
  );
}
