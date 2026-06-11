"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

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
};

function extractLocation(place: google.maps.places.PlaceResult): LocationResult | null {
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
  placeholder = "Search for a location",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [display, setDisplay] = useState(defaultValue);

  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      v: "weekly",
    });

    let autocomplete: google.maps.places.Autocomplete;

    importLibrary("places").then(({ Autocomplete }) => {
      if (!inputRef.current) return;

      autocomplete = new Autocomplete(inputRef.current, {
        types: ["geocode"],
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
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={display}
        onChange={(e) => setDisplay(e.target.value)}
        placeholder={placeholder}
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
  );
}
