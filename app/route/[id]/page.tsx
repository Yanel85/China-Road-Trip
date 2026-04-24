import { getRouteById, getRoutePOIs } from "@/lib/notion";
import RouteInteractiveLayout from "@/components/RouteInteractiveLayout";
import CustomRouteDetailLoader from "@/components/CustomRouteDetailLoader";

export const dynamic = "force-dynamic";

export default async function RouteDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const route = await getRouteById(id);

  if (!route) {
    if (id.startsWith('custom-')) {
       return <CustomRouteDetailLoader id={id} />;
    }
    return <div className="p-8 text-center bg-gray-50 flex-1 flex flex-col items-center justify-center h-screen">找不到该路线信息</div>;
  }

  const pois = await getRoutePOIs(id, route?.routeSequence);

  return <RouteInteractiveLayout route={route} pois={pois} />;
}
