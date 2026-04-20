"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

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

export default function ExploreMapClient({ mapMarkers, multiRoutesPois, routesMapping = {} }: { mapMarkers: any[], multiRoutesPois: any[][], routesMapping?: Record<string, string> }) {
  const router = useRouter();

  return (
    <MapView 
      pois={mapMarkers} 
      multiRoutesPois={multiRoutesPois}
      isExpanded={false}
      showRoutes={false}
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
  );
}
