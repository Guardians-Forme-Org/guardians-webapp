"use client";

import Text from "@/components/ui/Text";
import { ChevronDown, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  city: string;
  country: string;
  onClick?: () => void;
};

export default function LocationPill({ city, country, onClick }: Props) {
  const t = useTranslations("home");
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-1.5 px-5 mb-5">
      <MapPin size={13} className="text-gotf-green shrink-0" />
      <Text variant="body" className="text-gotf-green font-medium">
        {city ? `${city}${country ? "," : ""}` : t("setLocation")}
      </Text>
      {country && <Text variant="body">{country}</Text>}
      <ChevronDown size={13} className="text-text-secondary ml-0.5" />
    </button>
  );
}
