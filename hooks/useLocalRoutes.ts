import { useState, useEffect } from 'react';
import { RouteData } from '@/types';

const STORAGE_KEY = 'custom_routes';

export function useLocalRoutes() {
  const [localRoutes, setLocalRoutes] = useState<RouteData[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalRoutes(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse local routes", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleSync = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLocalRoutes(JSON.parse(stored));
    };
    window.addEventListener('local-routes-updated', handleSync);
    return () => window.removeEventListener('local-routes-updated', handleSync);
  }, []);

  const saveRoute = (route: RouteData) => {
    const updated = [route, ...localRoutes.filter(r => r.id !== route.id)];
    setLocalRoutes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('local-routes-updated'));
  };

  const deleteRoute = (id: string) => {
    const updated = localRoutes.filter(r => r.id !== id);
    setLocalRoutes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('local-routes-updated'));
  };

  return { localRoutes, saveRoute, deleteRoute };
}
