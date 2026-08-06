import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useI18n } from './contexts/I18nContext';
import api from '@/services/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '2rem'
};

interface FleetRadarProps {
  orderId: string;
  apiKey: string;
}

export const FleetRadar: React.FC<FleetRadarProps> = ({ orderId, apiKey }) => {
  const { language } = useI18n();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  useEffect(() => {
    let unsubscribe: () => void;

    const initTracking = async () => {
      const shipment = await api.getShipmentTracking(orderId);
      if (shipment && shipment.delivery_agents) {
        setDriverInfo(shipment.delivery_agents);
        if (shipment.current_lat && shipment.current_lng) {
          setLocation({ lat: shipment.current_lat, lng: shipment.current_lng });
        }
      }

      unsubscribe = api.subscribeToDriverLocation(orderId, (payload) => {
        setLocation({ lat: payload.lat, lng: payload.lng });
      });
    };

    initTracking();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId]);

  if (!isLoaded) return <div className="h-[400px] bg-gray-100 animate-pulse rounded-[2rem] flex items-center justify-center font-black text-gray-400 uppercase tracking-widest">Loading Satellite Feed...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sovereign border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl">🚚</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{language === 'ar' ? 'تتبع طلبك اللحظي' : 'Real-time Tracking'}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID: #{orderId}</p>
          </div>
        </div>
        {driverInfo && (
          <div className="text-right">
            <p className="text-xs font-black text-secondary uppercase tracking-widest">{language === 'ar' ? 'السائق' : 'Driver'}</p>
            <p className="font-black text-primary">{driverInfo.full_name || driverInfo.name}</p>
          </div>
        )}
      </div>

      <div className="relative group">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location || { lat: 24.7136, lng: 46.6753 }} // Default to Riyadh
          zoom={13}
          options={{
            styles: [
              {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#ffffff" }]
              },
              {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#000000" }, { "lightness": 13 }]
              },
              {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
              },
              {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
              },
              {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{ "color": "#000000" }, { "lightness": 21 }]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{ "color": "#000000" }, { "lightness": 17 }]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#000000" }, { "lightness": 29 }, { "weight": 0.2 }]
              },
              {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [{ "color": "#000000" }, { "lightness": 18 }]
              },
              {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [{ "color": "#000000" }, { "lightness": 16 }]
              },
              {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{ "color": "#000000" }, { "lightness": 19 }]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#000000" }, { "lightness": 17 }]
              }
            ],
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {location && (
            <Marker
              position={location}
              onClick={() => setShowInfo(true)}
              icon={{
                url: 'https://cdn-icons-png.flaticon.com/512/2965/2965306.png', // Delivery truck icon
                scaledSize: new window.google.maps.Size(50, 50)
              }}
            />
          )}

          {showInfo && location && (
            <InfoWindow
              position={location}
              onCloseClick={() => setShowInfo(false)}
            >
              <div className="p-2 text-right">
                <p className="font-black text-primary">{language === 'ar' ? 'طلبك في الطريق!' : 'Your order is on the way!'}</p>
                <p className="text-xs text-gray-500">{language === 'ar' ? 'يتم التحديث لحظياً' : 'Updating in real-time'}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Satellite Feed Active</span>
          </div>
          <button onClick={() => window.location.reload()} className="text-[10px] font-black text-secondary uppercase hover:underline">Refresh Feed</button>
        </div>
      </div>
    </div>
  );
};
