import { MapPin, Plus, ChevronRight, Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import Text from "@/components/ui/Text";

const myCircles = [
  {
    id: 1,
    name: "Urban Greening",
    location: "KwaZulu-Natal, Durban",
    members: 24,
    challenges: 3,
    role: "Member",
    color: "#003518",
  },
  {
    id: 2,
    name: "Urban Watch",
    location: "Umoja 1, Nairobi",
    members: 12,
    challenges: 1,
    role: "Facilitator",
    color: "#1a4a2e",
  },
];

const exploreCircles = [
  {
    id: 3,
    name: "Eco Makers",
    location: "Langa, Cape Town",
    members: 34,
    challenges: 5,
    color: "#2d6a4f",
  },
  {
    id: 4,
    name: "Green Roots",
    location: "Soweto, Johannesburg",
    members: 67,
    challenges: 8,
    color: "#003518",
  },
  {
    id: 5,
    name: "River Keepers",
    location: "Gaborone, Botswana",
    members: 18,
    challenges: 2,
    color: "#1a4a2e",
  },
];

export default function CirclesPage() {
  return (
    <div className="flex flex-col min-h-full bg-surface">
      <header className="bg-white border-b border-border">
        <PageHeader
          title="Circles"
          action={
            <button className="flex items-center gap-1.5 bg-gotf-green text-white text-xs font-medium px-3 py-2 rounded-xl">
              <Plus size={13} />
              Create
            </button>
          }
        />
        <SearchBar placeholder="Search circles..." />
      </header>

      <div className="flex-1 px-5 py-5 space-y-6">
        {/* My Circles */}
        <section>
          <SectionHeader title="My Circles" />
          <div className="space-y-2.5">
            {myCircles.map((c) => (
              <a
                key={c.id}
                href={`/circles/${c.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: c.color }}
                >
                  <Users size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Text variant="subheading" className="font-semibold truncate">
                      {c.name}
                    </Text>
                    <span className="shrink-0 text-[10px] font-medium text-gotf-green bg-green-50 px-2 py-0.5 rounded-full">
                      {c.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-text-muted mt-0.5">
                    <MapPin size={10} />
                    <Text variant="label" className="truncate normal-case tracking-normal">
                      {c.location}
                    </Text>
                  </div>
                  <Text variant="label" className="normal-case tracking-normal mt-0.5">
                    {c.members} members · {c.challenges} challenges
                  </Text>
                </div>

                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </a>
            ))}
          </div>
        </section>

        {/* Explore Near You */}
        <section>
          <SectionHeader title="Explore Near You" />
          <div className="space-y-2.5">
            {exploreCircles.map((c) => (
              <a
                key={c.id}
                href={`/circles/${c.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: c.color }}
                >
                  <Users size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <Text variant="subheading" className="font-semibold truncate">
                    {c.name}
                  </Text>
                  <div className="flex items-center gap-1 text-text-muted mt-0.5">
                    <MapPin size={10} />
                    <Text variant="label" className="truncate normal-case tracking-normal">
                      {c.location}
                    </Text>
                  </div>
                  <Text variant="label" className="normal-case tracking-normal mt-0.5">
                    {c.members} members · {c.challenges} challenges
                  </Text>
                </div>

                <button className="shrink-0 text-[11px] font-semibold text-gotf-green border border-gotf-green px-2.5 py-1 rounded-lg">
                  Join
                </button>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
