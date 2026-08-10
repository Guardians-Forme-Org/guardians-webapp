import { useQueryClient } from "@tanstack/react-query";
import { importLibrary } from "@googlemaps/js-api-loader";
import { extractLocation, type LocationResult } from "@/components/ui/LocationPicker";

// Let the browser reuse a recent GPS fix instead of powering up the radio
const POSITION_MAX_AGE_MS = 30_000;
// 4 decimals ≈ 11 m — the browser GPS noise floor; a new fix inside the
// same cell counts as "hasn't moved"
const COORD_PRECISION = 4;
const GEOCODE_STALE_MS = 10 * 60_000;

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: POSITION_MAX_AGE_MS,
    });
  });
}

// Resolves the device position to a LocationResult. The reverse geocode is
// cached per coordinate cell, so repeated lookups from the same spot (e.g.
// filling several anchor points in a row) hit the Geocoder only once.
export function useCurrentLocation() {
  const queryClient = useQueryClient();

  return async (): Promise<LocationResult> => {
    const pos = await getPosition();
    const lat = Number(pos.coords.latitude.toFixed(COORD_PRECISION));
    const lng = Number(pos.coords.longitude.toFixed(COORD_PRECISION));
    return queryClient.fetchQuery({
      queryKey: ["reverseGeocode", lat, lng],
      staleTime: GEOCODE_STALE_MS,
      gcTime: GEOCODE_STALE_MS,
      queryFn: async () => {
        const { Geocoder } = await importLibrary("geocoding");
        const { results } = await new Geocoder().geocode({ location: { lat, lng } });
        const result = results?.[0] ? extractLocation(results[0]) : null;
        if (!result) throw new Error("No geocoding result");
        return result;
      },
    });
  };
}
