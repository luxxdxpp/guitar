import React, { useEffect, useRef, useState } from 'react';
import { Studio } from '../data/studios';
import { MapPin, Navigation, Star, Phone, AlertTriangle, ChevronDown, ChevronUp, Copy, Check, Settings, Globe } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  
  // Naver Map Refs
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const activeInfoWindowRef = useRef<any>(null);
  
  // Leaflet Map Refs
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<{ [key: string]: any }>({});

  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || '';

  // Choose default map type: if clientId is present, use naver; otherwise fallback to leaflet
  const [activeMapType, setActiveMapType] = useState<'naver' | 'leaflet'>(
    clientId ? 'naver' : 'leaflet'
  );
  
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Load Naver Map Script dynamically
  useEffect(() => {
    if (!clientId) {
      // If clientId is missing, we don't treat it as a hard error because we have Leaflet
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
      if (window.naver && window.naver.maps) {
        setScriptLoaded(true);
      } else {
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

  // 2. Initialize Naver Map once script is loaded
  useEffect(() => {
    if (activeMapType !== 'naver') return;
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
  }, [scriptLoaded, activeMapType]);

  // 3. Update Naver Markers when studios list or map changes
  useEffect(() => {
    if (activeMapType !== 'naver') return;
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

    if (studios.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      studios.forEach((studio) => {
        bounds.extend(new window.naver.maps.LatLng(studio.latitude, studio.longitude));
      });
      map.fitBounds(bounds);
    }
  }, [scriptLoaded, studios, activeMapType]);

  // 4. Handle smooth pan and open popup programmatically when selectedStudio changes (Naver)
  useEffect(() => {
    if (activeMapType !== 'naver') return;
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
  }, [scriptLoaded, selectedStudio, activeMapType]);

  // 5. Initialize Leaflet Map once activeMapType is set to 'leaflet'
  useEffect(() => {
    if (activeMapType !== 'leaflet') return;
    if (!mapContainerRef.current || leafletMapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [37.5518, 126.9245],
        zoom: 13,
        zoomControl: true,
      });

      // Slick styled Dark Matter theme matching our slate/rose vibe perfectly
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      leafletMapRef.current = map;
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [activeMapType]);

  // 6. Update Leaflet Markers when studios list changes
  useEffect(() => {
    if (activeMapType !== 'leaflet') return;
    const map = leafletMapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(leafletMarkersRef.current).forEach((marker: any) => {
      marker.remove();
    });
    leafletMarkersRef.current = {};

    studios.forEach((studio) => {
      const isSelected = selectedStudio?.id === studio.id;

      const customHtml = isSelected
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

      const icon = L.divIcon({
        html: customHtml,
        className: 'custom-marker-wrapper',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 200px;">
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

      const marker = L.marker([studio.latitude, studio.longitude], { icon })
        .addTo(map)
        .bindPopup(popupContent, {
          className: 'custom-leaflet-popup',
          closeButton: false,
          offset: L.point(0, -10),
        });

      marker.on('click', () => {
        onSelectStudio(studio);
      });

      leafletMarkersRef.current[studio.id] = marker;
    });

    if (studios.length > 0) {
      const group = L.featureGroup(Object.values(leafletMarkersRef.current));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [activeMapType, studios]);

  // 7. Handle smooth pan on Leaflet Map when selectedStudio changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (activeMapType !== 'leaflet' || !map || !selectedStudio) return;

    map.setView([selectedStudio.latitude, selectedStudio.longitude], 15, {
      animate: true,
      duration: 1.0,
    });

    const marker = leafletMarkersRef.current[selectedStudio.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 300);
    }
  }, [activeMapType, selectedStudio]);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Map Type Toggle Header */}
      <div className="flex items-center justify-between bg-slate-950/50 p-1.5 rounded-2xl border border-slate-900/60 backdrop-blur-sm">
        <span className="text-xs font-bold text-slate-400 pl-2.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          합주실 위치 지도
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              if (!clientId) {
                alert('네이버 지도 API 클라이언트 ID가 환경변수(VITE_NAVER_MAP_CLIENT_ID)에 등록되어 있지 않습니다. 글로벌 지도를 이용해 주세요!');
                return;
              }
              setActiveMapType('naver');
            }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
              activeMapType === 'naver'
                ? 'bg-rose-600/10 border border-rose-500/30 text-rose-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>네이버 지도</span>
            {!clientId && <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded font-normal">미설정</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveMapType('leaflet')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
              activeMapType === 'leaflet'
                ? 'bg-rose-600/10 border border-rose-500/30 text-rose-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>글로벌 지도 (무료/인증 불필요)</span>
          </button>
        </div>
      </div>

      {/* Map Main Container */}
      <div className="relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden border border-slate-900 bg-slate-950/80 shadow-inner group flex items-center justify-center">
        {/* Map Element */}
        {activeMapType === 'naver' ? (
          scriptLoaded && !scriptError ? (
            <div id="studio-map-pane" key="naver-map" ref={mapContainerRef} className="w-full h-full z-10" />
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
          )
        ) : (
          <div id="studio-map-pane-leaflet" key="leaflet-map" ref={mapContainerRef} className="w-full h-full z-10 animate-fade-in" />
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

      {/* Naver Maps API Troubleshooting & Setup Guide Card */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/30 text-left transition"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-rose-400 animate-spin-slow" />
            <span className="text-xs font-bold text-slate-300">
              네이버 지도 API 연동 & 인증 실패 해결 가이드 (중요)
            </span>
          </div>
          {showGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showGuide && (
          <div className="px-4 pb-4 border-t border-slate-900/60 pt-3 text-[11px] text-slate-400 space-y-3.5 leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="font-bold text-rose-400 block mb-1">⚠️ "지도 API 인증에 실패했습니다" 경고창이 뜨는 이유</span>
              네이버 지도는 보안을 위해 등록된 <strong className="text-slate-200">정확한 웹 서비스 URL(도메인 주소)</strong>에서만 API가 호출되도록 허용합니다. 현재 AI Studio 미리보기 서버의 주소가 네이버 클라우드 콘솔에 등록되어 있지 않거나 Client ID가 다를 수 있습니다.
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 block">💡 3분 만에 네이버 지도 연동 완벽하게 해결하기:</span>
              <ol className="list-decimal pl-4.5 space-y-2 text-slate-400">
                <li>
                  <a 
                    href="https://console.ncloud.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline font-bold"
                  >
                    네이버 클라우드 플랫폼 콘솔 (console.ncloud.com)
                  </a>
                  에 로그인한 뒤, <strong className="text-slate-200">Services &gt; AI·NAVER API &gt; Application</strong> 메뉴로 이동합니다.
                </li>
                <li>
                  등록된 Application 목록에서 사용 중인 앱을 찾아 <strong className="text-slate-200">변경(Edit)</strong>을 클릭합니다.
                </li>
                <li>
                  <strong className="text-slate-200">웹 서비스 URL(Web Service URL)</strong> 설정 항목을 찾습니다.
                </li>
                <li>
                  아래의 주소들을 복사하여 각각 한 줄씩 추가한 후 저장합니다.
                  <div className="mt-2 flex flex-col gap-1.5 max-w-md">
                    <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                      <span className="font-mono text-[10px] text-indigo-300 select-all truncate mr-2">
                        {currentOrigin || "https://ais-dev-..."}
                      </span>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-300 transition shrink-0 flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>복사됨!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>주소 복사</span>
                          </>
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      * 로컬 테스트를 위해 <code className="text-slate-400">http://localhost:3000</code> 도 함께 등록해두는 것이 좋습니다.
                    </span>
                  </div>
                </li>
                <li>
                  우측 상단 <strong className="text-slate-200">Settings &gt; Secrets</strong> 메뉴에서 <code className="text-rose-400 font-bold">VITE_NAVER_MAP_CLIENT_ID</code> 환경변수 값으로 발급받은 클라이언트 아이디를 정확히 등록했는지 재차 확인해 주세요.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
