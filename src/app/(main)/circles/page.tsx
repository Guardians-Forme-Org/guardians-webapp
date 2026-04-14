"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCircles } from "@/hooks/useCircles";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CirclesPage() {
  const { t } = useTranslation();
  const { data: circles, isLoading, isError } = useCircles();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("circles.list.title")}</h1>
        <Link href="/circles/new" className={buttonVariants({ size: "sm" })}>
          {t("circles.list.createButton")}
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{t("circles.list.errorTitle")}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && circles?.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("circles.list.empty")}</p>
      )}

      {!isLoading && !isError && circles && circles.length > 0 && (
        <div className="space-y-3">
          {circles.map((circle) => {
            const memberCount = circle.member_ids?.length ?? 0;
            return (
              <Link key={circle.id} href={`/circles/${circle.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">{circle.name}</CardTitle>
                    <CardDescription>{circle.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex gap-4">
                    <span>
                      {memberCount === 0
                        ? t("circles.list.noMembers")
                        : t("circles.list.memberCount", { count: memberCount })}
                    </span>
                    <span>
                      {t("circles.list.created", {
                        date: new Date(circle.created_at).toLocaleDateString(),
                      })}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
