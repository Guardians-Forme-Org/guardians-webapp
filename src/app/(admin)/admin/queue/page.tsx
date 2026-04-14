"use client";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import { useReviewReport } from "@/hooks/useReviewReport";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminQueuePage() {
  const { t } = useTranslation();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const router = useRouter();
  const { data: reports, isLoading, isError } = useAdminQueue();
  const reviewReport = useReviewReport();

  useEffect(() => {
    if (!isAdmin) router.replace("/");
  }, [isAdmin, router]);

  if (!isAdmin) {
    return <p className="p-4 text-sm text-muted-foreground">{t("admin.queue.unauthorized")}</p>;
  }

  async function handleAction(
    id: string,
    status: "APPROVED" | "REJECTED" | "MORE_INFO",
  ) {
    try {
      await reviewReport.mutateAsync({ id, status });
      const msg =
        status === "APPROVED"
          ? t("admin.queue.approveSuccess")
          : status === "REJECTED"
          ? t("admin.queue.rejectSuccess")
          : t("admin.queue.requestInfoSuccess");
      toast(msg);
    } catch {
      toast.error(t("admin.queue.actionError"));
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">{t("admin.queue.title")}</h1>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{t("admin.queue.errorTitle")}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && reports?.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("admin.queue.empty")}</p>
      )}

      {!isLoading && !isError && reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">{t("admin.queue.circleColumn")}:</span>{" "}
                    {report.circle_name}
                  </p>
                  <p>
                    <span className="font-medium">{t("admin.queue.challengeColumn")}:</span>{" "}
                    {report.challenge_title}
                  </p>
                  <p>
                    <span className="font-medium">{t("admin.queue.dateColumn")}:</span>{" "}
                    {new Date(report.submitted_at).toLocaleDateString()}
                  </p>
                  {report.evidence_url && (
                    <p>
                      <a
                        href={report.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {t("admin.queue.viewEvidence")}
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(report.id, "APPROVED")}
                    disabled={reviewReport.isPending}
                  >
                    {t("admin.queue.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(report.id, "REJECTED")}
                    disabled={reviewReport.isPending}
                  >
                    {t("admin.queue.reject")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(report.id, "MORE_INFO")}
                    disabled={reviewReport.isPending}
                  >
                    {t("admin.queue.requestInfo")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
