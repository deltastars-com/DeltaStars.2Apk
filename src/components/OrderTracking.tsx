import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useAdvancedMarkerRef, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup as LeafletPopup, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from './lib/contexts/I18nContext';
import { db, doc, onSnapshot, setDoc } from '../firebase';

// Fix for default Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyLeafletMarker = LeafletMarker as any;
const AnyLeafletPopup = LeafletPopup as any;

interface Location {
  lat: number;
  lng: number;
}

interface OrderTrackingProps {
  driverId?: string;
  initialDriverLocation?: Location;
  customerLocation?: Location;
  onLocationUpdate?: (driverLoc: Location, distanceMeters: number) => void;
}

// Recenter helper component for Leaflet
const LeafletRecenter = ({ position }: { position: [number, number] }) => {
  const map = useLeafletMap();
  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true });
    }
  }, [position, map]);
  return null;
};

// Route display helper for Google Maps using Routes API with safe fallback
const RouteDisplay = ({ origin, destination }: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const lastRequestTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Rate-limit Route calculation to save API costs
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 8000) {
      return;
    }
    lastRequestTimeRef.current = now;

    // Clear previous route polylines
    polylinesRef.current.forEach(p => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#059669', // Emerald/Delta Green
            strokeWeight: 5,
            strokeOpacity: 0.8,
            clickable: false
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
      }
    }).catch(err => {
      console.warn("Routes API failed, drawing simple direct line:", err);
      // Fallback: draw a direct polyline between driver and destination
      const directPolyline = new google.maps.Polyline({
        path: [origin, destination],
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        clickable: false
      });
      directPolyline.setMap(map);
      polylinesRef.current = [directPolyline];
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
};

const GoogleMap = Map as any;

export const OrderTracking: React.FC<OrderTrackingProps> = ({ 
  driverId = 'driver-default', 
  initialDriverLocation, 
  customerLocation,
  onLocationUpdate
}) => {
  const { language, t } = useI18n();
  const [currentDriverLocation, setCurrentDriverLocation] = useState<Location>({
    lat: initialDriverLocation?.lat || 21.5433,
    lng: initialDriverLocation?.lng || 39.1728
  });
  
  const destLocation = customerLocation || { lat: 21.5833, lng: 39.2128 };

  useEffect(() => {
    if (onLocationUpdate) {
      const R = 6371e3; // Earth radius in meters
      const phi1 = (currentDriverLocation.lat * Math.PI) / 180;
      const phi2 = (destLocation.lat * Math.PI) / 180;
      const deltaPhi = ((destLocation.lat - currentDriverLocation.lat) * Math.PI) / 180;
      const deltaLambda = ((destLocation.lng - currentDriverLocation.lng) * Math.PI) / 180;

      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = R * c;

      onLocationUpdate(currentDriverLocation, distanceMeters);
    }
  }, [currentDriverLocation.lat, currentDriverLocation.lng, destLocation.lat, destLocation.lng, onLocationUpdate]);
  const defaultPosition: [number, number] = [21.4858, 39.1925]; // Jeddah Center

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSharingLiveGPS, setIsSharingLiveGPS] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [simStep, setSimStep] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  // Google Maps API Key resolution
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

  // Dynamic heading / direction calculation for animated vehicle rotation
  const prevLocRef = useRef<Location>(currentDriverLocation);
  const [heading, setHeading] = useState<number>(45);

  useEffect(() => {
    if (prevLocRef.current.lat !== currentDriverLocation.lat || prevLocRef.current.lng !== currentDriverLocation.lng) {
      const lat1 = (prevLocRef.current.lat * Math.PI) / 180;
      const lat2 = (currentDriverLocation.lat * Math.PI) / 180;
      const dLng = ((currentDriverLocation.lng - prevLocRef.current.lng) * Math.PI) / 180;

      const y = Math.sin(dLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      const brng = (Math.atan2(y, x) * 180) / Math.PI;
      const calculatedHeading = (brng + 360) % 360;

      if (Math.abs(prevLocRef.current.lat - currentDriverLocation.lat) > 0.00001 || Math.abs(prevLocRef.current.lng - currentDriverLocation.lng) > 0.00001) {
        setHeading(Math.round(calculatedHeading));
      }
      prevLocRef.current = currentDriverLocation;
    }
  }, [currentDriverLocation.lat, currentDriverLocation.lng]);

  // Leaflet custom marker icons with rotation
  const driverLeafletIcon = L.divIcon({
    html: `
      <div style="position:relative;">
        <div style="position:absolute; inset:-8px; background:rgba(16,185,129,0.3); border-radius:50%; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="transform: rotate(${heading}deg); transition: transform 0.5s ease-out; width:50px; height:50px; background:linear-gradient(135deg, #065f46, #10b981); border: 3px solid #ffffff; color:#fff; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:24px; box-shadow:0 10px 25px rgba(5,150,105,0.5);">
          🚚
        </div>
        <div style="position:absolute; top:54px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.9); color:#fff; font-size:10px; font-weight:900; padding:3px 10px; border-radius:99px; white-space:nowrap; border:1px solid rgba(16,185,129,0.5); font-family:Tajawal, sans-serif;">
          ${language === 'ar' ? 'مندوب نجوم دلتا 🚚' : 'Delta Courier 🚚'}
        </div>
      </div>
    `,
    className: '',
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });

  const customerLeafletIcon = L.divIcon({
    html: `<div style="background:#eab308; border: 3px solid #ffffff; color:#fff; border-radius:50%; width:44px; height:44px; display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 10px 25px rgba(234,179,8,0.3);">🏠</div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  // Write driver location to Firestore
  const updateDriverLocationInFirestore = async (lat: number, lng: number) => {
    try {
      const docRef = doc(db, 'drivers', driverId);
      const timeStr = new Date().toISOString();
      await setDoc(docRef, {
        id: driverId,
        name: language === 'ar' ? "مندوب نجوم دلتا الفائق" : "Delta Stars Premium Courier",
        status: "online",
        location: { lat, lng },
        updatedAt: timeStr
      }, { merge: true });
      setLastSavedTime(new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US'));
    } catch (err) {
      console.warn("Failed writing driver location to Firestore (offline mode or rules restriction):", err);
    }
  };

  // 1. Subscribe to real-time updates from Firebase Firestore
  useEffect(() => {
    if (!driverId) return;

    // Initialize initial location document in Firestore if not present
    updateDriverLocationInFirestore(currentDriverLocation.lat, currentDriverLocation.lng);

    const docRef = doc(db, 'drivers', driverId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.location?.lat && data?.location?.lng) {
          setCurrentDriverLocation({
            lat: Number(data.location.lat),
            lng: Number(data.location.lng)
          });
          if (data.updatedAt) {
            const timeObj = new Date(data.updatedAt);
            setLastSavedTime(timeObj.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US'));
          }
        }
      }
    }, (error) => {
      console.error("Firebase Firestore onSnapshot error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [driverId]);

  // 2. Auto-Transit Path Simulation
  useEffect(() => {
    if (!isSimulating) return;

    const startLat = initialDriverLocation?.lat || 21.5433;
    const startLng = initialDriverLocation?.lng || 39.1728;
    const destLat = destLocation.lat;
    const destLng = destLocation.lng;

    // Generate path array
    const steps = 20;
    const routePoints: Location[] = [];
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      routePoints.push({
        lat: startLat + (destLat - startLat) * fraction + Math.sin(fraction * Math.PI) * 0.003,
        lng: startLng + (destLng - startLng) * fraction
      });
    }

    const simInterval = setInterval(() => {
      setSimStep((prevStep) => {
        const nextStep = prevStep + 1;
        if (nextStep < routePoints.length) {
          const nextLoc = routePoints[nextStep];
          updateDriverLocationInFirestore(nextLoc.lat, nextLoc.lng);
          return nextStep;
        } else {
          // Restart path loop
          const resetLoc = routePoints[0];
          updateDriverLocationInFirestore(resetLoc.lat, resetLoc.lng);
          return 0;
        }
      });
    }, 3000);

    return () => {
      clearInterval(simInterval);
    };
  }, [isSimulating, initialDriverLocation, destLocation]);

  // 3. Live Browser Geolocation Sharing
  const toggleLiveGPS = () => {
    if (isSharingLiveGPS) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsSharingLiveGPS(false);
    } else {
      setIsSimulating(false); // Stop transit simulation
      setIsSharingLiveGPS(true);
      
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            updateDriverLocationInFirestore(latitude, longitude);
          },
          (err) => {
            console.error("Live GPS failed:", err);
            setIsSharingLiveGPS(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        alert(language === 'ar' ? 'متصفحك لا يدعم تحديد الموقع' : 'Your browser does not support geolocation.');
        setIsSharingLiveGPS(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Simulation and Sync Dashboard Panel */}
      <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-sovereign border-2 border-primary/20 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating || isSharingLiveGPS ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isSimulating || isSharingLiveGPS ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <h3 className="font-black text-xl tracking-tight">
              {language === 'ar' ? 'بوابة التتبع المباشر من قاعدة البيانات' : 'Real-time Database Tracking Node'}
            </h3>
          </div>
          <p className="text-gray-400 text-sm">
            {language === 'ar' 
              ? `مستند المندوب الفعلي: /drivers/${driverId} | آخر تحديث: ${lastSavedTime || 'جاري الاتصال...'}`
              : `Active path: /drivers/${driverId} | Last Sync: ${lastSavedTime || 'Connecting...'}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Transit Simulation Toggle */}
          <button
            onClick={() => {
              setIsSharingLiveGPS(false);
              setIsSimulating(!isSimulating);
            }}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 ${
              isSimulating 
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                : 'bg-primary text-white hover:bg-primary-hover shadow-lg'
            }`}
          >
            <span>✨</span>
            {isSimulating 
              ? (language === 'ar' ? 'إيقاف حركة المحاكاة' : 'Stop Transit Simulation') 
              : (language === 'ar' ? 'بدء محاكاة حركة المندوب' : 'Simulate Driver Transit')}
          </button>

          {/* Real Geolocation Share Toggle */}
          <button
            onClick={toggleLiveGPS}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 ${
              isSharingLiveGPS 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <span>📍</span>
            {isSharingLiveGPS 
              ? (language === 'ar' ? 'إيقاف مشاركة موقعك الفعلي' : 'Stop Sharing My GPS') 
              : (language === 'ar' ? 'مشاركة موقعي الفعلي للمندوب' : 'Share My Live GPS')}
          </button>

          {/* Reset position */}
          <button
            onClick={() => {
              setIsSimulating(false);
              setIsSharingLiveGPS(false);
              setSimStep(0);
              const initialLat = initialDriverLocation?.lat || 21.5433;
              const initialLng = initialDriverLocation?.lng || 39.1728;
              updateDriverLocationInFirestore(initialLat, initialLng);
            }}
            className="bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl font-black text-sm transition-all"
          >
            {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Map View Frame */}
      <div className="h-[520px] w-full rounded-[2.5rem] overflow-hidden shadow-sovereign border-4 border-white/50 relative group bg-gray-100">
        
        {/* Absolute Branding Overlay */}
        <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-start pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-xl border border-white/15">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="font-black text-base">
                {language === 'ar' ? 'تحديد الخرائط الذكي من دلتا ستارز' : 'Delta Stars Intelligent Tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Render Mode: Google Maps vs Leaflet Fallback */}
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            {/* @ts-ignore */}
            <GoogleMap
              center={{ lat: currentDriverLocation.lat, lng: currentDriverLocation.lng }}
              zoom={13}
              mapId="DEMO_MAP_ID"
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              {/* Live routing line */}
              <RouteDisplay 
                origin={{ lat: currentDriverLocation.lat, lng: currentDriverLocation.lng }} 
                destination={{ lat: destLocation.lat, lng: destLocation.lng }} 
              />

              {/* Driver Marker */}
              <AdvancedMarker 
                position={{ lat: currentDriverLocation.lat, lng: currentDriverLocation.lng }}
                title={language === 'ar' ? "مندوب نجوم دلتا" : "Delta Stars Driver"}
              >
                <div className="relative group/vehicle cursor-pointer">
                  {/* Radar pulse aura */}
                  <div className="absolute -inset-3 bg-emerald-500/30 rounded-full animate-ping pointer-events-none"></div>
                  <div className="absolute -inset-1.5 bg-emerald-400/40 rounded-full animate-pulse pointer-events-none"></div>

                  {/* Main Vehicle Icon Container with dynamic rotation */}
                  <div 
                    style={{ 
                      transform: `rotate(${heading}deg)`,
                      transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    className="w-14 h-14 bg-gradient-to-tr from-emerald-900 via-emerald-600 to-green-500 rounded-2xl border-2 border-white shadow-[0_10px_30px_rgba(5,150,105,0.6)] flex items-center justify-center relative z-10 hover:scale-110 transition-transform"
                  >
                    {/* Direction arrow badge */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] border-b-amber-400 drop-shadow-md"></div>

                    {/* Delivery Vehicle Icon */}
                    <span className="text-2xl filter drop-shadow-md select-none">🚚</span>
                  </div>

                  {/* Floating Live Telemetry Badge */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-xl border border-emerald-400/50 flex items-center gap-1.5 z-20 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{language === 'ar' ? 'سائق دلتا (تتبع حي 45 كم/س)' : 'Delta Driver (Live 45 km/h)'}</span>
                  </div>
                </div>
              </AdvancedMarker>

              {/* Customer Marker */}
              <AdvancedMarker 
                position={{ lat: destLocation.lat, lng: destLocation.lng }}
                title={language === 'ar' ? "موقع التوصيل" : "Delivery Location"}
              >
                <div style={{ width: '50px', height: '50px', background: '#eab308', border: '3px solid #ffffff', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 10px 25px rgba(234,179,8,0.4)' }} className="hover:scale-110 transition-transform cursor-pointer">
                  🏠
                </div>
              </AdvancedMarker>
            </GoogleMap>
          </APIProvider>
        ) : (
          /* Robust Fallback using OpenStreetMap Leaflet (Includes helpful setup tutorial drawer inside the map UI) */
          <div className="w-full h-full relative">
            <AnyMapContainer 
              center={customerLocation ? [destLocation.lat, destLocation.lng] : [currentDriverLocation.lat, currentDriverLocation.lng]} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              zoomControl={false}
            >
              <AnyTileLayer 
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              <LeafletRecenter position={[currentDriverLocation.lat, currentDriverLocation.lng]} />
              
              {/* Driver Leaflet Marker */}
              <AnyLeafletMarker position={[currentDriverLocation.lat, currentDriverLocation.lng]} icon={driverLeafletIcon}>
                <AnyLeafletPopup className="font-tajawal">
                  <div className="text-center p-2">
                    <p className="font-black text-emerald-800">
                      {language === 'ar' ? 'مندوب نجوم دلتا 🚚' : 'Delta Stars Driver 🚚'}
                    </p>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {language === 'ar' ? 'يتحرك في المسار الأسرع' : 'Moving via fastest route'}
                    </p>
                  </div>
                </AnyLeafletPopup>
              </AnyLeafletMarker>

              {/* Customer Leaflet Marker */}
              <AnyLeafletMarker position={[destLocation.lat, destLocation.lng]} icon={customerLeafletIcon}>
                <AnyLeafletPopup className="font-tajawal">
                  <div className="text-center p-2">
                    <p className="font-black text-yellow-600">
                      {language === 'ar' ? 'موقع التسليم المعتمد 📍' : 'Authorized Delivery Location 📍'}
                    </p>
                  </div>
                </AnyLeafletPopup>
              </AnyLeafletMarker>
            </AnyMapContainer>

            {/* Google Maps Credentials Guide Badge */}
            <div className="absolute bottom-6 right-6 z-[1000] bg-amber-500/95 backdrop-blur-md text-slate-900 p-4 rounded-2xl shadow-2xl max-w-xs border border-white/20 pointer-events-auto">
              <p className="font-black text-xs flex items-center gap-1.5 text-slate-900">
                <span>⚠️</span>
                {language === 'ar' ? 'تمكين خرائط Google الكاملة:' : 'Enable Google Maps View:'}
              </p>
              <p className="text-[10px] text-slate-800 font-bold mt-1 leading-relaxed">
                {language === 'ar'
                  ? 'أضف المفتاح GOOGLE_MAPS_PLATFORM_KEY في إعدادات Secrets في الجزء العلوي الأيمن.'
                  : 'Add the GOOGLE_MAPS_PLATFORM_KEY secret in Settings -> Secrets (top right).'}
              </p>
            </div>
          </div>
        )}

        {/* Real-time Status Footer overlay */}
        <div className="absolute bottom-6 left-6 right-6 lg:right-auto z-[1000] bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl max-w-md border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🚚</span>
          </div>
          <div>
            <h4 className="font-black text-slate-950 text-sm">
              {isSimulating || isSharingLiveGPS 
                ? (language === 'ar' ? 'المندوب يتحرك الآن' : 'Agent Is Active') 
                : (language === 'ar' ? 'بانتظار التحديثات المباشرة' : 'Waiting for Updates')}
            </h4>
            <p className="text-slate-500 text-xs mt-0.5">
              {language === 'ar' 
                ? 'يتم تحديث الإحداثيات كل ٣ ثوان في Firestore تلقائياً.' 
                : 'Coordinates are synchronized in real-time.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
