import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import RouteCard from "@/components/RouteCard";
import { getRoutes } from "@/lib/notion";
import SearchBar from "@/components/SearchBar";
import { RouteData } from "@/types";

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

async function RouteList({ routes, query, tag }: { routes: RouteData[], query?: string, tag?: string }) {
  let filteredRoutes = routes;

  if (query) {
    filteredRoutes = filteredRoutes.filter((route) => 
      route.title.toLowerCase().includes(query.toLowerCase()) || route.id === "error"
    );
  }

  if (tag && tag !== '全部') {
    filteredRoutes = filteredRoutes.filter((route) => route.tags.includes(tag));
  }

  if (filteredRoutes.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-gray-500 text-sm">
        没有找到相关的匹配结果
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4 pb-10">
      {filteredRoutes.map((route) => (
        <RouteCard key={route.id} data={route} />
      ))}
    </div>
  );
}

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
  const tag = typeof t === "string" ? t : '全部';

  const routes = await getRoutes();
  const allTags = Array.from(new Set(routes.flatMap(r => r.tags))).filter(Boolean);
  const tabs = [...allTags];

  return (
    <div className="h-full overflow-y-auto no-scrollbar relative pt-4">
      <Suspense fallback={<div className="px-5 mt-2 mb-4 h-12 bg-white/50 rounded-full animate-pulse" />}>
        <SearchBar />
      </Suspense>

      <section className="px-5 mt-4 mb-2">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab, idx) => (
            <Link 
              key={tab} 
              href={`/?tag=${tab}${query ? `&q=${query}` : ''}`}
              className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all ${tag === tab ? 'bg-brand text-white shadow-md' : 'bg-gray-200/70 text-gray-700 hover:bg-gray-300/80'}`}
            >
              {tab}
            </Link>
          ))}
        </div>
      </section>
      
      <section className="px-5 mt-4 group">
        <div className="relative w-full aspect-[16/9] rounded-20 overflow-hidden shadow-card transition-all duration-300 ease-in-out group-active:scale-[0.98]">
          <Image src="https://picsum.photos/seed/hero/800/400" alt="G318 实时路况" fill className="object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-success w-2 h-2 rounded-full"></span>
              <span className="text-xs font-semibold px-2 py-1 bg-black/30 backdrop-blur-sm rounded-lg">G318 实时畅通</span>
            </div>
            <h1 className="text-2xl font-bold">当日主推：横穿雪山</h1>
          </div>
        </div>
      </section>

      <Suspense fallback={<Skeleton />}>
        <RouteList routes={routes} query={query} tag={tag} />
      </Suspense>
    </div>
  );
}
