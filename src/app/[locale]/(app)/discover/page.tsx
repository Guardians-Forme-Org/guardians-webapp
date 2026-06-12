import { Suspense } from "react";
import DiscoverScreen from "@/features/discover/screens/DiscoverScreen";

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverScreen />
    </Suspense>
  );
}
