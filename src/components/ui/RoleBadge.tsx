"use client";

export type BadgeRole = "admin" | "circle-lead" | "facilitator";

const CONFIG: Record<BadgeRole, { label: string; bg: string; text: string }> = {
  admin:         { label: "Admin",       bg: "bg-[#7c3aed]",  text: "text-white" },
  "circle-lead": { label: "Circle Lead", bg: "bg-gotf-green", text: "text-white" },
  facilitator:   { label: "Facilitator", bg: "bg-gotf-blue",  text: "text-white" },
};

type Props = { roles: BadgeRole[] };

export default function RoleBadge({ roles }: Props) {
  if (!roles.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => {
        const { label, bg, text } = CONFIG[role];
        return (
          <span
            key={role}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text}`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
