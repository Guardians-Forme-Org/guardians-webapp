import { use } from "react";
import LogEvidenceWizard from "@/features/challenges/screens/LogEvidenceWizard";

export default function LogEvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; stepId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id, stepId } = use(params);
  const { view } = use(searchParams);
  return <LogEvidenceWizard challengeId={id} stepId={stepId} viewId={view} />;
}
