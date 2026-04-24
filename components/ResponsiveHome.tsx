'use client';

import { useState, useEffect, Suspense } from 'react';
import { RouteData, POIData } from "@/types";
import SearchBar from "@/components/SearchBar";
import MergedRouteList from "@/components/MergedRouteList";
import CustomRouteCreator from "@/components/CustomRouteCreator";
import MapView from "@/components/MapView";
import Link from "next/link";
import { Map as MapIcon, ChevronRight, X, Plus, Search } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";

import { useFavorites } from "@/hooks/useFavorites";
import { useLocalRoutes } from "@/hooks/useLocalRoutes";

export default function ResponsiveHome({ 
  routes, 
  allTags, 
  initialTag, 
  initialQuery 
}: { 
  routes: RouteData[], 
  allTags: string[], 
  initialTag?: string, 
  initialQuery?: string 
}) {
  const { localRoutes, saveRoute } = useLocalRoutes();
  const { favorites } = useFavorites();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [pois, setPois] = useState<POIData[]>([]);
  const [globalPois, setGlobalPois] = useState<POIData[]>([]);
  const [defaultMultiPois, setDefaultMultiPois] = useState<POIData[][]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [selectedPoiType, setSelectedPoiType] = useState<string>('全部');
  const [isDesktop, setIsDesktop] = useState(false);
  const [isFolded, setIsFolded] = useState(false);
  const [isAddingPoi, setIsAddingPoi] = useState(false);
  const [addPoiQuery, setAddPoiQuery] = useState('');

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    // Load default multi-route POIs (custom + favorites)
    async function loadDefaultPois() {
      try {
        const res = await fetch('/api/pois');
        const all = await res.json();
        setGlobalPois(all);
        
        // Find routes to show: custom + favorites
        const allAvailable = [...localRoutes, ...routes];
        const displayRoutes = allAvailable.filter(r => r.isCustom || favorites.includes(r.id));
        
        const multi: POIData[][] = displayRoutes.map(r => {
          const seq = r.routeSequence || [];
          const matched = all.filter((p: POIData) => seq.includes(p.poiId));
          matched.sort((a: any, b: any) => seq.indexOf(a.poiId) - seq.indexOf(b.poiId));
          return matched;
        }).filter(seq => seq.length > 0);
        
        setDefaultMultiPois(multi);
      } catch (err) {
        console.error(err);
      }
    }
    loadDefaultPois();

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, [localRoutes, routes, favorites]);

  useEffect(() => {
    async function loadRouteData() {
      if (selectedRouteId) {
        const routeId = selectedRouteId;
        const allAvailable = [...localRoutes, ...routes];
        const route = allAvailable.find(r => r.id === routeId);
        
        if (route) {
          setSelectedRoute(route);
          setIsFolded(false); 
          try {
            const res = await fetch(`/api/pois`);
            const allPois = await res.json();
            const sequence = route.routeSequence || [];
            const matched = allPois.filter((p: POIData) => sequence.includes(p.poiId));
            matched.sort((a: any, b: any) => sequence.indexOf(a.poiId) - sequence.indexOf(b.poiId));
            setPois(matched);
          } catch (err) {
            console.error(err);
          }
        } else {
          // Route was deleted
          setSelectedRouteId(null);
        }
      } else {
        setSelectedRoute(null);
        // Default view: Show markers for all custom and favorited routes
        const flattened = defaultMultiPois.flat();
        // Remove duplicates if any (though route sequences usually don't overlap much in points)
        const unique = Array.from(new Map(flattened.map(p => [p.poiId, p])).values());
        setPois(unique);
      }
    }
    loadRouteData();
  }, [selectedRouteId, routes, localRoutes, defaultMultiPois]);

  const tabs = [...allTags];

  if (!isDesktop) {
    // Mobile View (almost same as current app/page.tsx)
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-background relative shadow-2xl">
        <div className="h-full overflow-y-auto no-scrollbar relative pt-4">
          <Suspense fallback={<div className="px-5 mt-2 mb-4 h-12 bg-white/50 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>

          <section className="px-5 mt-4 mb-2">
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => {
                const isActive = initialTag === tab;
                const nextUrl = isActive 
                  ? `/${initialQuery ? `?q=${initialQuery}` : ''}`
                  : `/?tag=${tab}${initialQuery ? `&q=${initialQuery}` : ''}`;
                
                return (
                  <Link 
                    key={tab} 
                    href={nextUrl}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${isActive ? 'bg-brand text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {tab}
                  </Link>
                );
              })}
            </div>
          </section>
          
          <MergedRouteList initialRoutes={routes} query={initialQuery} tag={initialTag} />

          <div className="fixed bottom-6 left-6 z-50">
            <Link href="/map" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl shadow-gray-900/40 transition-all backdrop-blur-md border border-gray-700/50">
              <MapIcon size={20} />
              <span className="text-sm font-bold tracking-wide">大地图</span>
            </Link>
          </div>

          <CustomRouteCreator />
        </div>
      </div>
    );
  }

  // Desktop Dashboard View
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Route List */}
      <div className="w-[400px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl z-20">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span className="text-brand">西部自驾路</span>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">Explore</span>
            </h1>
          </div>
          
          <div className="mb-6">
            <SearchBar />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = initialTag === tab;
              return (
                <button 
                  key={tab}
                  onClick={() => {
                    const url = isActive
                      ? `/${initialQuery ? `?q=${initialQuery}` : ''}`
                      : `/?tag=${tab}${initialQuery ? `&q=${initialQuery}` : ''}`;
                    window.history.pushState({}, '', url);
                    window.location.reload(); 
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-brand text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 bg-gray-50/30">
          <div className="space-y-4">
             <div onClick={(e) => {
               const target = e.target as HTMLElement;
               const card = target.closest('[data-route-id]');
               
               // Let favorite and delete buttons work natively
               if (target.closest('button')) {
                 return; 
               }

               if (card) {
                 e.preventDefault(); 
                 e.stopPropagation();
                 
                 const id = card.getAttribute('data-route-id');
                 if (id) {
                   setSelectedRouteId(id);
                 }
               }
             }}>
               <MergedRouteList initialRoutes={routes} query={initialQuery} tag={initialTag} asLink={false} />
             </div>
          </div>
        </div>
      </div>

      {/* Main Content - Map View */}
      <div className="flex-1 relative bg-gray-100">
        <div className="absolute inset-0 z-0">
          <MapView 
            pois={pois} 
            multiRoutesPois={selectedRouteId ? undefined : defaultMultiPois}
            showRoutes={true}
            hideFilter={true}
            selectedType={selectedPoiType}
            onTypeChange={setSelectedPoiType}
          />
        </div>

        {/* Global Map Button */}
        <div className="absolute bottom-6 left-6 z-50">
          <Link href="/map" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl shadow-gray-900/40 transition-all backdrop-blur-md border border-gray-700/50 hover:scale-105 active:scale-95">
            <MapIcon size={20} />
            <span className="text-sm font-bold tracking-wide">大地图</span>
          </Link>
        </div>

        {/* Route Summary Overlay - Bottom Right and Foldable */}
        <AnimatePresence>
          {selectedRoute && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                height: isFolded ? 'auto' : 'auto'
              }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 right-6 w-80 bg-white/90 backdrop-blur-md p-5 rounded-[24px] shadow-2xl border border-white/50 z-10 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 leading-tight">{selectedRoute.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {!selectedRoute.isCustom && <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-black">{selectedRoute.distance}KM</span>}
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{selectedRoute.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsFolded(!isFolded)}
                    className="p-1 px-2 text-[10px] bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {isFolded ? '展开' : '折叠'}
                  </button>
                  <Link 
                    href={`/route/${selectedRoute.id}`}
                    className="p-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    详情 
                  </Link>
                </div>
              </div>
              
              {!isFolded && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar pr-1 pt-2 border-t border-gray-100 flex flex-col"
                >
                  {selectedRoute.isCustom && (
                    <div className="pb-2 border-b border-gray-100 mb-1">
                      {!isAddingPoi ? (
                        <button 
                          onClick={() => setIsAddingPoi(true)}
                          className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center gap-1 text-xs font-bold transition-colors border border-dashed border-gray-200"
                        >
                          <Plus size={14} /> 添加途径点
                        </button>
                      ) : (
                         <div className="p-2 border border-brand/20 rounded-xl bg-white shadow-sm space-y-2 ring-1 ring-brand/10">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                              <input
                                 autoFocus
                                 value={addPoiQuery}
                                 onChange={(e) => setAddPoiQuery(e.target.value)}
                                 placeholder="搜索地点..."
                                 className="w-full text-xs pl-8 pr-2 py-2 bg-gray-50 rounded-lg outline-none focus:ring-1 ring-brand/30 transition-all font-medium"
                              />
                            </div>
                            <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
                              {globalPois
                                .filter(p => !pois.some(ep => ep.poiId === p.poiId))
                                .filter(p => p.type === '地点' && (p.title.toLowerCase().includes(addPoiQuery.toLowerCase()) || p.poiId.toLowerCase().includes(addPoiQuery.toLowerCase())))
                                .slice(0, 10).map(p => (
                                <button
                                   key={p.poiId}
                                   onClick={() => {
                                      const newSeq = [...(selectedRoute.routeSequence || [])];
                                      newSeq.splice(newSeq.length - 1, 0, p.poiId); // insert before the end point
                                      const newRoute = { ...selectedRoute, routeSequence: newSeq };
                                      saveRoute(newRoute);
                                      setSelectedRoute(newRoute);
                                      const newPoisList = [...pois];
                                      newPoisList.splice(newPoisList.length - 1, 0, p);
                                      setPois(newPoisList);
                                      setIsAddingPoi(false);
                                      setAddPoiQuery('');
                                   }}
                                   className="w-full text-left p-2 hover:bg-brand/5 rounded-lg text-xs flex justify-between items-center group/add"
                                >
                                  <div>
                                    <span className="font-bold text-gray-800 block leading-tight">{p.title}</span>
                                    <span className="text-[9px] text-gray-400">{p.type}</span>
                                  </div>
                                  <Plus size={14} className="text-brand opacity-0 group-hover/add:opacity-100" />
                                </button>
                              ))}
                              {addPoiQuery && globalPois.filter(p => !pois.some(ep => ep.poiId === p.poiId) && p.type === '地点' && (p.title.toLowerCase().includes(addPoiQuery.toLowerCase()) || p.poiId.toLowerCase().includes(addPoiQuery.toLowerCase()))).length === 0 && (
                                 <div className="text-[10px] text-gray-400 text-center py-3">未找到相关地点</div>
                              )}
                            </div>
                            <button 
                              onClick={() => { setIsAddingPoi(false); setAddPoiQuery(''); }}
                              className="w-full py-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg mt-1 font-medium"
                            >
                              取消添加
                            </button>
                         </div>
                      )}
                    </div>
                  )}
                  {pois.length > 0 ? (
                    <>
                      {selectedRoute.isCustom && pois.length > 2 ? (
                        <>
                          <div className="flex gap-3 group">
                            <div className="flex flex-col items-center">
                              <div className="w-5 h-5 shrink-0 rounded-lg bg-brand flex items-center justify-center text-[9px] font-black text-white">1</div>
                              <div className="w-px flex-1 min-h-[16px] bg-gray-100 my-1 transition-colors" />
                            </div>
                            <div className="pb-3 text-left flex-1 flex justify-between items-center group/poi">
                              <div><p className="text-xs font-bold text-gray-800">{pois[0].title}</p><p className="text-[9px] text-gray-400 font-medium">{pois[0].type}</p></div>
                            </div>
                          </div>
                          <Reorder.Group axis="y" values={pois.slice(1, -1)} onReorder={(reorderedMiddle) => {
                             const newPois = [pois[0], ...reorderedMiddle, pois[pois.length - 1]];
                             setPois(newPois);
                             const newSeq = newPois.map(p => p.poiId);
                             const newRoute = { ...selectedRoute, routeSequence: newSeq };
                             saveRoute(newRoute);
                             setSelectedRoute(newRoute);
                          }}>
                            {pois.slice(1, -1).map((poi, idx) => (
                              <Reorder.Item key={poi.poiId} value={poi} className="flex gap-3 group cursor-grab active:cursor-grabbing bg-white relative z-10">
                                <div className="flex flex-col items-center cursor-pointer">
                                  <div className="w-5 h-5 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-[9px] font-black text-white">{idx + 2}</div>
                                  <div className="w-px flex-1 min-h-[16px] bg-gray-100 my-1 group-hover:bg-brand/20 transition-colors" />
                                </div>
                                <div className="pb-3 text-left flex-1 flex justify-between items-center group/poi">
                                  <div><p className="text-xs font-bold text-gray-800">{poi.title}</p><p className="text-[9px] text-gray-400 font-medium">{poi.type}</p></div>
                                  <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const newSeq = selectedRoute.routeSequence?.filter(id => id !== poi.poiId) || [];
                                      const newRoute = { ...selectedRoute, routeSequence: newSeq };
                                      saveRoute(newRoute);
                                      setSelectedRoute(newRoute);
                                      setPois(pois.filter(p => p.poiId !== poi.poiId));
                                    }}
                                    className="p-1.5 opacity-0 group-hover/poi:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                    title="删除此途径点"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                          <div className="flex gap-3 group">
                            <div className="flex flex-col items-center">
                              <div className="w-5 h-5 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-[9px] font-black text-white">{pois.length}</div>
                            </div>
                            <div className="pb-3 text-left flex-1 flex justify-between items-center group/poi">
                              <div><p className="text-xs font-bold text-gray-800">{pois[pois.length - 1].title}</p><p className="text-[9px] text-gray-400 font-medium">{pois[pois.length - 1].type}</p></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {pois.map((poi, idx) => (
                            <div key={poi.poiId} className="flex gap-3 group">
                              <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 shrink-0 rounded-lg ${idx === 0 ? 'bg-brand' : 'bg-gray-200'} flex items-center justify-center text-[9px] font-black text-white`}>
                                  {idx + 1}
                                </div>
                                {idx < pois.length - 1 && <div className="w-px flex-1 min-h-[16px] bg-gray-100 my-1 group-hover:bg-brand/20 transition-colors" /> }
                              </div>
                              <div className="pb-3 text-left flex-1 flex justify-between items-center group/poi">
                                <div>
                                  <p className="text-xs font-bold text-gray-800">{poi.title}</p>
                                  <p className="text-[9px] text-gray-400 font-medium">{poi.type}</p>
                                </div>
                                {selectedRoute.isCustom && idx !== 0 && idx !== pois.length - 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSeq = selectedRoute.routeSequence?.filter(id => id !== poi.poiId) || [];
                                      const newRoute = { ...selectedRoute, routeSequence: newSeq };
                                      saveRoute(newRoute);
                                      setSelectedRoute(newRoute);
                                      setPois(pois.filter(p => p.poiId !== poi.poiId));
                                    }}
                                    className="p-1.5 opacity-0 group-hover/poi:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                    title="删除此途径点"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 py-4 italic">点击站点或加载中...</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Control Bar - Type Filter */}
        <div className="absolute top-6 left-6 z-10 flex gap-3 items-center pointer-events-auto">
           {pois.length > 0 && (
             <div className="flex gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-white/50 overflow-x-auto no-scrollbar max-w-[400px]">
               {['全部', ...Array.from(new Set(pois.map(p => p.type).filter(Boolean)))].map(type => (
                 <button
                   key={type}
                   onClick={() => setSelectedPoiType(type)}
                   className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm ${
                     selectedPoiType === type 
                       ? 'bg-gray-900 text-white' 
                       : 'bg-white text-gray-500 hover:bg-gray-100'
                   }`}
                 >
                   {type}
                 </button>
               ))}
             </div>
           )}
        </div>

        <CustomRouteCreator buttonClassName="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 h-12 rounded-2xl shadow-xl shadow-black/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all border border-white/20" />
      </div>
    </div>
  );
}
