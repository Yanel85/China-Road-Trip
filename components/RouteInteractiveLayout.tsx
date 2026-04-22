"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowDown, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#cbd5e1] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-white border-t-brand rounded-full animate-spin"></div>
        <span className="text-white font-medium mt-4 text-sm drop-shadow-md">载入地图数据...</span>
      </div>
    </div>
  )
});

const AltitudeChart = dynamic(() => import("@/components/AltitudeChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[180px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center mt-3">
      <span className="text-gray-400 text-xs text-center px-4">海拔图表正通过 Recharts 生成...</span>
    </div>
  )
});

export default function RouteInteractiveLayout({ route, pois }: { route: any; pois: any[] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<'sequence' | 'altitude' | 'roadStatus'>('sequence');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedPOI, setSelectedPOI] = useState<any | null>(null);

  const handleSort = (type: 'sequence' | 'altitude' | 'roadStatus') => {
    if (sortBy === type) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(type);
      setSortAsc(type === 'roadStatus' ? false : true); // Default desc for roadStatus to show issue first
    }
  };

  const statusScore: Record<string, number> = { 
    "畅通": 0, "green": 0, "blue": 0, 
    "拥堵": 1, "yellow": 1, "orange": 1, 
    "封路": 2, "red": 2, "brown": 2, "purple": 2 
  };

  const sortedPois = [...pois].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'sequence') {
      diff = a.sequence - b.sequence;
    } else if (sortBy === 'altitude') {
      diff = a.altitude - b.altitude;
    } else if (sortBy === 'roadStatus') {
      diff = (statusScore[a.roadStatus] ?? 0) - (statusScore[b.roadStatus] ?? 0);
    }
    return sortAsc ? diff : -diff;
  });

  // Calculate Altitude Chart Data: Exclude '景点', include start, end, highest, lowest, total 5-16 points
  const validChartPois = [...pois]
    .filter(p => (p.type === '地点' || p.type === '垭口') && typeof p.altitude === 'number')
    .sort((a, b) => a.sequence - b.sequence);

  let chartPois: any[] = [];
  
  if (validChartPois.length > 0) {
    const startPoi = validChartPois[0];
    const endPoi = validChartPois[validChartPois.length - 1];

    let highestPoi = validChartPois[0];
    let lowestPoi = validChartPois[0];

    validChartPois.forEach(p => {
      if (p.altitude > highestPoi.altitude) highestPoi = p;
      if (p.altitude < lowestPoi.altitude) lowestPoi = p;
    });

    const essentialIds = new Set([startPoi.id, endPoi.id, highestPoi.id, lowestPoi.id]);
    const essentialPois = validChartPois.filter(p => essentialIds.has(p.id));

    let selectedPois = [...essentialPois];
    const targetCount = Math.max(5, Math.min(18, validChartPois.length));
    const remainingCount = targetCount - essentialPois.length;

    if (remainingCount > 0) {
      const candidates = validChartPois.filter(p => !essentialIds.has(p.id));
      if (candidates.length <= remainingCount) {
        selectedPois = selectedPois.concat(candidates);
      } else {
        const step = candidates.length / remainingCount;
        for (let i = 0; i < remainingCount; i++) {
          selectedPois.push(candidates[Math.floor(i * step)]);
        }
      }
    }

    chartPois = selectedPois.sort((a, b) => a.sequence - b.sequence);
  }

  const altitudeChartData = chartPois.map(p => ({ 
    name: p.title, 
    altitude: p.altitude || 0 
  }));

  return (
    <div className="relative h-[100dvh] w-full bg-gray-100 overflow-hidden">
      {/* Map View */}
      <motion.div 
        className="w-full absolute top-0 left-0"
        initial={false}
        animate={{ height: isExpanded ? "23vh" : "100vh" }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      >
        <MapView 
          pois={pois} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
          selectedPOI={selectedPOI}
          setSelectedPOI={setSelectedPOI}
        />
      </motion.div>

      {/* Bottom Sheet */}
      <motion.div 
        className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] z-[50]"
        initial={false}
        animate={{ 
          height: isExpanded ? "77vh" : "90px",
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      >
        {/* Back Button (Bottom Left) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-6 left-4 z-[70] w-12 h-12"
            >
              <Link
                href="/"
                className="bg-gray-900/90 backdrop-blur-md w-full h-full rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-white hover:bg-black flex items-center justify-center transition-all active:scale-95"
              >
                <ChevronLeft size={26} strokeWidth={2.5} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag Handle Area */}
        <div 
          className="w-full h-8 flex items-center justify-center cursor-pointer absolute top-0 left-0 z-[60] bg-white rounded-t-[30px]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Persistent Header visible even when collapsed */}
        <div 
          className="absolute top-7 left-0 right-0 px-5 cursor-pointer z-[60]"
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          <h2 className="text-[17px] font-bold text-gray-900 mb-0.5 leading-tight line-clamp-1">{route.title}</h2>
          
          <div className="flex justify-between items-start">
            <p className="text-[12px] text-gray-500 truncate mt-0.5">
              里程: {route.distance}km {route.season.length > 0 && `• 适宜季节: ${route.season.join('/')}`}
            </p>
            {!(route.status.includes('开放') || route.status.includes('clear')) && (
              <div className={`flex-shrink-0 ml-2 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold shadow-sm ${
                route.status.includes('封路') || route.status.includes('congested') || route.status.includes('拥堵') 
                  ? 'bg-warning' 
                  : 'bg-danger'
              }`}>
                {route.status}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={`absolute top-[75px] left-0 right-0 bottom-0 overflow-y-auto pb-10 px-5 custom-scrollbar transition-opacity duration-300 ${!isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="mb-4 mt-2">
             <AltitudeChart data={altitudeChartData} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2 border-b pb-2 mt-4">
              <h3 className="text-base font-semibold text-gray-800">详细路段 & 点位</h3>
              <div className="flex gap-2 text-[11px] font-medium text-gray-500">
                <button onClick={() => handleSort('sequence')} className={`flex items-center gap-0.5 hover:text-gray-900 ${sortBy === 'sequence' ? 'text-brand' : ''}`}>
                  <span>距离</span>{sortBy === 'sequence' && (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={() => handleSort('altitude')} className={`flex items-center gap-0.5 hover:text-gray-900 ${sortBy === 'altitude' ? 'text-brand' : ''}`}>
                  <span>海拔</span>{sortBy === 'altitude' && (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={() => handleSort('roadStatus')} className={`flex items-center gap-0.5 hover:text-gray-900 ${sortBy === 'roadStatus' ? 'text-brand' : ''}`}>
                  <span>状态</span>{sortBy === 'roadStatus' && (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </button>
              </div>
            </div>
            
            {sortedPois.map((poi: any) => {
              const statusStr = (poi.roadStatus || '').toLowerCase();
              let borderClass = 'border-gray-300';
              let dotClass = 'bg-gray-300';

              if (statusStr.includes('green') || statusStr === '畅通') { borderClass = 'border-green-500'; dotClass = 'bg-green-500'; }
              else if (statusStr.includes('red') || statusStr === '封路' || statusStr === '封闭') { borderClass = 'border-red-500'; dotClass = 'bg-red-500'; }
              else if (statusStr.includes('yellow') || statusStr.includes('orange') || statusStr === '拥堵') { borderClass = 'border-yellow-500'; dotClass = 'bg-yellow-500'; }
              else if (statusStr.includes('blue')) { borderClass = 'border-blue-500'; dotClass = 'bg-blue-500'; }
              else if (statusStr.includes('purple')) { borderClass = 'border-purple-500'; dotClass = 'bg-purple-500'; }
              else if (statusStr.includes('pink')) { borderClass = 'border-pink-500'; dotClass = 'bg-pink-500'; }
              else if (statusStr.includes('brown')) { borderClass = 'border-amber-800'; dotClass = 'bg-amber-800'; }
              else if (statusStr.includes('gray')) { borderClass = 'border-gray-400'; dotClass = 'bg-gray-400'; }

              return (
                <div 
                  key={poi.id} 
                  className={`pl-3 border-l-[3px] py-1.5 ${borderClass} cursor-pointer hover:bg-gray-50 transition-colors duration-200 group`}
                  onClick={() => {
                    setSelectedPOI(poi);
                    setIsExpanded(false);
                  }}
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-[13px] font-semibold text-gray-800 flex items-center gap-1.5 group-hover:text-brand transition-colors truncate">
                      <span className="truncate">{poi.title}</span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`}></span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex gap-1.5 items-center flex-shrink-0">
                      {poi.altitude > 0 && <span className="font-medium bg-gray-100 px-1 rounded">{poi.altitude}m</span>}
                      {poi.type && <span>{poi.type}</span>}
                    </div>
                  </div>
                  {(poi.description || poi.roadStatus) && (
                    <div className="text-[11px] text-gray-400 mt-1 line-clamp-2 pr-1 leading-relaxed">
                      {poi.description || '暂无点位描述...'}
                    </div>
                  )}
                </div>
              );
            })}
            
            {sortedPois.length === 0 && (
               <div className="text-sm text-gray-400 py-4 text-center">暂未关联具体点位信息</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
