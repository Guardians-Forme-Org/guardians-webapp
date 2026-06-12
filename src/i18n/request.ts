import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { defaultLocale, namespaces } from "./locales";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : defaultLocale;

  const messages: Record<string, unknown> = {};
  for (const ns of namespaces) {
    try {
      messages[ns] = (await import(`../../messages/${locale}/${ns}.json`)).default;
    } catch {
      if (locale !== defaultLocale) {
        try {
          messages[ns] = (await import(`../../messages/${defaultLocale}/${ns}.json`)).default;
        } catch {
          messages[ns] = {};
        }
      } else {
        messages[ns] = {};
      }
    }
  }

  return { locale, messages };
});
