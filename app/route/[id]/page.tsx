import { getRouteById, getRoutePOIs } from "@/lib/notion";
import RouteInteractiveLayout from "@/components/RouteInteractiveLayout";

export const dynamic = "force-dynamic";

export default async function RouteDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const route = await getRouteById(id);
  const pois = await getRoutePOIs(id, route?.routeSequence);

  if (!route) {
     return <div className="p-8 text-center bg-gray-50 flex-1 flex flex-col items-center justify-center h-screen">找不到该路线信息</div>;
  }

  return <RouteInteractiveLayout route={route} pois={pois} />;
}
