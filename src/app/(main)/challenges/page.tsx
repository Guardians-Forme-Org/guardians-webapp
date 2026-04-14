"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useChallenges } from "@/hooks/useChallenges";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChallengesPage() {
  const { t } = useTranslation();
  const { data: challenges, isLoading, isError } = useChallenges();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const categories = challenges
    ? [...new Set(challenges.map((c) => c.category?.code).filter(Boolean))]
    : [];

  const filtered = challenges?.filter((c) => {
    const matchCategory =
      categoryFilter === "all" || c.category?.code === categoryFilter;
    const matchTier =
      tierFilter === "all" ||
      String(c.validation_tier?.level) === tierFilter;
    return matchCategory && matchTier;
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">{t("challenges.list.title")}</h1>

      <div className="flex flex-wrap gap-2">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("challenges.list.filterCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("challenges.list.filterCategoryAll")}</SelectItem>
            {categories.map((code) => (
              <SelectItem key={code} value={code!}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("challenges.list.filterTier")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("challenges.list.filterTierAll")}</SelectItem>
            <SelectItem value="1">1 — Self Declared</SelectItem>
            <SelectItem value="2">2 — Evidence Based</SelectItem>
            <SelectItem value="3">3 — Peer Reviewed</SelectItem>
          </SelectContent>
        </Select>
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
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{t("challenges.list.errorTitle")}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && filtered?.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("challenges.list.empty")}</p>
      )}

      {!isLoading && !isError && filtered && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((challenge) => (
            <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {challenge.category && (
                      <Badge variant="secondary">{challenge.category.name}</Badge>
                    )}
                    {challenge.validation_tier && (
                      <Badge variant="outline">
                        L{challenge.validation_tier.level} {challenge.validation_tier.name}
                      </Badge>
                    )}
                    {challenge.status && (
                      <Badge>{challenge.status.name}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">{challenge.title}</CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {challenge.region &&
                    t("challenges.list.region", {
                      suburb: challenge.region.suburb,
                      city: challenge.region.city,
                    })}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
