"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

type TermsList = {
  label?: string;
  intro?: string;
  items: string[];
};

type ContactDetails = {
  organisationName?: string;
  email?: string;
  website?: string;
  address?: string;
};

type TermsSection = {
  number: number;
  heading: string;
  content: string[];
  lists?: TermsList[];
  trailingContent?: string[];
  contactDetails?: ContactDetails;
};

type TermsData = {
  title: string;
  lastUpdated: string;
  sections: TermsSection[];
};

export default function TermsPage() {
  const router = useRouter();
  const [data, setData] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/terms/data`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json: TermsData) => {
        // Replace unfilled [Country] placeholder until backend is updated
        const patched = JSON.parse(
          JSON.stringify(json).replace(/\[Country\]/g, "Hungary")
        );
        setData(patched);
      })
      .catch(() => setError("Could not load terms. Please try again."))
      .finally(() => setLoading(false));
  }, []);

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
            aria-label="Back"
            className="text-text-muted"
          >
            <ArrowLeft size={22} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-10 pb-16">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <p className="text-text-muted text-base">Loading…</p>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm text-center mt-10">{error}</p>
        )}

        {data && (
          <>
            <h1 className="text-[32px] font-bold text-black leading-tight mb-2">
              {data.title}
            </h1>
            <p className="text-sm text-text-muted mb-10">
              Last updated: {data.lastUpdated}
            </p>

            <div className="flex flex-col gap-8">
              {data.sections.map((section) => (
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
          </>
        )}
      </div>
    </div>
  );
}
