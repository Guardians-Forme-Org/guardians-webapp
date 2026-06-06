import { use } from "react";
import LogEvidenceWizard from "@/features/challenges/screens/LogEvidenceWizard";

export default function LogEvidencePage({
  params,
}: {
  params: Promise<{ id: string; stepId: string }>;
}) {
  const { id, stepId } = use(params);
  return <LogEvidenceWizard challengeId={id} stepId={stepId} />;
}
