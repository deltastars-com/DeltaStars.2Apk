
import { useEffect, useState } from "react";

export interface Location {
  lat: number;
  lng: number;
}

export const useLiveLocation = (options?: PositionOptions) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
        console.error("Location Error:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
        ...options
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options]);

  return { location, error };
};

export const useLiveLocationCallback = (onUpdate: (loc: Location) => void) => {
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onUpdate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error(err),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onUpdate]);
};
