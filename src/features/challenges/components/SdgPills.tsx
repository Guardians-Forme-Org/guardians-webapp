import { ExternalLink } from "lucide-react";

export function buildSdgUrl(code: string): string {
  const number = code.replace(/\D/g, "");
  return `https://sdgs.un.org/goals/goal${number}`;
}

// Template SDG tags — one visual variant per surface:
// chip  – compact tag inside the template picker cards
// link  – bordered pill linking to the UN goal page (template preview)
// badge – green pill on the challenge summary / detail headers
type Variant = "chip" | "link" | "badge";

type Sdg = { code: string; name?: string };

export default function SdgPills({
  sdgs,
  variant,
}: {
  sdgs: Sdg[];
  variant: Variant;
}) {
  return (
    <>
      {sdgs.map((sdg, i) => {
        // BE data can repeat a code (CH-002 lists SDG11 twice) — index keeps keys unique
        const key = `${sdg.code}-${i}`;

        if (variant === "chip") {
          return (
            <span
              key={key}
              className="text-[12px] text-text-muted bg-[rgba(86,192,43,0.12)] rounded-full px-2 py-0.5"
            >
              {sdg.code}
            </span>
          );
        }

        if (variant === "link") {
          return (
            <a
              key={key}
              href={buildSdgUrl(sdg.code)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 h-8 border-2 border-[#56c02b] rounded-[20px]"
            >
              <span className="text-[13px] text-[#1a1a1a] font-medium whitespace-nowrap">
                {sdg.code.replace("SDG", "SDG ")} · {sdg.name}
              </span>
              <ExternalLink size={12} className="shrink-0 text-[#1a1a1a]" />
            </a>
          );
        }

        return (
          <span
            key={key}
            className="inline-block bg-[rgba(86,192,43,0.2)] rounded-[20px] px-3 py-1 text-[14px] font-medium text-text-subheading"
          >
            {sdg.code.replace("SDG", "SDG ")}
          </span>
        );
      })}
    </>
  );
}
