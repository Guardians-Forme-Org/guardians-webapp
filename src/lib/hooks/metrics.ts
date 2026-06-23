import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type ImpactMatrixItem = {
  id: string;
  impactRecordId: string;
  impactSummary: {
    contribution: { value: number; unitOfMeasure: string; displayName: string };
    impact: {
      value: number;
      unitOfMeasure: string;
      displayName: string;
      siUnit: string;
      shortSummary: string;
      summary: string;
    };
  };
  verified: boolean;
  impactType: string;
  siUnit: string;
};

export type ThingsMatrixItem = {
  count: number;
  name: string;
  region: string;
  displayValue: string;
  label: string;
};

export type PublicMetricsResponse = {
  impactMatrix: ImpactMatrixItem[];
  thingsMatrix: ThingsMatrixItem[];
};

export function usePublicMetrics() {
  return useQuery({
    queryKey: ["publicMatrix"],
    queryFn: () => api.get<PublicMetricsResponse>("/publicMatrix"),
  });
}
