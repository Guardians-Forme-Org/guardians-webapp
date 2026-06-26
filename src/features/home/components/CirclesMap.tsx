"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useCircles } from "@/lib/hooks/circles";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef } from "react";

export default function CirclesMap() {
  const { data: circles = [], isLoading } = useCircles();
  const mapRef = useRef<HTMLDivElement>(null);

  const coords = useMemo(
    () =>
      circles
        .filter(
          (c) =>
            c.region &&
            (Math.abs(c.region.latitude) > 0.001 ||
              Math.abs(c.region.longitude) > 0.001),
        )
        .map((c) => ({ lat: c.region.latitude, lng: c.region.longitude })),
    [circles],
  );

  useEffect(() => {
    if (!mapRef.current || coords.length === 0) return;

    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      v: "weekly",
    });

    importLibrary("maps").then(({ Map }) => {
      if (!mapRef.current) return;

      const map = new Map(mapRef.current, {
        center: coords[0],
        zoom: 8,
        disableDefaultUI: true,
        gestureHandling: "none",
        keyboardShortcuts: false,
      });

      const iconUrl =
        window.location.origin +
        "/images/Guardians%20Logo-logo.png";

      coords.forEach(({ lat, lng }) => {
        new google.maps.Marker({
          position: { lat, lng },
          map,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 14),
          },
        });
      });

      if (coords.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        coords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, 40);
      }
    });
  }, [coords]);

  if (isLoading) {
    return <Skeleton className="mx-5 h-[220px] rounded-[12px]" />;
  }

  if (coords.length === 0) return null;

  return (
    <div className="mx-5 rounded-[12px] overflow-hidden border border-[#e8e8e8] h-[220px] fade-up">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
