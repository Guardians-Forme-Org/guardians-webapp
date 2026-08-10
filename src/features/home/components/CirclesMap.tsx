"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useCircles } from "@/lib/hooks/circles";
import { api } from "@/lib/api";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { ApiCircle } from "@/lib/types/circles";

type Labels = { guardians: string; challenges: string };

function buildInfoContent(circle: ApiCircle, labels: Labels) {
  const location = [circle.region.city, circle.region.country]
    .filter(Boolean)
    .join(", ");
  const guardianCount = circle.membersCount?.total ?? 0;
  const challengeCount = circle.challenges?.length ?? 0;

  return `<div style="font-family:sans-serif;padding:2px 4px;min-width:140px">
    <a href="/circles/${circle.circleId}" style="font-size:14px;font-weight:600;color:#3875e9;text-decoration:underline">${circle.name}</a>
    ${location ? `<br/><span style="font-size:12px;color:#666">${location}</span>` : ""}
    <div style="display:flex;gap:12px;margin-top:6px">
      <span style="font-size:12px;color:#444">${guardianCount} ${labels.guardians}</span>
      <span style="font-size:12px;color:#444">${challengeCount} ${labels.challenges}</span>
    </div>
  </div>`;
}

export default function CirclesMap() {
  const { data: circles = [], isLoading } = useCircles();
  const t = useTranslations("circles");
  const labelsRef = useRef<Labels>({ guardians: t("guardians"), challenges: t("challenges") });
  labelsRef.current = { guardians: t("guardians"), challenges: t("challenges") };
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const pinned = useMemo(
    () =>
      circles.filter(
        (c) =>
          c.region &&
          (Math.abs(c.region.latitude) > 0.001 ||
            Math.abs(c.region.longitude) > 0.001),
      ),
    [circles],
  );

  useEffect(() => {
    if (!mapRef.current || pinned.length === 0) return;

    let cancelled = false;

    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      v: "weekly",
    });

    importLibrary("maps").then(({ Map, InfoWindow }) => {
      if (cancelled || !mapRef.current) return;

      const map = new Map(mapRef.current, {
        center: { lat: pinned[0].region.latitude, lng: pinned[0].region.longitude },
        zoom: 4,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "cooperative",
        keyboardShortcuts: false,
      });
      mapInstanceRef.current = map;

      const iconUrl =
        window.location.origin + "/images/Guardians%20Logo-logo.png";

      const infoWindow = new InfoWindow();

      pinned.forEach((circle) => {
        const position = { lat: circle.region.latitude, lng: circle.region.longitude };
        const marker = new google.maps.Marker({
          position,
          map,
          title: circle.name,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 14),
          },
        });

        marker.addListener("click", async () => {
          sessionStorage.setItem("gotf_refetch_home", "1");
          infoWindow.setContent(buildInfoContent(circle, labelsRef.current));
          infoWindow.open({ anchor: marker, map });

          try {
            const full = await api.get<ApiCircle>(`/circles/${circle.circleId}`);
            const merged = { ...full, membersCount: circle.membersCount ?? full.membersCount };
            infoWindow.setContent(buildInfoContent(merged, labelsRef.current));
          } catch {
            // keep the basic info already showing
          }
        });
      });

      if (pinned.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        pinned.forEach((c) =>
          bounds.extend({ lat: c.region.latitude, lng: c.region.longitude }),
        );
        map.fitBounds(bounds, 40);
      }
    });

    return () => {
      cancelled = true;
      mapInstanceRef.current = null;
    };
  }, [pinned]);

  if (isLoading) {
    return <Skeleton className="mx-5 h-[220px] rounded-[12px]" />;
  }

  if (pinned.length === 0) return null;

  return (
    <div className="mx-5 rounded-[12px] overflow-hidden border border-[#e8e8e8] h-[220px] fade-up">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
