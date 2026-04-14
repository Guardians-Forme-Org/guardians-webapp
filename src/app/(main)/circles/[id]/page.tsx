"use client";

import Link from "next/link";
import { use } from "react";
import { useTranslation } from "react-i18next";
import { useCircle } from "@/hooks/useCircle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const { data: circle, isLoading, isError } = useCircle(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (isError || !circle) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Link href="/circles" className="text-sm text-muted-foreground hover:underline">
          ← {t("circles.detail.backLink")}
        </Link>
        <p className="text-destructive">
          {!circle ? t("circles.detail.notFound") : t("circles.detail.errorTitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Link href="/circles" className="text-sm text-muted-foreground hover:underline">
        ← {t("circles.detail.backLink")}
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{circle.name}</h1>
        <p className="text-muted-foreground">{circle.description}</p>
      </div>

      <div className="text-sm space-y-1">
        <div className="flex gap-2 items-center">
          <span className="font-medium">{t("circles.detail.guardianLabel")}:</span>
          <Badge variant="outline">{circle.guardian_id}</Badge>
        </div>
        <div className="flex gap-2 items-center">
          <span className="font-medium">{t("circles.detail.createdLabel")}:</span>
          <span className="text-muted-foreground">
            {new Date(circle.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("circles.detail.membersSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("circles.detail.emptySection")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("circles.detail.challengesSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("circles.detail.emptySection")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("circles.detail.impactSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("circles.detail.emptySection")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
