/**
 * Delta Stars — Google Maps & Tracking Service
 * API key from VITE_MAPS_KEY env var only.
 */

const MAPS_KEY = import.meta.env.VITE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export interface LatLng { lat: number; lng: number; }

export interface Branch {
  id: string; name_ar: string; name_en: string;
  lat: number; lng: number; address_ar: string;
}

export function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) { resolve(); return; }
    if (!MAPS_KEY) { reject(new Error('Maps key missing')); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=ar&region=SA`;
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });
}

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 +
    Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

export function nearestBranch(userLoc: LatLng, branches: Branch[]): Branch | null {
  if (!branches.length) return null;
  return branches.reduce((closest, branch) => {
    const d = distanceKm(userLoc, { lat: branch.lat, lng: branch.lng });
    const cd = distanceKm(userLoc, { lat: closest.lat, lng: closest.lng });
    return d < cd ? branch : closest;
  });
}

export function deliveryFeeByDistance(km: number): number {
  if (km <= 5)  return 0;
  if (km <= 15) return 10;
  if (km <= 30) return 20;
  return 35;
}
