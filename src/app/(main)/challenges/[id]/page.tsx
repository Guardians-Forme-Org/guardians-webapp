"use client";

import { use } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useChallenge } from "@/hooks/useChallenge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const { data: challenge, isLoading, isError } = useChallenge(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Link href="/challenges" className="text-sm text-muted-foreground hover:underline">
          ← {t("challenges.detail.backLink")}
        </Link>
        <p className="text-destructive">
          {!challenge ? t("challenges.detail.notFound") : t("challenges.detail.errorTitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Link href="/challenges" className="text-sm text-muted-foreground hover:underline">
        ← {t("challenges.detail.backLink")}
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {challenge.category && (
            <Badge variant="secondary">{challenge.category.name}</Badge>
          )}
          {challenge.status && <Badge>{challenge.status.name}</Badge>}
        </div>
        <h1 className="text-2xl font-semibold">{challenge.title}</h1>
        <p className="text-muted-foreground">{challenge.description}</p>
      </div>

      {challenge.validation_tier && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("challenges.detail.validationTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              {t("challenges.detail.validationLevel", {
                level: challenge.validation_tier.level,
              })}{" "}
              — {challenge.validation_tier.name}
            </p>
            <p className="text-muted-foreground">
              {challenge.validation_tier.description}
            </p>
          </CardContent>
        </Card>
      )}

      {challenge.region && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("challenges.detail.locationTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              {challenge.region.suburb}, {challenge.region.city}
            </p>
            {challenge.location?.what3words && (
              <p className="text-muted-foreground">
                {t("challenges.detail.what3wordsLabel")}:{" "}
                {challenge.location.what3words}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("challenges.detail.circlesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("challenges.detail.emptyCircles")}
          </p>
        </CardContent>
      </Card>

      <Link
        href={`/reports/new?challengeId=${challenge.id}`}
        className={buttonVariants() + " w-full justify-center"}
      >
        {t("challenges.detail.submitReport")}
      </Link>
    </div>
  );
}
