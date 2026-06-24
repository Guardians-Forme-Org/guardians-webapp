"use client";

import { useTranslations } from "next-intl";

export type BadgeRole = "admin" | "circle-lead" | "facilitator";

const COLORS: Record<BadgeRole, { bg: string; text: string }> = {
  admin:         { bg: "bg-[#7c3aed]",  text: "text-white" },
  "circle-lead": { bg: "bg-gotf-green", text: "text-white" },
  facilitator:   { bg: "bg-gotf-blue",  text: "text-white" },
};

type Props = { roles: BadgeRole[] };

export default function RoleBadge({ roles }: Props) {
  const t = useTranslations("common");
  if (!roles.length) return null;

  const LABELS: Record<BadgeRole, string> = {
    admin:         t("roleAdmin"),
    "circle-lead": t("roleCircleLead"),
    facilitator:   t("roleFacilitator"),
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => {
        const { bg, text } = COLORS[role];
        return (
          <span
            key={role}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text}`}
          >
            {LABELS[role]}
          </span>
        );
      })}
    </div>
  );
}
