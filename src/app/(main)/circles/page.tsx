"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCircles } from "@/hooks/useCircles";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CirclesPage() {
  const { t } = useTranslation();
  const { data: circles, isLoading, isError } = useCircles();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("circles.list.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("circles.list.empty").includes("first") ? "Community groups making real impact." : ""}
          </p>
        </div>
        <Link href="/circles/new" className={buttonVariants({ size: "sm" })}>
          {t("circles.list.createButton")}
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/4 mt-1" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{t("circles.list.errorTitle")}</p>
        </div>
      )}

      {!isLoading && !isError && circles?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">{t("circles.list.empty")}</p>
        </div>
      )}

      {!isLoading && !isError && circles && circles.length > 0 && (
        <div className="space-y-2">
          {circles.map((circle) => {
            const memberCount = circle.member_ids?.length ?? 0;
            return (
              <Link
                key={circle.id}
                href={`/circles/${circle.id}`}
                className="group flex items-start justify-between gap-4 rounded-xl border border-border p-4 hover:bg-muted/40 hover:border-foreground/20 transition-all"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-semibold tracking-tight group-hover:text-foreground truncate">
                    {circle.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {circle.description}
                  </p>
                  <div className="flex gap-3 pt-1 text-[11px] text-muted-foreground/60">
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
                  </div>
                </div>
                <span className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors mt-0.5">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
