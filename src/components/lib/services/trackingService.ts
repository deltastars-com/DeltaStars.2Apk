// Tracking service — works on web AND native (Capacitor)

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export async function getCurrentPosition(): Promise<LocationCoords> {
  // Try Capacitor native first (only when running in app)
  const isNative = !!(typeof window !== 'undefined' && (window as any).Capacitor?.isNative);
  if (isNative) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed ?? undefined,
        heading: pos.coords.heading ?? undefined,
      };
    } catch {}
  }
  // Fallback: Web Geolocation API
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => resolve({
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        accuracy: p.coords.accuracy,
        speed: p.coords.speed ?? undefined,
        heading: p.coords.heading ?? undefined,
      }),
      e => reject(e),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  });
}

export function watchPosition(
  callback: (coords: LocationCoords) => void,
  onError?: (err: any) => void
): () => void {
  if (!navigator.geolocation) return () => {};
  const id = navigator.geolocation.watchPosition(
    p => callback({
      latitude: p.coords.latitude,
      longitude: p.coords.longitude,
      accuracy: p.coords.accuracy,
      speed: p.coords.speed ?? undefined,
      heading: p.coords.heading ?? undefined,
    }),
    onError,
    { enableHighAccuracy: true, maximumAge: 3000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}
