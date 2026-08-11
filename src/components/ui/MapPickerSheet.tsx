"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { importLibrary } from "@googlemaps/js-api-loader";
import { extractLocation, type LocationResult } from "./LocationPicker";

type Props = {
  initialCenter?: { lat: number; lng: number } | null;
  onConfirm: (place: LocationResult) => void;
  onClose: () => void;
};

const WORLD_VIEW = { center: { lat: 20, lng: 0 }, zoom: 2 };
const PICK_ZOOM = 17;

export default function MapPickerSheet({ initialCenter, onConfirm, onClose }: Props) {
  const t = useTranslations("common");
  const mapDivRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<{ lat: number; lng: number } | null>(initialCenter ?? null);
  const geocodeSeq = useRef(0);

  const [picked, setPicked] = useState<LocationResult | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let map: google.maps.Map | undefined;
    let geocoder: google.maps.Geocoder | undefined;
    let cancelled = false;

    const resolveCenter = (): Promise<{ center: { lat: number; lng: number }; zoom: number }> => {
      if (initialCenter) return Promise.resolve({ center: initialCenter, zoom: PICK_ZOOM });
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(WORLD_VIEW);
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              zoom: PICK_ZOOM,
            }),
          () => resolve(WORLD_VIEW),
          { enableHighAccuracy: true, timeout: 5000 },
        );
      });
    };

    const reverseGeocode = async (center: { lat: number; lng: number }) => {
      if (!geocoder) return;
      const seq = ++geocodeSeq.current;
      setResolving(true);
      try {
        const { results } = await geocoder.geocode({ location: center });
        if (cancelled || seq !== geocodeSeq.current) return;
        const result = results?.[0] ? extractLocation(results[0]) : null;
        // Keep the exact picked coordinates, not the geocoder's snapped ones
        setPicked(
          result
            ? { ...result, latitude: center.lat, longitude: center.lng }
            : coordsOnlyResult(center),
        );
      } catch {
        if (!cancelled && seq === geocodeSeq.current) setPicked(coordsOnlyResult(center));
      } finally {
        if (!cancelled && seq === geocodeSeq.current) setResolving(false);
      }
    };

    Promise.all([importLibrary("maps"), importLibrary("geocoding"), resolveCenter()]).then(
      ([{ Map }, { Geocoder }, view]) => {
        if (cancelled || !mapDivRef.current) return;
        geocoder = new Geocoder();
        map = new Map(mapDivRef.current, {
          ...view,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        map.addListener("idle", () => {
          const c = map?.getCenter();
          if (!c) return;
          centerRef.current = { lat: c.lat(), lng: c.lng() };
          reverseGeocode(centerRef.current);
        });
      },
    );

    return () => {
      cancelled = true;
      if (map) google.maps.event.clearInstanceListeners(map);
    };
  }, [initialCenter]);

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <p className="text-base font-semibold text-text-primary">{t("pickOnMap")}</p>
        <button
          onClick={onClose}
          className="size-8 rounded-full bg-[#f0efeb] flex items-center justify-center"
          aria-label={t("close")}
        >
          <X size={16} className="text-text-primary" />
        </button>
      </div>

      <div className="relative flex-1">
        <div ref={mapDivRef} className="absolute inset-0" />
        {/* Fixed center pin — the map pans underneath it */}
        <MapPin
          size={36}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-gotf-green pointer-events-none drop-shadow"
          fill="currentColor"
          strokeWidth={1}
        />
      </div>

      <div className="px-5 pb-8 pt-4 shrink-0 flex flex-col gap-3">
        <p className="text-sm text-text-secondary truncate min-h-5">
          {resolving ? t("locating") : picked?.formattedAddress ?? ""}
        </p>
        <button
          onClick={() => picked && onConfirm(picked)}
          disabled={!picked || resolving}
          className="w-full h-14 bg-black text-white rounded-full text-xl font-medium disabled:opacity-50"
        >
          {t("confirmLocation")}
        </button>
      </div>
    </div>
  );
}

function coordsOnlyResult(center: { lat: number; lng: number }): LocationResult {
  return {
    placeId: "",
    city: "",
    suburb: "",
    province: "",
    country: "",
    countryCode: "",
    postalCode: "",
    latitude: center.lat,
    longitude: center.lng,
    formattedAddress: `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`,
  };
}
