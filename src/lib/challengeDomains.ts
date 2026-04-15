import type { ChallengeDomain } from "@/types/challenges";

export type DomainConfig = {
  key: ChallengeDomain | "all";
  labelKey: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
};

export const DOMAIN_CONFIG: Record<ChallengeDomain, DomainConfig> = {
  mitigation: {
    key: "mitigation",
    labelKey: "challenges.domains.mitigation",
    textClass: "text-domain-mitigation",
    bgClass: "bg-domain-mitigation-bg",
    borderClass: "border-domain-mitigation-border",
  },
  resilience: {
    key: "resilience",
    labelKey: "challenges.domains.resilience",
    textClass: "text-domain-resilience",
    bgClass: "bg-domain-resilience-bg",
    borderClass: "border-domain-resilience-border",
  },
  democratic_infrastructure: {
    key: "democratic_infrastructure",
    labelKey: "challenges.domains.democratic_infrastructure",
    textClass: "text-domain-democratic",
    bgClass: "bg-domain-democratic-bg",
    borderClass: "border-domain-democratic-border",
  },
  regeneration: {
    key: "regeneration",
    labelKey: "challenges.domains.regeneration",
    textClass: "text-domain-regeneration",
    bgClass: "bg-domain-regeneration-bg",
    borderClass: "border-domain-regeneration-border",
  },
};

export const ALL_DOMAINS: DomainConfig[] = [
  {
    key: "all",
    labelKey: "challenges.domains.all",
    textClass: "",
    bgClass: "",
    borderClass: "",
  },
  ...Object.values(DOMAIN_CONFIG),
];

export function getDomainConfig(domain: ChallengeDomain): DomainConfig {
  return DOMAIN_CONFIG[domain];
}
