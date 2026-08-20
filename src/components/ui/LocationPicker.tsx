"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Map as MapIcon, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { useCurrentLocation } from "@/lib/hooks/location";
import MapPickerSheet from "./MapPickerSheet";

export type LocationResult = {
  placeId: string;
  city: string;
  suburb: string;
  province: string;
  country: string;
  countryCode: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

type Props = {
  defaultValue?: string;
  onSelect: (place: LocationResult) => void;
  placeholder?: string;
  className?: string;
  // Show a "use current location" button (geolocation + reverse geocode)
  showUseCurrent?: boolean;
  // Show a "pick on map" button (full-screen map sheet)
  showMapPick?: boolean;
  // Where the map sheet opens when there is already a selection
  initialCenter?: { lat: number; lng: number } | null;
};

export function extractLocation(
  place: google.maps.places.PlaceResult | google.maps.GeocoderResult,
): LocationResult | null {
  if (!place.geometry?.location) return null;

  const components = place.address_components ?? [];
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.short_name ?? "";

  return {
    placeId: place.place_id ?? "",
    city:
      get("locality") ||
      get("administrative_area_level_2") ||
      get("administrative_area_level_1"),
    suburb:
      get("sublocality_level_1") ||
      get("sublocality") ||
      get("neighborhood"),
    province: get("administrative_area_level_1"),
    country: get("country"),
    countryCode: getShort("country"),
    postalCode: get("postal_code"),
    latitude: place.geometry.location.lat(),
    longitude: place.geometry.location.lng(),
    formattedAddress: place.formatted_address ?? "",
  };
}

export default function LocationPicker({
  defaultValue = "",
  onSelect,
  placeholder,
  className,
  showUseCurrent,
  showMapPick,
  initialCenter,
}: Props) {
  const t = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [display, setDisplay] = useState(defaultValue);
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const locateCurrent = useCurrentLocation();

  // defaultValue often arrives after mount (e.g. prefilled from a fetched
  // submission, once the query resolves) — resync display so it actually
  // shows up. Only fires when the prop itself changes value, so it never
  // clobbers what the user is actively typing in between selections.
  useEffect(() => {
    setDisplay(defaultValue);
  }, [defaultValue]);

  const handleUseCurrent = async () => {
    setLocating(true);
    try {
      const result = await locateCurrent();
      setDisplay(result.formattedAddress);
      onSelectRef.current(result);
    } catch {
      toast.error(t("currentLocationFailed"));
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      v: "weekly",
    });

    let autocomplete: google.maps.places.Autocomplete;

    importLibrary("places").then(({ Autocomplete }) => {
      if (!inputRef.current) return;

      autocomplete = new Autocomplete(inputRef.current, {
        // No types restriction — Google's own "search everything" pattern.
        // "geocode" excluded establishment results entirely, so a mall,
        // building, or park (not a street address) never showed up;
        // omitting types blends addresses, cities, and places together.
        fields: ["place_id", "address_components", "geometry", "formatted_address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const result = extractLocation(place);
        if (!result) return;
        setDisplay(result.formattedAddress);
        onSelectRef.current(result);
      });
    });

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={display}
          onChange={(e) => setDisplay(e.target.value)}
          placeholder={placeholder ?? t("locationSearchDefault")}
          className={
            className ??
            "w-full h-[60px] border border-[#d9d9d9] rounded-[8px] px-4 pr-12 text-base placeholder:text-[#bfbfbf] outline-none"
          }
        />
        <MapPin
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>
      {(showUseCurrent || showMapPick) && (
        <>
          <div className="mt-2 flex items-center gap-5">
            {showUseCurrent && (
              <button
                type="button"
                onClick={handleUseCurrent}
                disabled={locating}
                className="flex items-center gap-1.5 text-sm font-semibold text-gotf-green disabled:opacity-50"
              >
                <LocateFixed size={15} />
                {locating ? t("locating") : t("useCurrentLocation")}
              </button>
            )}
            {showMapPick && (
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gotf-green"
              >
                <MapIcon size={15} />
                {t("pickOnMap")}
              </button>
            )}
          </div>
        </>
      )}
      {mapOpen && (
        <MapPickerSheet
          initialCenter={initialCenter}
          onConfirm={(result) => {
            setDisplay(result.formattedAddress);
            setMapOpen(false);
            onSelectRef.current(result);
          }}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}
