"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { useState, useEffect } from "react";
import { RouteData } from "@/types";
import { List, X, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#cbd5e1] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-white border-t-brand rounded-full animate-spin"></div>
        <span className="text-white font-medium mt-4 text-sm drop-shadow-md">载入探索地图...</span>
      </div>
    </div>
  )
});

export default function ExploreMapClient({ 
  mapMarkers, 
  multiRoutesPoisConfig = [], 
  routesMapping = {},
  routes = []
}: { 
  mapMarkers: any[], 
  multiRoutesPoisConfig?: {routeId: string, pois: any[]}[], 
  routesMapping?: Record<string, string>,
  routes?: RouteData[]
}) {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const [visibleRoutes, setVisibleRoutes] = useState<string[]>([]);
  const [showFavList, setShowFavList] = useState(false);
  
  const actuallyVisible = visibleRoutes.filter(v => favorites.includes(v));

  const toggleVisible = (id: string) => {
    setVisibleRoutes(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const removeFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  // Filter multiRoutesPois exactly by explicit routeId mapping
  const visibleMultiRoutesPois = multiRoutesPoisConfig
    .filter(config => actuallyVisible.includes(config.routeId))
    .map(config => config.pois);

  return (
    <>
      <MapView 
        pois={mapMarkers} 
        multiRoutesPois={visibleMultiRoutesPois}
        isExpanded={false}
        showRoutes={visibleMultiRoutesPois.length > 0} // Show lines if there are visible routes
        minScale={0.7}
        onViewRoute={(routeIds) => {
          if (routeIds.length > 0) {
            // Find the first valid route ID (translate from Notion ID if necessary)
            const rid = routeIds.find(id => id !== "all");
            if (rid) {
               const localId = routesMapping[rid] || rid;
               router.push(`/route/${localId}`);
            }
          }
        }}
      />
      
      {/* Floating Panel for Favorites */}
      <div className="absolute bottom-6 right-4 z-[60] flex flex-col items-end pointer-events-none">
        
        {/* The List Popup */}
        <AnimatePresence>
          {showFavList && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-md shadow-xl rounded-xl p-2.5 mb-2.5 border border-gray-100 pointer-events-auto min-w-[200px] max-w-[85vw]"
            >
              <div className="space-y-1 max-h-[40vh] overflow-y-auto no-scrollbar">
                {favorites.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-3">暂无收藏</div>
                )}
                {favorites.map(favId => {
                  const route = routes.find(r => r.id === favId);
                  const isVis = actuallyVisible.includes(favId);
                  if (!route) return null;
                  
                  return (
                    <div 
                      key={favId}
                      onClick={() => toggleVisible(favId)}
                      className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors border ${isVis ? 'bg-brand/5 border-brand/20' : 'bg-gray-50/50 border-transparent hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0 pr-1">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isVis ? 'bg-brand text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {isVis ? <Eye size={10} strokeWidth={2.5}/> : <EyeOff size={10} />}
                        </div>
                        <span className={`text-xs font-medium truncate ${isVis ? 'text-brand' : 'text-gray-600'}`}>
                          {route.title}
                        </span>
                      </div>
                      
                      <button 
                        onClick={(e) => removeFavorite(favId, e)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="取消收藏"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Toggle Button */}
        <button 
          onClick={() => setShowFavList(!showFavList)}
          className="flex items-center space-x-1.5 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-gray-100 pointer-events-auto text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <List size={16} className="text-gray-600" />
          <span className="font-bold text-xs tracking-wide">收藏线路列表</span>
        </button>
        
      </div>
    </>
  );
}
