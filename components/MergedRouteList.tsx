'use client';

import { useMemo } from 'react';
import RouteCard from "./RouteCard";
import { RouteData } from "@/types";
import { useLocalRoutes } from "@/hooks/useLocalRoutes";
import { Trash2 } from 'lucide-react';

export default function MergedRouteList({ 
  initialRoutes, 
  query, 
  tag,
  asLink = true
}: { 
  initialRoutes: RouteData[], 
  query?: string, 
  tag?: string,
  asLink?: boolean
}) {
  const { localRoutes, deleteRoute } = useLocalRoutes();

  const merged = useMemo(() => {
    // Combine routes: Local routes first
    const all = [...localRoutes, ...initialRoutes];
    
    let filtered = all;

    if (query) {
      filtered = filtered.filter((r) => 
        r.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (tag && tag !== '全部') {
      filtered = filtered.filter((r) => r.tags.includes(tag));
    }

    // Sort priority
    const custom = filtered.filter(r => r.isCustom);
    // Sort custom routes by ID descending (which contains timestamp) to show newest at top
    custom.sort((a, b) => b.id.localeCompare(a.id));
    
    const regular = filtered.filter(r => !r.isCustom);

    // Season sorting for regular routes
    const getCurrentSeason = () => {
      const month = new Date().getMonth() + 1;
      if (month >= 3 && month <= 5) return '春';
      if (month >= 6 && month <= 8) return '夏';
      if (month >= 9 && month <= 11) return '秋';
      return '冬';
    };
    const currentSeason = getCurrentSeason();

    const getStatusScore = (status: string) => {
      if (status.includes('开放') || status.includes('畅通') || status.toLowerCase().includes('clear')) return 0;
      if (status.includes('封') || status.includes('封闭') || status.includes('封路')) return 2;
      return 1;
    };

    regular.sort((a, b) => {
      const aHasSeason = a.season.includes(currentSeason) ? 1 : 0;
      const bHasSeason = b.season.includes(currentSeason) ? 1 : 0;
      if (aHasSeason !== bHasSeason) return bHasSeason - aHasSeason;
      if (a.distance !== b.distance) return (b.distance || 0) - (a.distance || 0);
      return getStatusScore(a.status) - getStatusScore(b.status);
    });

    return [...custom, ...regular];
  }, [initialRoutes, localRoutes, query, tag]);

  if (merged.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-gray-500 text-sm">
        没有找到相关的匹配结果
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4 pb-24">
      {merged.map((route) => (
        <div key={route.id} className="relative group" data-route-id={route.id}>
          <RouteCard data={route} asLink={asLink} />
          {route.isCustom && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteRoute(route.id);
              }}
              className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              title="删除自定义路线"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
