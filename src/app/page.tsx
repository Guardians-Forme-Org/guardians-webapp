import { redirect } from "next/navigation";

// Entry point — sends all users into the app's splash/onboarding flow.
// The old marketing page is preserved at /landing.
export default function RootPage() {
  redirect("/splash");
}
