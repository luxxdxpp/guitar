import React, { useEffect, useRef, useState } from 'react';
import { Studio } from '../data/studios';
import { MapPin, Navigation, Star, Phone, AlertTriangle } from 'lucide-react';

interface StudioMapProps {
  studios: Studio[];
  selectedStudio: Studio | null;
  onSelectStudio: (studio: Studio) => void;
}

declare global {
  interface Window {
    naver: any;
  }
}

export default function StudioMap({
  studios,
  selectedStudio,
  onSelectStudio,
}: StudioMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const activeInfoWindowRef = useRef<any>(null);
  
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || '';

  // 1. Load Naver Map Script dynamically
  useEffect(() => {
    if (!clientId) {
      setScriptError('Naver Map Client ID is missing. Please set VITE_NAVER_MAP_CLIENT_ID in the environment settings.');
      return;
    }

    if (window.naver && window.naver.maps) {
      setScriptLoaded(true);
      return;
    }

    // Check if script is already added to document
    let script = document.getElementById('naver-map-script') as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = 'naver-map-script';
      script.type = 'text/javascript';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      // Sometimes naver.maps takes a split second to be ready on window
      if (window.naver && window.naver.maps) {
        setScriptLoaded(true);
      } else {
        // Retry shortly
        setTimeout(() => {
          if (window.naver && window.naver.maps) {
            setScriptLoaded(true);
          } else {
            setScriptError('Naver Maps SDK failed to initialize correctly.');
          }
        }, 300);
      }
    };

    const handleError = () => {
      setScriptError('Failed to load Naver Maps script. Please check your Network or Client ID.');
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      if (script) {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      }
    };
  }, [clientId]);

  // 2. Initialize Map once script is loaded
  useEffect(() => {
    if (!scriptLoaded || !mapContainerRef.current || mapRef.current) return;

    try {
      const initialCenter = new window.naver.maps.LatLng(37.5518, 126.9245);
      const map = new window.naver.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.BOTTOM_RIGHT,
        },
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Error initializing Naver Map:', err);
      setScriptError('Error initializing Naver Map instance.');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [scriptLoaded]);

  // 3. Update Markers when studios list or map changes
  useEffect(() => {
    const map = mapRef.current;
    if (!scriptLoaded || !map) return;

    // Remove old markers and close active info window
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }
    (Object.values(markersRef.current) as any[]).forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = {};

    // Add new markers
    studios.forEach((studio) => {
      const isSelected = selectedStudio?.id === studio.id;

      // Custom HTML Marker matching our aesthetic (Rose colored pin)
      const pulseHtml = isSelected
        ? `<div class="relative flex items-center justify-center w-8 h-8">
             <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-rose-400 opacity-60"></span>
             <div class="relative p-1.5 bg-rose-500 rounded-full border border-white shadow-md flex items-center justify-center">
               <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
               </svg>
             </div>
           </div>`
        : `<div class="relative flex items-center justify-center w-8 h-8 group">
             <div class="relative p-1.5 bg-slate-900 group-hover:bg-rose-500/20 border border-slate-800 group-hover:border-rose-400 rounded-full shadow-md flex items-center justify-center transition-colors duration-200">
               <svg class="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
               </svg>
             </div>
           </div>`;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(studio.latitude, studio.longitude),
        map: map,
        icon: {
          content: pulseHtml,
          size: new window.naver.maps.Size(32, 32),
          anchor: new window.naver.maps.Point(16, 16),
        },
      });

      // Custom styled Infowindow popup matching slate-900 dark theme
      const popupContent = `
        <div style="padding: 10px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); font-family: sans-serif; color: #f1f5f9; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="padding: 1px 6px; border-radius: 4px; font-size: 9px; background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #f43f5e; font-weight: bold; text-transform: uppercase;">
              ${studio.region}
            </span>
            <div style="display: flex; align-items: center; gap: 2px; color: #fbbf24; font-size: 11px; font-weight: bold;">
              ★ ${studio.rating}
            </div>
          </div>
          <h4 style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0; color: #ffffff;">${studio.name}</h4>
          <p style="font-size: 10px; color: #94a3b8; margin: 0 0 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${studio.address}</p>
          <div style="border-top: 1px solid rgba(51, 65, 85, 0.5); padding-top: 8px;">
            <a href="https://map.naver.com/v5/search/${encodeURIComponent(studio.name)}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; text-align: center; padding: 5px 0; background: #059669; color: #ffffff; font-size: 10px; font-weight: bold; border-radius: 6px; text-decoration: none; transition: background 0.2s;">
              네이버 길찾기
            </a>
          </div>
        </div>
      `;

      const infoWindow = new window.naver.maps.InfoWindow({
        content: popupContent,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        disableAnchor: true,
        pixelOffset: new window.naver.maps.Point(0, -10),
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        onSelectStudio(studio);
        
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        infoWindow.open(map, marker);
        activeInfoWindowRef.current = infoWindow;
      });

      markersRef.current[studio.id] = marker;
    });

    // Auto-fit bounds if we have studios
    if (studios.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      studios.forEach((studio) => {
        bounds.extend(new window.naver.maps.LatLng(studio.latitude, studio.longitude));
      });
      map.fitBounds(bounds);
    }
  }, [scriptLoaded, studios]);

  // 4. Handle smooth pan and open popup programmatically when selectedStudio changes
  useEffect(() => {
    const map = mapRef.current;
    if (!scriptLoaded || !map || !selectedStudio) return;

    const latLng = new window.naver.maps.LatLng(selectedStudio.latitude, selectedStudio.longitude);
    map.panTo(latLng);
    map.setZoom(15, true);

    const marker = markersRef.current[selectedStudio.id];
    if (marker) {
      setTimeout(() => {
        window.naver.maps.Event.trigger(marker, 'click');
      }, 300);
    }
  }, [scriptLoaded, selectedStudio]);

  return (
    <div className="relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden border border-slate-900 bg-slate-950/80 shadow-inner group flex items-center justify-center">
      {/* Map Element */}
      {scriptLoaded && !scriptError ? (
        <div id="studio-map-pane" ref={mapContainerRef} className="w-full h-full z-10" />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-md z-10">
          {scriptError ? (
            <>
              <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-200 mb-2">네이버 지도 연동 오류</h3>
              <p className="text-xs text-slate-400 mb-4">{scriptError}</p>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mb-4" />
              <h3 className="text-sm font-bold text-slate-200 mb-1">네이버 지도 불러오는 중</h3>
              <p className="text-xs text-slate-400">네이버 지도 API를 안전하게 연동하고 있습니다...</p>
            </>
          )}
        </div>
      )}

      {/* Floating Info Overlay (Minimal & Slick) */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-1.5">
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-900 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
            NAVER MAP V3 실시간 지도
          </span>
          <span className="text-[10px] text-slate-500 font-semibold border-l border-slate-800 pl-2">
            {studios.length}개 위치 표시
          </span>
        </div>
      </div>

      {/* Floating Quick Action Overlay */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
        <div className="px-2.5 py-1.25 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-900 text-[10px] text-slate-400">
          * 네이버 지도의 정확한 좌표에 실시간 마커가 동기화됩니다.
        </div>
      </div>
    </div>
  );
}
