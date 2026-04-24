"use client";

import { useState, useEffect } from "react";
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
      <span className="text-gray-400 text-xs text-center px-4">载入海拔图表...</span>
    </div>
  )
});

export default function RouteInteractiveLayout({ route, pois }: { route: any; pois: any[] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<'sequence' | 'altitude' | 'roadStatus'>('sequence');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedPOI, setSelectedPOI] = useState<any | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setIsExpanded(true);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const handleSort = (type: 'sequence' | 'altitude' | 'roadStatus') => {
    if (sortBy === type) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(type);
      setSortAsc(type === 'roadStatus' ? false : true);
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
      const getSeqVal = (poi: any) => {
        if (route.routeSequence) {
          const idx = route.routeSequence.findIndex((id: string) => id === poi.poiId);
          if (idx !== -1) return idx;
        }
        return 1000 + (poi.sequence || 999);
      };
      const aSeq = getSeqVal(a);
      const bSeq = getSeqVal(b);
      diff = aSeq - bSeq;
    } else if (sortBy === 'altitude') {
      diff = (a.altitude || 0) - (b.altitude || 0);
    } else if (sortBy === 'roadStatus') {
      diff = (statusScore[a.roadStatus] ?? 0) - (statusScore[b.roadStatus] ?? 0);
    }
    return sortAsc ? diff : -diff;
  });

  const validChartPois = [...pois]
    .filter(p => route.routeSequence?.includes(p.poiId) && (p.type === '地点' || p.type === '垭口') && typeof p.altitude === 'number')
    .sort((a, b) => route.routeSequence.indexOf(a.poiId) - route.routeSequence.indexOf(b.poiId));

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
        for (let i = 0; i < remainingCount; i++) selectedPois.push(candidates[Math.floor(i * step)]);
      }
    }
    chartPois = selectedPois.sort((a, b) => route.routeSequence.indexOf(a.poiId) - route.routeSequence.indexOf(b.poiId));
  }
  const altitudeChartData = chartPois.map(p => ({ name: p.title, altitude: p.altitude || 0 }));
  const pathPoints = [...pois]
    .filter(p => route.routeSequence?.includes(p.poiId) && (p.type === '地点' || p.type === '垭口'))
    .sort((a, b) => route.routeSequence.indexOf(a.poiId) - route.routeSequence.indexOf(b.poiId));

  if (isDesktop) {
    return (
      <div className="relative h-screen w-full bg-gray-100 overflow-hidden flex">
        <div className="absolute inset-0 z-0">
          <MapView 
            pois={pois} 
            multiRoutesPois={[pathPoints]}
            showRoutes={true}
            selectedPOI={selectedPOI}
            setSelectedPOI={setSelectedPOI}
          />
        </div>

        <Link 
          href="/" 
          className="absolute bottom-6 left-6 z-[100] flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white hover:bg-gray-50 transition-all font-bold text-gray-900"
        >
          <ChevronLeft size={20} />
          <span>返回路线列表</span>
        </Link>

        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`absolute bottom-6 right-6 w-[420px] bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white overflow-hidden flex flex-col z-[50] transition-all duration-500 ease-in-out ${isExpanded ? 'h-[80vh]' : 'h-[90px]'}`}
        >
          <div className="p-6 cursor-pointer flex-shrink-0" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-xl font-black text-gray-900 leading-tight line-clamp-1">{route.title}</h2>
                <p className="text-[12px] text-gray-500 font-bold mt-1">
                  全程 {route.distance}KM • {route.status}
                </p>
              </div>
              <div className={`p-2 bg-gray-100 rounded-xl transition-transform ${!isExpanded ? 'rotate-180' : ''}`}>
                <ArrowDown size={18} />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto no-scrollbar px-6 pb-10">
                <div className="mb-6">
                  <AltitudeChart data={altitudeChartData} />
                </div>
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm italic">STATION LIST / 站点详情</h3>
                  <div className="flex gap-3 text-[10px] font-black text-gray-400">
                    <button onClick={() => handleSort('sequence')} className={sortBy === 'sequence' ? 'text-brand' : ''}>序号</button>
                    <button onClick={() => handleSort('altitude')} className={sortBy === 'altitude' ? 'text-brand' : ''}>海拔</button>
                    <button onClick={() => handleSort('roadStatus')} className={sortBy === 'roadStatus' ? 'text-brand' : ''}>状态</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {sortedPois.map((poi: any) => {
                    const statusStr = (poi.roadStatus || '').toLowerCase();
                    let dotColor = 'bg-gray-300';
                    if (statusStr.includes('green') || statusStr === '畅通') dotColor = 'bg-green-500';
                    else if (statusStr.includes('red') || statusStr === '封路') dotColor = 'bg-red-500';
                    else if (statusStr.includes('yellow') || statusStr === '拥堵') dotColor = 'bg-yellow-500';
                    return (
                      <div key={poi.id} onClick={() => setSelectedPOI(poi)} className="bg-white/50 border border-gray-100 p-4 rounded-2xl cursor-pointer hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                             <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-sm border border-white/50`} />
                             <span className="font-bold text-gray-900 group-hover:text-brand transition-colors text-sm">{poi.title}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">ALT {poi.altitude}M</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed opacity-80">{poi.description || '暂无点位描述...'}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-gray-100 overflow-hidden">
      <motion.div 
        className="w-full absolute top-0 left-0"
        initial={false}
        animate={{ height: isExpanded ? "23vh" : "100vh" }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      >
        <MapView 
          pois={pois} 
          multiRoutesPois={[pathPoints]}
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
          selectedPOI={selectedPOI}
          setSelectedPOI={setSelectedPOI}
        />
      </motion.div>

      <motion.div 
        className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] z-[50]"
        initial={false}
        animate={{ height: isExpanded ? "77vh" : "90px" }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-6 left-4 z-[70] w-12 h-12">
              <Link href="/" className="bg-gray-900/90 backdrop-blur-md w-full h-full rounded-full shadow-lg text-white flex items-center justify-center transition-all active:scale-95">
                <ChevronLeft size={26} strokeWidth={2.5} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-8 flex items-center justify-center cursor-pointer absolute top-0 left-0 z-[60]" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="absolute top-7 left-0 right-0 px-5 cursor-pointer z-[60]" onClick={() => !isExpanded && setIsExpanded(true)}>
          <h2 className="text-[17px] font-bold text-gray-900 mb-0.5 leading-tight line-clamp-1">{route.title}</h2>
          <div className="flex justify-between items-start">
            <p className="text-[12px] text-gray-500 truncate mt-0.5">
              里程: {route.distance}km {route.season.length > 0 && `• 适宜季节: ${route.season.join('/')}`}
            </p>
            {!(route.status.includes('开放') || route.status.includes('clear')) && (
              <div className={`flex-shrink-0 ml-2 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold ${route.status.includes('封路') || route.status.includes('拥堵') ? 'bg-warning' : 'bg-danger'}`}>
                {route.status}
              </div>
            )}
          </div>
        </div>

        <div className={`absolute top-[75px] left-0 right-0 bottom-0 overflow-y-auto pb-10 px-5 transition-opacity duration-300 ${!isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="mb-4 mt-2">
             <AltitudeChart data={altitudeChartData} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2 border-b pb-2 mt-4">
              <h3 className="text-base font-semibold text-gray-800">详细路段 & 点位</h3>
              <div className="flex gap-2 text-[11px] font-medium text-gray-500">
                <button onClick={() => handleSort('sequence')} className={sortBy === 'sequence' ? 'text-brand' : ''}>距离</button>
                <button onClick={() => handleSort('altitude')} className={sortBy === 'altitude' ? 'text-brand' : ''}>海拔</button>
                <button onClick={() => handleSort('roadStatus')} className={sortBy === 'roadStatus' ? 'text-brand' : ''}>状态</button>
              </div>
            </div>
            {sortedPois.map((poi: any) => {
              const statusStr = (poi.roadStatus || '').toLowerCase();
              let borderClass = 'border-gray-300';
              if (statusStr.includes('green') || statusStr === '畅通') borderClass = 'border-green-500';
              else if (statusStr.includes('red') || statusStr === '封路') borderClass = 'border-red-500';
              else if (statusStr.includes('yellow') || statusStr === '拥堵') borderClass = 'border-yellow-500';
              return (
                <div key={poi.id} className={`pl-3 border-l-[3px] py-1.5 ${borderClass} cursor-pointer hover:bg-gray-50 transition-colors`} onClick={() => { setSelectedPOI(poi); setIsExpanded(false); }}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-[13px] font-semibold text-gray-800">{poi.title}</div>
                    <div className="text-[10px] text-gray-500 flex gap-1.5 items-center">
                      {poi.altitude > 0 && <span className="font-medium bg-gray-100 px-1 rounded">ALT {poi.altitude}m</span>}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{poi.description || '暂无点位描述...'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
