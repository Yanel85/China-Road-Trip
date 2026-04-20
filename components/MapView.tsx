"use client";

import { useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useEffect } from "react";
import { TransformWrapper, TransformComponent, useControls, useTransformContext } from "react-zoom-pan-pinch";
import { POIData } from "@/types";
import { chinaBorderCoords } from "@/lib/chinaPolygonData";
import { yellowRiverCoords, yangtzeRiverCoords, chinaLakesCoords } from "@/lib/riverLakeMapData";

const AutoZoomController = ({ bounds }: { bounds: { x: number, y: number, w: number, h: number } }) => {
  const { zoomToElement } = useControls();
  
  useEffect(() => {
    if (bounds.w > 0 && bounds.h > 0) { 
      setTimeout(() => {
        zoomToElement('route-boundingBox', 0);
      }, 50);
    }
  }, [bounds, zoomToElement]);
  
  return (
    <div 
      id="route-boundingBox" 
      className="absolute pointer-events-none opacity-0" 
      style={{ left: bounds.x, top: bounds.y-10, width: bounds.w, height: bounds.h-4 }}
    />
  );
};

const MapMarkers = ({ finalRenderPois, selectedPOI, setSelectedPOI, isExpanded }: any) => {
  const context = useTransformContext();
  const scale = (context as any)?.transformState?.scale || (context as any)?.state?.scale || 1;
  
  // Calculate a visual scale target:
  // 1倍左右（全局鸟瞰）缩小视觉占比（~0.7），防重叠
  // 极限放大到20倍时增大视觉占比（~1.2），保清晰度
  //const targetVisualScale = Math.max(0.6, Math.min(1.5, 0.7 * Math.pow(scale, 0.2)));
  //const targetVisualScale = 0.7; // 锁定视觉倍率
  const targetVisualScale = Math.max(0.5, Math.min(1.2, 0.35 * Math.pow(scale, 0.336)));
  const dynamicScale = targetVisualScale / scale;


  return (
    <>
      {finalRenderPois.map((poi: any) => {
        const { pos } = poi;
        
        let mapPinColor = "bg-gray-500";
        const statusStr = (poi.roadStatus || '').toLowerCase();
        if (statusStr.includes('green') || statusStr === '畅通') mapPinColor = 'bg-green-500';
        else if (statusStr.includes('red') || statusStr === '封路' || statusStr === '封闭') mapPinColor = 'bg-red-500';
        else if (statusStr.includes('yellow') || statusStr.includes('orange') || statusStr === '拥堵') mapPinColor = 'bg-yellow-500';
        else if (statusStr.includes('blue')) mapPinColor = 'bg-blue-500';
        else if (statusStr.includes('purple')) mapPinColor = 'bg-purple-500';
        else if (statusStr.includes('pink')) mapPinColor = 'bg-pink-500';
        else if (statusStr.includes('brown')) mapPinColor = 'bg-amber-800';

        return (
          <div 
            key={poi.id}
            className="absolute z-10"
            style={{ 
              left: pos.x, 
              top: pos.y, 
              zIndex: selectedPOI?.id === poi.id ? 40 : 10 
            }}
          >
            <div
              className="flex flex-col items-center cursor-pointer group pointer-events-auto"
              style={{
                transform: `translate(-50%, -50%) scale(${dynamicScale})`,
                transformOrigin: 'center center'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPOI(poi);
              }}
            >
              <span 
                className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 font-bold transition-all shadow-sm whitespace-nowrap border border-white/50
                  ${selectedPOI?.id === poi.id 
                    ? 'bg-brand text-white opacity-100 translate-y-0' 
                    : !isExpanded
                      ? 'bg-white/95 text-gray-800 opacity-100 translate-y-0'
                      : 'bg-white text-gray-800 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'}`}
              >
                {poi.title}
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors shadow-md border-2 border-white
                ${selectedPOI?.id === poi.id ? 'bg-brand scale-125' : `${mapPinColor} hover:bg-brand`}`}>
                <MapPin size={10} strokeWidth={2} />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default function MapView({ 
  pois = [], 
  isExpanded = true, 
  setIsExpanded,
  selectedPOI: propSelectedPOI,
  setSelectedPOI: propSetSelectedPOI
}: { 
  pois: POIData[], 
  isExpanded?: boolean, 
  setIsExpanded?: (v: boolean) => void,
  selectedPOI?: POIData | null,
  setSelectedPOI?: (v: POIData | null) => void
}) {
  const [localSelectedPOI, setLocalSelectedPOI] = useState<POIData | null>(null);
  const selectedPOI = propSelectedPOI !== undefined ? propSelectedPOI : localSelectedPOI;
  const setSelectedPOI = propSetSelectedPOI || setLocalSelectedPOI;

  const [selectedType, setSelectedType] = useState<string>('全部');

  const poiTypes = ['全部', ...Array.from(new Set(pois.map(p => p.type).filter(Boolean)))];
  const filteredPOIs = selectedType === '全部' ? pois : pois.filter(p => p.type === selectedType);

  // Deselect when clicking the background
  const handleMapClick = (e: React.MouseEvent) => {
    // Only deselect if we clicked the map background, not a specific POI marker
    if (e.target === e.currentTarget) {
      setSelectedPOI(null);
      if (setIsExpanded) setIsExpanded(false);
    }
  };

  // 1. Process coordinates smartly
  const mappedPois = pois.map(poi => {
    let lat = NaN, lng = NaN;
    if (poi.coordinates) {
      const parts = poi.coordinates.split(',');
      if (parts.length >= 2) {
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
        // auto-correct if someone input lng, lat (China longitude > 70, lat < 60)
        if (lat > 60 && lng < 60) {
          const temp = lat; lat = lng; lng = temp;
        }
      }
    }
    return { ...poi, lat, lng, validCoords: (!isNaN(lat) && !isNaN(lng)) };
  });

  const validPois = mappedPois.filter(p => p.validCoords);
  
  // Use a fixed virtual container representing China
  // Approximate China bounds: Lng 73E - 135E, Lat 18N - 54N
  const canvasW = 1200;
  const canvasH = 860;
  
  const getPosition = (lat: number, lng: number) => {
    const x = ((lng - 73) / 62) * canvasW;
    const y = ((54 - lat) / 36) * canvasH;
    return { x, y };
  };

  const sortedValidPois = [...validPois].sort((a, b) => a.sequence - b.sequence);
  const pathPoints = sortedValidPois.map(p => getPosition(p.lat, p.lng));

  let routeMinX = Infinity, routeMaxX = -Infinity;
  let routeMinY = Infinity, routeMaxY = -Infinity;
  
  if (pathPoints.length > 0) {
      pathPoints.forEach(p => {
          if (p.x < routeMinX) routeMinX = p.x;
          if (p.x > routeMaxX) routeMaxX = p.x;
          if (p.y < routeMinY) routeMinY = p.y;
          if (p.y > routeMaxY) routeMaxY = p.y;
      });
  }
  
  const routeBounds = {
    x: routeMinX === Infinity ? 0 : routeMinX,
    y: routeMinY === Infinity ? 0 : routeMinY,
    w: routeMinX === Infinity ? 0 : routeMaxX - routeMinX,
    h: routeMinY === Infinity ? 0 : routeMaxY - routeMinY
  };

  let pathD = "";
  if (pathPoints.length > 0) {
    pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const p0 = i === 0 ? pathPoints[0] : pathPoints[i - 1];
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];
        const p3 = i + 2 < pathPoints.length ? pathPoints[i + 2] : p2;
        
        const k = 0.15; // Bezier tension
        const cp1x = p1.x + (p2.x - p0.x) * k;
        const cp1y = p1.y + (p2.y - p0.y) * k;
        const cp2x = p2.x - (p3.x - p1.x) * k;
        const cp2y = p2.y - (p3.y - p1.y) * k;
        
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const finalRenderPois = filteredPOIs.map(poi => {
    const p = mappedPois.find(mp => mp.id === poi.id);
    if (p && p.validCoords) return { ...poi, pos: getPosition(p.lat, p.lng) };
    return { ...poi, pos: { x: -100, y: -100 } };
  }).filter(p => p.pos.x >= 0);

  const chinaPolygonPaths = chinaBorderCoords.map(polygon => 
    polygon.map(([lng, lat]) => `${((lng - 73) / 62) * 1200},${((54 - lat) / 36) * 860}`).join(" ")
  );

  // Rivers and Lakes mapping
  const yellowRiver = yellowRiverCoords.map(([lng, lat]) => `${((lng - 73) / 62) * 1200},${((54 - lat) / 36) * 860}`).join(" ");
  const yangtzeRiver = yangtzeRiverCoords.map(([lng, lat]) => `${((lng - 73) / 62) * 1200},${((54 - lat) / 36) * 860}`).join(" ");
  const chinaLakesPaths = chinaLakesCoords.map(lake => 
    lake.map(([lng, lat]) => `${((lng - 73) / 62) * 1200},${((54 - lat) / 36) * 860}`).join(" ")
  );

  return (
    <div 
      className="w-full h-full bg-[#cbd5e1] relative overflow-hidden flex items-center justify-center cursor-crosshair touch-none"
      onClick={handleMapClick}
    >
      {/* POI Type Filter */}
      {poiTypes.length > 1 && (
        <div className="absolute top-5 left-4 right-4 z-30 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2">
          {poiTypes.map(type => (
            <button
              key={type}
              onClick={(e) => { e.stopPropagation(); setSelectedType(type); setSelectedPOI(null); }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm backdrop-blur-md border ${
                selectedType === type 
                  ? 'bg-gray-900 border-gray-900 text-white' 
                  : 'bg-white/95 border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <TransformWrapper 
         initialScale={5}
         minScale={1.5}
         maxScale={50}
         centerOnInit={false}
         wheel={{ step: 1 }}
         zoomAnimation={{ animationType: "easeOut", animationTime: 350 }}
      >
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
          <AutoZoomController bounds={routeBounds} />
          
          <div style={{ width: canvasW, height: canvasH }} className="relative bg-[#cbd5e1]">
            {/* China Map Background Layer */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: canvasW, height: canvasH }}>
               {chinaPolygonPaths.map((pathPoints, idx) => (
                 <polygon key={idx} points={pathPoints} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
               ))}
               <polyline points={yellowRiver} fill="none" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" vectorEffect="non-scaling-stroke" />
               <polyline points={yangtzeRiver} fill="none" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" vectorEffect="non-scaling-stroke" />
               {chinaLakesPaths.map((pathPoints, idx) => (
                 <polygon key={`lake-${idx}`} points={pathPoints} fill="#bae6fd" stroke="#7dd3fc" strokeWidth="1" strokeLinejoin="round" opacity="0.7" vectorEffect="non-scaling-stroke" />
               ))}
            </svg>

            {/* simulated map grid layer */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)', backgroundSize: '40px 40px'}}
            />

            {/* mapped structural path */}
            {pathD && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: canvasW, height: canvasH }}>
                 {/* Crisp fine line */}
                 <path d={pathD} fill="none" stroke="#F39C12" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="opacity-100"/>
              </svg>
            )}

            {/* Map markers with dynamic scale */}
            <MapMarkers 
               finalRenderPois={finalRenderPois} 
               selectedPOI={selectedPOI} 
               setSelectedPOI={setSelectedPOI} 
               isExpanded={isExpanded} 
            />
          </div>
        </TransformComponent>
      </TransformWrapper>

      <AnimatePresence>
        {selectedPOI && (
          <motion.div 
            initial={{ opacity: 0, y: 5, scale: 1.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 1.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-12 left-4 right-4 md:left-auto md:right-4 md:bottom-auto md:top-4 md:w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100"
          >
            {selectedPOI.images && selectedPOI.images.length > 0 && (
              <div className="relative w-full h-32 bg-gray-200">
                <Image 
                  src={selectedPOI.images[0]} 
                  alt={selectedPOI.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-black/40 text-white rounded-full backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPOI(null);
                  }}
                >
                  <X size={16} />
                </button>
                <div className="absolute top-2 left-2 flex items-center justify-center px-2 py-1 bg-black/40 text-white text-[10px] rounded backdrop-blur-sm font-medium">
                  {selectedPOI.type}
                </div>
              </div>
            )}
            
            {/* If no image, provide an absolute close button on top right of the card */}
            {!(selectedPOI.images && selectedPOI.images.length > 0) && (
                <button 
                  className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPOI(null);
                  }}
                >
                  <X size={16} />
                </button>
            )}

            <div className={`p-4 ${!(selectedPOI.images && selectedPOI.images.length > 0) ? 'pt-8' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <h3 className="font-bold text-base text-gray-900 leading-tight truncate">{selectedPOI.title}</h3>
                  {selectedPOI.altitude > 0 && (
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                      {selectedPOI.altitude}m
                    </span>
                  )}
                </div>
                {selectedPOI.liveUpdate && (
                  <span className="text-[10px] text-white font-medium ml-2 flex-shrink-0">
                    {new Date(selectedPOI.liveUpdate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">{selectedPOI.description || '暂无点位描述信息'}</p>

              <div className="flex space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const latlng = selectedPOI.coordinates;
                    if (latlng) {
                      const [lat, lng] = latlng.split(',');
                      if (lat && lng) {
                        window.open(`https://uri.amap.com/marker?position=${lng.trim()},${lat.trim()}&name=${encodeURIComponent(selectedPOI.title)}`, '_blank');
                        return;
                      }
                    }
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPOI.title)}`, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
                >
                  <Navigation size={16} className="mr-1.5" />
                  导航去这
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
