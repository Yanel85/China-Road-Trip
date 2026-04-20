import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getRoutes, getAllPOIs } from "@/lib/notion";
import ExploreMapClient from "@/components/ExploreMapClient";

export const dynamic = "force-dynamic";

export default async function ExploreMapPage() {
  const routes = await getRoutes();
  const allPois = await getAllPOIs();

  // Group POIs by route to draw separate lines
  const multiRoutesPois = routes.map(route => {
    return allPois
      .filter(poi => poi.routeIds.includes(route.id) || (route.notionId && poi.routeIds.includes(route.notionId)) || poi.routeIds.includes('all'))
      .sort((a, b) => a.sequence - b.sequence);
  }).filter(pois => pois.length > 0);

  // Deduplicate POIs for markers
  const uniquePoisMap = new Map();
  multiRoutesPois.flat().forEach(poi => {
    if (!uniquePoisMap.has(poi.id)) {
      uniquePoisMap.set(poi.id, poi);
    }
  });
  const mapMarkers = Array.from(uniquePoisMap.values());

  const routesMapping = routes.reduce((acc, route) => {
    if (route.notionId) acc[route.notionId] = route.id;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="relative h-[100dvh] w-full bg-gray-100 overflow-hidden">
      <div className="w-full h-full absolute inset-0">
        <ExploreMapClient 
          mapMarkers={mapMarkers} 
          multiRoutesPois={multiRoutesPois}
          routesMapping={routesMapping}
        />
      </div>

      <div className="absolute bottom-6 left-4 z-40 pointer-events-none">
        <div className="flex flex-col space-y-3 pointer-events-auto">
          <div className="flex items-center space-x-3">
            <Link href="/" className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100">
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-gray-100">
              <h1 className="font-bold text-gray-800 text-sm tracking-wide">返回线路列表</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
