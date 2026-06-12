import { use } from "react";
import StepScreen from "@/features/challenges/screens/StepScreen";

export default function StepPage({
  params,
}: {
  params: Promise<{ id: string; stepId: string }>;
}) {
  const { id, stepId } = use(params);
  return <StepScreen challengeId={id} stepId={stepId} />;
}
