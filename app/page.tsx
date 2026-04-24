import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Map } from "lucide-react";
import { getRoutes } from "@/lib/notion";
import SearchBar from "@/components/SearchBar";
import MergedRouteList from "@/components/MergedRouteList";
import CustomRouteCreator from "@/components/CustomRouteCreator";
import ResponsiveHome from "@/components/ResponsiveHome";

const Skeleton = () => (
  <div className="animate-pulse space-y-6 px-5 mt-4">
    <div className="flex gap-3">
      <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
      <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
      <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4 p-3 bg-white rounded-20 shadow-card">
          <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 space-y-3 py-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-5 bg-gray-200 rounded w-16 mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q;
  const query = typeof q === "string" ? q : undefined;
  const t = resolvedSearchParams.tag;
  const tag = typeof t === "string" ? t : undefined;

  const routes = await getRoutes();
  const allTags = Array.from(new Set(routes.flatMap(r => r.tags))).filter(Boolean);

  return (
    <ResponsiveHome 
      routes={routes} 
      allTags={allTags} 
      initialTag={tag} 
      initialQuery={query} 
    />
  );
}

