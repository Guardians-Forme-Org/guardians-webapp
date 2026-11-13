"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { LegalHeader, LegalSectionBody, type LegalSection } from "@/components/LegalDocument";
import { Link, useRouter } from "@/i18n/navigation";
import { useAdminOnly } from "@/features/documentation/useAdminOnly";

// One section of the admin guide, with a link on to the next
export default function DocumentationSectionPage() {
  const isAdmin = useAdminOnly();
  const t = useTranslations("documentation");
  const router = useRouter();
  const { section: param } = useParams<{ section: string }>();
  const sections = t.raw("sections") as LegalSection[];
  const index = sections.findIndex((s) => String(s.number) === param);
  const section = sections[index];
  const next = sections[index + 1];

  useEffect(() => {
    if (isAdmin && !section) router.replace("/documentation");
  }, [isAdmin, section, router]);

  if (!isAdmin || !section) return null;

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <LegalHeader />

      <div className="flex-1 overflow-y-auto pb-16">
        <div className="px-10">
          <p className="text-sm text-text-muted mb-1">{t("title")}</p>
          <h1 className="text-[28px] font-bold text-black leading-tight mb-6">
            {section.number}. {section.heading}
          </h1>
          <div className="flex flex-col gap-3">
            <LegalSectionBody section={section} />
          </div>
        </div>

        {next && (
          <Link
            href={`/documentation/${next.number}`}
            replace
            className="mt-10 flex items-center justify-between gap-3 w-full px-10 py-5 border-y border-progress-track"
          >
            <div className="min-w-0">
              <p className="text-sm text-text-muted">{t("nextSection")}</p>
              <p className="text-base font-medium text-black">
                {next.number}. {next.heading}
              </p>
            </div>
            <ChevronRight size={20} className="text-text-muted shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
