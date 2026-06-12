import { use } from "react";
import CircleScreen from "@/features/circles/screens/CircleScreen";

export default function CirclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CircleScreen circleId={id} />;
}
