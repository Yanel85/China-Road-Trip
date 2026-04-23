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
  const multiRoutesPoisConfig = routes.map(route => {
    // line drawing only needs valid D and S structural points inside `routeSequence`
    const pois = allPois
      .filter(poi => route.routeSequence?.includes(poi.poiId) && (poi.type === '地点' || poi.type === '垭口') && typeof poi.altitude === 'number')
      .sort((a, b) => (route.routeSequence || []).indexOf(a.poiId) - (route.routeSequence || []).indexOf(b.poiId));
    return { routeId: route.id, pois };
  }).filter(item => item.pois.length > 0);

  // Map markers: Use all POIs that have valid coordinates and altitude data
  const mapMarkers = allPois.filter(poi => {
    return poi.coordinates && 
           poi.coordinates.includes(',') && 
           poi.altitude !== null && 
           poi.altitude !== undefined;
  });

  const routesMapping = routes.reduce((acc, route) => {
    if (route.notionId) acc[route.notionId] = route.id;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="relative h-[100dvh] w-full bg-gray-100 overflow-hidden">
      <div className="w-full h-full absolute inset-0">
        <ExploreMapClient 
          mapMarkers={mapMarkers} 
          multiRoutesPoisConfig={multiRoutesPoisConfig}
          routesMapping={routesMapping}
          routes={routes}
        />
      </div>

      <div className="absolute bottom-6 left-4 z-40 pointer-events-none">
        <div className="flex flex-col space-y-3 pointer-events-auto">
          <div className="flex items-center space-x-3">
            <Link href="/" className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100">
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
