"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Text from "./Text";

type Props = {
  title: string;
  href?: string;
};

export default function SectionHeader({ title, href }: Props) {
  const t = useTranslations("common");
  return (
    <div className="flex items-center justify-between mb-4">
      <Text variant="heading">{title}</Text>
      {href && (
        <Link href={href} className="text-sm text-gotf-blue hover:opacity-80 transition-opacity">
          {t("seeAll")}
        </Link>
      )}
    </div>
  );
}
