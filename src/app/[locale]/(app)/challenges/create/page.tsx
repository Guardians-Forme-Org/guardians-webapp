import { use } from "react";
import { redirect } from "@/i18n/navigation";
import CreateChallengeWizard from "@/features/challenges/screens/CreateChallengeWizard";

export default function CreateChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ circleId?: string }>;
}) {
  const { locale } = use(params);
  const { circleId } = use(searchParams);

  if (!circleId) {
    redirect({ href: "/discover", locale });
  }

  return <CreateChallengeWizard circleId={circleId!} />;
}
