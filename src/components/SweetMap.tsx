import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SYSTEM_CONFIG } from '../constants';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyMarker = Marker as any;
const AnyPopup = Popup as any;

// Fix Leaflet default icon issues in React Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SweetMapProps {
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title: string;
    description?: string;
    icon?: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (markerId: string) => void;
}

// Map controller to handle dynamic center changes for Leaflet
const LeafletMapController = ({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) => {
  const map = useLeafletMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

const GoogleMap = Map as any;

export const SweetMap: React.FC<SweetMapProps> = ({
  markers = [],
  center = { lat: 21.5433, lng: 39.1728 },
  zoom = 13,
  onMarkerClick
}) => {
  const defaultPosition: [number, number] = [center.lat, center.lng];
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  // Google Maps API Key resolution
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

  if (hasValidKey) {
    return (
      <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
        <APIProvider apiKey={API_KEY} version="weekly">
          {/* @ts-ignore */}
          <GoogleMap
            center={center}
            zoom={zoom}
            mapId="DEMO_MAP_ID"
            style={{ width: '100%', height: '100%', borderRadius: '1.5rem' }}
            disableDefaultUI={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {markers.map((marker) => {
              const isDriver = marker.id.includes('driver');
              const color = isDriver ? SYSTEM_CONFIG.PRIMARY_COLOR : SYSTEM_CONFIG.SECONDARY_COLOR;
              const emoji = isDriver ? '🚚' : '🏠';

              return (
                <AdvancedMarker
                  key={marker.id}
                  position={marker.position}
                  title={marker.title}
                  onClick={() => {
                    setActiveMarkerId(marker.id);
                    if (onMarkerClick) onMarkerClick(marker.id);
                  }}
                >
                  {marker.icon ? (
                    <img 
                      src={marker.icon} 
                      alt={marker.title} 
                      style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                      className="hover:scale-110 transition-transform cursor-pointer"
                    />
                  ) : (
                    <div 
                      style={{ 
                        background: color, 
                        border: '3px solid #ffffff', 
                        color: '#fff', 
                        borderRadius: '50%', 
                        width: '44px', 
                        height: '44px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '22px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)' 
                      }} 
                      className="hover:scale-110 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </div>
                  )}
                  {activeMarkerId === marker.id && (
                    <InfoWindow position={marker.position} onCloseClick={() => setActiveMarkerId(null)}>
                      <div className="p-2 font-tajawal text-center text-slate-950">
                        <h3 className="font-black text-sm mb-1">{marker.title}</h3>
                        {marker.description && <p className="text-xs text-gray-500">{marker.description}</p>}
                      </div>
                    </InfoWindow>
                  )}
                </AdvancedMarker>
              );
            })}
          </GoogleMap>
        </APIProvider>
      </div>
    );
  }

  // Robust Fallback using Leaflet Map
  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
      <AnyMapContainer
        center={defaultPosition}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '1.5rem', zIndex: 1 }}
        zoomControl={false}
      >
        <AnyTileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <LeafletMapController center={center} zoom={zoom} />

        {markers.map((marker) => {
          let markerIcon = undefined;
          if (marker.icon) {
            markerIcon = L.icon({
              iconUrl: marker.icon,
              iconSize: [40, 40],
              iconAnchor: [20, 40],
              popupAnchor: [0, -40]
            });
          } else {
            const isDriver = marker.id.includes('driver');
            const color = isDriver ? SYSTEM_CONFIG.PRIMARY_COLOR : SYSTEM_CONFIG.SECONDARY_COLOR;
            const emoji = isDriver ? '🚚' : '📍';
            markerIcon = L.divIcon({
              html: `<div style="background:${color}; border: 3px solid #ffffff; color:#fff; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s;" class="hover:scale-110">${emoji}</div>`,
              className: '',
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            });
          }

          return (
            <AnyMarker
              key={marker.id}
              position={[marker.position.lat, marker.position.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(marker.id);
                }
              }}
            >
              <AnyPopup>
                <div className="p-2 font-tajawal text-center">
                  <h3 className="font-black text-slate-900 text-sm mb-1">{marker.title}</h3>
                  {marker.description && <p className="text-xs text-gray-500">{marker.description}</p>}
                </div>
              </AnyPopup>
            </AnyMarker>
          );
        })}
      </AnyMapContainer>
    </div>
  );
};
