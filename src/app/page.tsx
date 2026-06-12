import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function RootPage() {
  const locale = await getLocale().catch(() => "en");
  redirect(`/${locale}/splash`);
}
