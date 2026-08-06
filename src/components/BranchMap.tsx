import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BRANCH_LOCATIONS } from '../constants';
import { nearestBranch, distanceKm, deliveryFeeByDistance } from '../services/mapsService';
import type { LatLng } from '../services/mapsService';

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyMarker = Marker as any;
const AnyPopup = Popup as any;

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const branchIcon = L.divIcon({
  html: `<div style="background:#2d5a27;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏪</div>`,
  className: '', iconSize: [32, 32], iconAnchor: [16, 16],
});
const userIcon = L.divIcon({
  html: `<div style="background:#ca8a04;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.4)">📍</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});

function FlyToUser({ pos }: { pos: LatLng }) {
  const map = useMap();
  useEffect(() => { map.flyTo([pos.lat, pos.lng], 13, { duration: 1.2 }); }, [pos, map]);
  return null;
}

interface BranchMapProps {
  onBranchSelect?: (branch: any, fee: number) => void;
  lang?: 'ar' | 'en';
  address?: string;
  initialLocation?: { lat: number; lng: number };
  onLocationSelect?: (loc: { lat: number; lng: number }) => void;
  isEditable?: boolean;
}

const BranchMap: React.FC<BranchMapProps> = ({ 
  onBranchSelect, 
  lang = 'ar', 
  address, 
  initialLocation, 
  onLocationSelect, 
  isEditable 
}) => {
  const [userPos, setUserPos] = useState<LatLng | null>(initialLocation || null);
  const [nearestBr, setNearestBr] = useState<any>(null);
  const [fee, setFee] = useState<number>(0);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setUserPos(initialLocation);
    }
  }, [initialLocation]);

  const locateUser = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(loc);
        if (onLocationSelect) {
          onLocationSelect(loc);
        }
        const nearest = nearestBranch(loc, BRANCH_LOCATIONS as any);
        if (nearest) {
          const km = distanceKm(loc, { lat: nearest.lat, lng: nearest.lng });
          const deliveryFee = deliveryFeeByDistance(km);
          setNearestBr(nearest);
          setFee(deliveryFee);
          onBranchSelect?.(nearest, deliveryFee);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-emerald-100">
      <div className="bg-emerald-700 text-white p-3 flex items-center justify-between">
        <span className="font-bold">{lang === 'ar' ? '🗺️ خريطة الفروع' : '🗺️ Branch Map'}</span>
        <button type="button" onClick={locateUser} disabled={locating}
          className="bg-white text-emerald-700 text-sm px-3 py-1 rounded-lg font-semibold hover:bg-emerald-50 transition">
          {locating ? '⏳' : lang === 'ar' ? '📍 تحديد موقعي' : '📍 My Location'}
        </button>
      </div>

      {nearestBr && (
        <div className="bg-emerald-50 p-3 text-sm text-emerald-800 border-b border-emerald-100">
          <strong>أقرب فرع:</strong> {lang === 'ar' ? nearestBr.name_ar : nearestBr.name_en}
          {' — '}رسوم التوصيل: {fee === 0 ? '🎉 مجاني' : `${fee} ريال`}
        </div>
      )}

      {address && (
        <div className="bg-emerald-50 p-3 text-sm text-emerald-800 border-b border-emerald-100 font-tajawal">
          <strong>العنوان المحدد:</strong> {address}
        </div>
      )}

      <AnyMapContainer
        center={userPos ? [userPos.lat, userPos.lng] : [24.7136, 46.6753]}
        zoom={userPos ? 12 : 5}
        style={{ height: 320 }}
        scrollWheelZoom={false}
      >
        <AnyTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        {userPos && <FlyToUser pos={userPos} />}
        {userPos && (
          <AnyMarker position={[userPos.lat, userPos.lng]} icon={userIcon}>
            <AnyPopup>{lang === 'ar' ? 'الموقع المحدد' : 'Selected Location'}</AnyPopup>
          </AnyMarker>
        )}
        {BRANCH_LOCATIONS.map((b) => (
          <AnyMarker key={b.id} position={[b.lat, b.lng]} icon={branchIcon}>
            <AnyPopup>
              <div className="text-center">
                <strong>{lang === 'ar' ? b.name_ar : b.name_en}</strong><br />
                <small>{lang === 'ar' ? b.address_ar : b.address_en}</small>
              </div>
            </AnyPopup>
          </AnyMarker>
        ))}
      </AnyMapContainer>
    </div>
  );
};

export default BranchMap;
