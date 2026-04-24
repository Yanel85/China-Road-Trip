'use client';

import { useState, useEffect } from 'react';
import { RouteData, POIData } from '@/types';
import RouteInteractiveLayout from './RouteInteractiveLayout';

export default function CustomRouteDetailLoader({ id }: { id: string }) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [pois, setPois] = useState<POIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem('custom_routes');
      if (!stored) {
        setLoading(false);
        return;
      }

      const routes: RouteData[] = JSON.parse(stored);
      const found = routes.find(r => r.id === id);
      if (!found) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/pois');
        const allPois = await res.json();
        const sequence = found.routeSequence || [];
        const matched = allPois.filter((p: POIData) => sequence.includes(p.poiId));
        matched.sort((a: any, b: any) => sequence.indexOf(a.poiId) - sequence.indexOf(b.poiId));
        
        setRoute(found);
        setPois(matched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">加载中...</div>;
  if (!route) return <div className="h-screen flex items-center justify-center bg-gray-50 uppercase font-bold text-gray-300">路线已过期或不存在</div>;

  return <RouteInteractiveLayout route={route} pois={pois} />;
}
