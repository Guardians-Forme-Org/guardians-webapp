"use client";

import { X } from "lucide-react";
import type { UserLocation } from "@/lib/types/auth";

type Props = {
  location: UserLocation;
  onClose: () => void;
};

export default function LocationSheet({ location, onClose }: Props) {
  const displayAddress =
    location.formattedAddress ||
    location.address ||
    [location.suburb, location.city, location.province].filter(Boolean).join(", ") ||
    "—";

  const coords =
    location.latitude != null && location.longitude != null
      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      : null;

  const rows: { label: string; value: string }[] = [
    { label: "Address",     value: displayAddress },
    ...(location.city     ? [{ label: "City",     value: location.city }]     : []),
    ...(location.province ? [{ label: "Province", value: location.province }] : []),
    ...(location.country  ? [{ label: "Country",  value: location.country }]  : []),
    ...(coords            ? [{ label: "Coordinates", value: coords }]          : []),
    ...(location.what3words ? [{ label: "What3Words", value: location.what3words }] : []),
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] pb-safe-nav">
        <div className="absolute left-1/2 -translate-x-1/2 top-3 w-10 h-1 rounded-full bg-[#e0e0e0]" />

        <div className="flex items-center justify-between px-7.5 pt-5 pb-4">
          <p className="text-base font-semibold text-black mt-3">Location</p>
          <button onClick={onClose} aria-label="Close" className="text-text-muted mt-3">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col divide-y divide-progress-track px-7.5 pb-8">
          {rows.map(({ label, value }) => (
            <div key={label} className="py-4">
              <p className="text-xs text-text-muted mb-1">{label}</p>
              <p className="text-base text-black">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
