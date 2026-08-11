import { use } from "react";
import CircleMembersScreen from "@/features/circles/screens/CircleMembersScreen";

export default function CircleMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CircleMembersScreen circleId={id} />;
}
