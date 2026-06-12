"use client";

import { MapPin, Plus, ChevronRight, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { ApiCircle, CirclesListResponse } from "@/lib/types/circles";

// ── Circle card ───────────────────────────────────────────────────────────────

function CircleCard({ circle, role }: { circle: ApiCircle; role?: string }) {
  const location = circle.region.address || "—";

  return (
    <Link
      href={`/circles/${circle.circleId}`}
      className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gotf-green">
        {circle.bannerUrl ? (
          <img src={circle.bannerUrl} alt={circle.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <Users size={20} className="text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text variant="subheading" className="font-semibold truncate">
            {circle.name}
          </Text>
          {role && (
            <span className="shrink-0 text-[10px] font-medium text-gotf-green bg-green-50 px-2 py-0.5 rounded-full capitalize">
              {role.toLowerCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-text-muted mt-0.5">
          <MapPin size={10} />
          <Text variant="label" className="truncate normal-case tracking-normal">
            {location}
          </Text>
        </div>
        <Text variant="label" className="normal-case tracking-normal mt-0.5">
          {circle.members.length} members · {circle.challenges.length} challenges
        </Text>
      </div>

      {role ? (
        <ChevronRight size={16} className="text-text-muted shrink-0" />
      ) : (
        <button className="shrink-0 text-[11px] font-semibold text-gotf-green border border-gotf-green px-2.5 py-1 rounded-lg">
          Join
        </button>
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CirclesPage() {
  const { user } = useAuth();
  const { data: circles, isLoading, error } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.get<CirclesListResponse>("/circles"),
  });

  const myCircles = circles?.filter((c) =>
    c.members.some((m) => m.userId === user?.id)
  ) ?? [];

  const exploreCircles = circles?.filter((c) =>
    !c.members.some((m) => m.userId === user?.id)
  ) ?? [];

  return (
    <div className="flex flex-col min-h-full bg-surface">
      <header className="bg-white border-b border-border">
        <PageHeader
          title="Circles"
          action={
            <Link
              href="/circles/create"
              className="flex items-center gap-1.5 bg-gotf-green text-white text-xs font-medium px-3 py-2 rounded-xl"
            >
              <Plus size={13} />
              Create
            </Link>
          }
        />
        <SearchBar placeholder="Search circles..." />
      </header>

      <div className="flex-1 px-5 py-5 space-y-6">
        {isLoading && (
          <p className="text-sm text-text-muted text-center pt-10">Loading circles…</p>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center pt-10">
            {error instanceof Error ? error.message : "Failed to load circles."}
          </p>
        )}

        {!isLoading && !error && (
          <>
            <section>
              <SectionHeader title="My Circles" />
              {myCircles.length === 0 ? (
                <p className="text-sm text-text-muted">You haven&apos;t joined any circles yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {myCircles.map((c) => {
                    const membership = c.members.find((m) => m.userId === user?.id);
                    return (
                      <CircleCard key={c.id} circle={c} role={membership?.role} />
                    );
                  })}
                </div>
              )}
            </section>

            {exploreCircles.length > 0 && (
              <section>
                <SectionHeader title="Explore Near You" />
                <div className="space-y-2.5">
                  {exploreCircles.map((c) => (
                    <CircleCard key={c.id} circle={c} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
