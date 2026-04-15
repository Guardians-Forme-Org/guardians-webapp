"use client";

import Link from "next/link";
import { use } from "react";
import { useTranslation } from "react-i18next";
import { useCircle } from "@/hooks/useCircle";
import { Skeleton } from "@/components/ui/skeleton";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/60">
          {title}
        </p>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

export default function CircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const { data: circle, isLoading } = useCircle(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-3 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Link
          href="/circles"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {t("circles.detail.backLink")}
        </Link>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {!circle
              ? t("circles.detail.notFound")
              : t("circles.detail.errorTitle")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/circles"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← {t("circles.detail.backLink")}
      </Link>

      {/* Hero */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{circle.name}</h1>
        <p className="text-sm text-muted-foreground">{circle.description}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground/60">
            {t("circles.detail.guardianLabel")}
          </span>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            {circle.guardian_id}
          </code>
        </span>
        <span>
          <span className="font-medium text-foreground/60">
            {t("circles.detail.createdLabel")}
          </span>{" "}
          {new Date(circle.created_at).toLocaleDateString()}
        </span>
      </div>

      <Section title={t("circles.detail.membersSection")}>
        <p className="text-xs text-muted-foreground">{t("circles.detail.emptySection")}</p>
      </Section>

      <Section title={t("circles.detail.challengesSection")}>
        <p className="text-xs text-muted-foreground">{t("circles.detail.emptySection")}</p>
      </Section>

      <Section title={t("circles.detail.impactSection")}>
        <p className="text-xs text-muted-foreground">{t("circles.detail.emptySection")}</p>
      </Section>
    </div>
  );
}
