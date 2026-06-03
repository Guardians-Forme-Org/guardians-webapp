import {
  ChevronRight,
  X,
  User,
  Zap,
  CheckCircle,
  Leaf,
  Compass,
  Calendar,
  Eye,
  Lightbulb,
  Shuffle,
  Clock,
  Users,
} from "lucide-react";
import Text from "@/components/ui/Text";

// ─── Data ────────────────────────────────────────────────────────────────────

const impactStats = [
  { label: "My CO₂ Avoided",         value: "20kg"      },
  { label: "Circles CO₂ Avoided",    value: "1840kg"    },
  { label: "My Area Generated",      value: "750m²"     },
  { label: "Circle's Area Generated",value: "50 000m²"  },
  { label: "My Waste Processed",     value: "32kg"      },
  { label: "Circle's Waste Processed",value: "525kg"    },
];

const markers = [
  { label: "First Impact",  icon: Zap,         earned: true  },
  { label: "First Circle",  icon: CheckCircle, earned: true  },
  { label: "Deep Roots",    icon: Leaf,        earned: true  },
  { label: "Range",         icon: Compass,     earned: true  },
  { label: "Sustained",     icon: Calendar,    earned: true  },
  { label: "Witness",       icon: Eye,         earned: false },
  { label: "Originator",    icon: Lightbulb,   earned: false },
  { label: "Multiplier",    icon: Shuffle,     earned: false },
];

type VerificationStatus = "verified" | "submitted";

const trace: {
  title: string;
  category: string;
  level: string;
  status: VerificationStatus;
  hours: number;
  circle: string;
  date: string;
  note?: string;
}[] = [
  { title: "Urban Composting Drive",   category: "Waste Reduction", level: "L3 verified", status: "verified",  hours: 14, circle: "Soweto Green", date: "Apr 2026", note: "also peer-verified 2 others" },
  { title: "Stormwater Monitoring",    category: "Water & Land",    level: "L2 verified", status: "verified",  hours: 8,  circle: "Soweto Green", date: "Mar 2026" },
  { title: "Tree Canopy Survey",       category: "Biodiversity",    level: "L1 submitted",status: "submitted", hours: 5,  circle: "EcoJozi",      date: "Mar 2026" },
  { title: "Plastic Audit — Market St",category: "Waste Reduction", level: "L2 verified", status: "verified",  hours: 6,  circle: "Soweto Green", date: "Feb 2026", note: "peer-verified 1 other" },
];

const settingsItems = ["Profile", "Account Details", "Notifications", "Location", "Settings"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-full bg-white">

      {/* Top bar */}
      <div className="flex items-center justify-between px-7.5 pt-12 pb-4">
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians logo"
          className="w-8 h-8 object-contain"
        />
        <X size={20} className="opacity-30 text-black" />
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-1 pb-8 pt-2">
        <div className="w-30 h-30 rounded-full bg-surface border-2 border-border flex items-center justify-center mb-3">
          <User size={48} className="text-text-muted" />
        </div>
        <h1 className="text-[32px] font-bold text-black leading-tight">Sean Wilson</h1>
        <p className="text-base font-medium text-text-muted mt-0.5">Guardian, Facilitator</p>
        <p className="text-base text-text-secondary">Joined 6 March 2026</p>
      </div>

      {/* Impact stats — flat 2-col grid with dividers */}
      <div className="px-7.5">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex">
            {impactStats.slice(row * 2, row * 2 + 2).map(({ label, value }) => (
              <div
                key={label}
                className="flex-1 flex flex-col gap-2 pt-6 pb-8 px-1 border-b border-progress-track"
              >
                <Text variant="caption" className="text-text-muted">{label}</Text>
                <p className="text-2xl font-semibold text-text-subheading">{value}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Contribution markers */}
      <div className="px-7.5 pt-6 pb-5">
        <Text variant="label" className="block mb-3">Contribution markers</Text>
        <div className="flex flex-wrap gap-2">
          {markers.map(({ label, icon: Icon, earned }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition-opacity ${
                earned
                  ? "bg-green-50 border-gotf-green text-gotf-green"
                  : "bg-white border-border text-text-muted opacity-40"
              }`}
            >
              <Icon size={12} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The Trace */}
      <div className="px-7.5 pb-6 border-t border-progress-track">
        <Text variant="label" className="block mt-5 mb-3">The Trace</Text>
        <div className="flex flex-col divide-y divide-progress-track">
          {trace.map((entry) => (
            <div key={entry.title} className="py-4">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{entry.title}</p>
                  <p className="text-xs text-gotf-green mt-0.5">{entry.category}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] px-2 py-0.5 rounded border ${
                    entry.status === "verified"
                      ? "bg-green-50 border-gotf-green text-gotf-green"
                      : "bg-surface border-border text-text-muted"
                  }`}
                >
                  {entry.level}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={11} />{entry.hours} hrs
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} />Circle: {entry.circle}
                </span>
              </div>
              <Text variant="caption" className="block mt-1">
                {entry.date}{entry.note ? ` · ${entry.note}` : ""}
              </Text>
            </div>
          ))}
        </div>
        <Text variant="caption" className="block text-center mt-1">
          4 months active · 2 circles
        </Text>
      </div>

      {/* Settings list */}
      <div className="border-t border-progress-track">
        {settingsItems.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between px-7.5 py-6 border-b border-progress-track"
          >
            <span className="text-base font-medium text-black">{item}</span>
            <ChevronRight size={20} className="text-text-muted" />
          </div>
        ))}
      </div>

    </div>
  );
}
