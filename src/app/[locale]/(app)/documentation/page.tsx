"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { LegalHeader, type LegalSection } from "@/components/LegalDocument";
import SearchBar from "@/components/ui/SearchBar";
import { Link } from "@/i18n/navigation";
import { searchSections } from "@/features/documentation/sectionText";
import { useAdminOnly } from "@/features/documentation/useAdminOnly";

// The admin guide's contents: a search box and one row per section
export default function DocumentationPage() {
  const isAdmin = useAdminOnly();
  const t = useTranslations("documentation");
  const [query, setQuery] = useState("");
  const sections = t.raw("sections") as LegalSection[];
  const matches = useMemo(() => searchSections(sections, query), [sections, query]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <LegalHeader />

      <div className="flex-1 overflow-y-auto pb-16">
        <div className="px-10">
          <h1 className="text-[32px] font-bold text-black leading-tight mb-2">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted mb-6">
            {t("lastUpdated", { date: t("updatedOn") })}
          </p>
        </div>

        <SearchBar placeholder={t("searchPlaceholder")} onChange={setQuery} />

        <div className="mt-3 border-t border-progress-track">
          {matches.map(({ section, snippet }) => (
            <Link
              key={section.number}
              href={`/documentation/${section.number}`}
              className="flex items-center justify-between gap-3 w-full px-10 py-5 border-b border-progress-track"
            >
              <div className="min-w-0">
                <p className="text-base font-medium text-black">
                  {section.number}. {section.heading}
                </p>
                {snippet && (
                  <p className="text-sm text-text-muted leading-relaxed mt-1 line-clamp-2">
                    {snippet}
                  </p>
                )}
              </div>
              <ChevronRight size={20} className="text-text-muted shrink-0" />
            </Link>
          ))}
          {matches.length === 0 && (
            <p className="px-10 py-6 text-sm text-text-muted">
              {t("noResults", { query: query.trim() })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
