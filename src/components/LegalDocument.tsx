"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

type LegalNote = {
  text: string;
  href?: string;
};

type LegalList = {
  label?: string;
  intro?: string;
  items: string[];
  note?: LegalNote;
};

type ContactDetails = {
  organisationName?: string;
  email?: string;
  website?: string;
  address?: string;
};

type LegalSection = {
  number: number;
  heading: string;
  content: string[];
  lists?: LegalList[];
  trailingContent?: string[];
  contactDetails?: ContactDetails;
};

/**
 * Renders a locale-aware legal document (terms, privacy policy) from the
 * message namespace of the same name. Each locale owns its own `sections`
 * array, so translations are free to differ in structure from the English.
 */
export default function LegalDocument({ namespace }: { namespace: string }) {
  const router = useRouter();
  const t = useTranslations(namespace);
  const sections = t.raw("sections") as LegalSection[];

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-10 px-10 pt-8 pb-5 shrink-0">
        <div className="flex items-center justify-between">
          <img
            src="/images/Guardians Logo-logo.png"
            alt=""
            className="w-8 h-8 object-contain"
          />
          <button
            onClick={() => router.back()}
            aria-label={t("back")}
            className="text-text-muted"
          >
            <ArrowLeft size={22} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-10 pb-16">
        <h1 className="text-[32px] font-bold text-black leading-tight mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-text-muted mb-10">
          {t("lastUpdated", { date: t("updatedOn") })}
        </p>

        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.number} className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-black">
                {section.number}. {section.heading}
              </h2>

              {section.content.map((para, i) => (
                <p key={i} className="text-sm text-[#444] leading-relaxed">
                  {para}
                </p>
              ))}

              {section.lists?.map((list, li) => (
                <div key={li} className="flex flex-col gap-2">
                  {list.label && (
                    <p className="text-sm font-semibold text-black">
                      {list.label}
                    </p>
                  )}
                  {list.intro && (
                    <p className="text-sm text-[#444] leading-relaxed">
                      {list.intro}
                    </p>
                  )}
                  <ul className="flex flex-col gap-1.5 pl-5">
                    {list.items.map((item, ii) => (
                      <li
                        key={ii}
                        className="text-sm text-[#444] leading-relaxed list-disc"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  {list.note && (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-[#444] leading-relaxed">
                        {list.note.text}
                      </p>
                      {list.note.href && (
                        <a
                          href={list.note.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#3875e9] leading-relaxed break-all"
                        >
                          {list.note.href}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {section.trailingContent?.map((para, i) => (
                <p key={i} className="text-sm text-[#444] leading-relaxed">
                  {para}
                </p>
              ))}

              {section.contactDetails && (
                <div className="flex flex-col gap-1.5 pl-1">
                  {section.contactDetails.organisationName && (
                    <p className="text-sm text-[#444] leading-relaxed">
                      {section.contactDetails.organisationName}
                    </p>
                  )}
                  {section.contactDetails.email && (
                    <a
                      href={`mailto:${section.contactDetails.email}`}
                      className="text-sm text-[#3875e9] leading-relaxed"
                    >
                      {section.contactDetails.email}
                    </a>
                  )}
                  {section.contactDetails.website && (
                    <a
                      href={section.contactDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#3875e9] leading-relaxed"
                    >
                      {section.contactDetails.website}
                    </a>
                  )}
                  {section.contactDetails.address && (
                    <p className="text-sm text-[#444] leading-relaxed">
                      {section.contactDetails.address}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
