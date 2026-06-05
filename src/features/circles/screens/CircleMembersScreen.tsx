import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, ChevronDown } from "lucide-react";
import { getCircleById, type CircleMember } from "../data";
import SearchBar from "@/components/ui/SearchBar";
import Text from "@/components/ui/Text";

// ── Member row ─────────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: CircleMember }) {
  return (
    <div className="flex items-center gap-3.75">
      <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
        {member.rank}
      </span>
      <div
        className={`size-15 rounded-full overflow-hidden shrink-0 border-2 border-white ${
          member.locked ? "bg-[#ccc] opacity-50" : "bg-[#d9d9d9]"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-text-primary">{member.name}</p>
        <Text variant="caption" className="text-text-secondary">Joined {member.joinDate}</Text>
      </div>
      <ChevronRight size={24} className="text-text-muted shrink-0" />
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

type Props = { circleId: string };

export default function CircleMembersScreen({ circleId }: Props) {
  const circle = getCircleById(circleId);

  if (!circle) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Circle not found.</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">

      {/* Header */}
      <div className="px-10 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/circles/${circleId}`} className="size-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
            <ChevronLeft size={20} className="text-text-primary" />
          </Link>
        </div>
        <h1 className="text-[32px] font-bold text-black">Members</h1>
      </div>

      {/* Search */}
      <SearchBar placeholder="Search members..." />

      {/* Location pill */}
      <div className="flex items-center justify-center gap-1.5 mb-5">
        <MapPin size={14} className="text-gotf-green shrink-0" />
        <p className="text-sm">
          <span className="font-semibold text-text-subheading">{circle.location.region}</span>
          <span className="text-text-secondary">{", "}{circle.location.city}</span>
        </p>
        <ChevronDown size={14} className="text-text-secondary" />
      </div>

      <div className="border-t border-progress-track" />

      {/* Top Impactors */}
      <div className="px-7.5 py-6">
        <p className="text-xl font-bold text-text-subheading mb-6">Top Impactors</p>
        <div className="flex flex-col gap-7.5">
          {circle.members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </div>

      <div className="border-t border-progress-track" />

      {/* Guardians count header */}
      <div className="flex items-center gap-4 px-10 py-5">
        <p className="text-xl font-bold text-text-subheading">Guardians</p>
        <p className="text-base text-text-secondary">{circle.totalGuardians} Total Guardians</p>
      </div>

    </div>
  );
}
