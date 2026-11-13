"use client";

import { use } from "react";
import { useCircle } from "@/lib/hooks/circles";
import CreateCircleWizard from "@/features/circles/screens/CreateCircleWizard";
import Text from "@/components/ui/Text";
import { useTranslations } from "next-intl";

export default function EditCirclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("circles");
  const { id } = use(params);
  const { data: circle, isLoading, error } = useCircle(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">{t("loading")}</Text>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">{t("notFound")}</Text>
      </div>
    );
  }

  return <CreateCircleWizard editCircle={circle} />;
}
