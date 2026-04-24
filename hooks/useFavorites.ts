import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('route_favorites');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setFavorites(e.detail);
    };
    window.addEventListener('favoritesUpdated', handleUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleUpdate);
  }, []);

  const toggleFavorite = (id: string) => {
    // read latest from storage to prevent multiple hook instances from overriding each other
    const stored = localStorage.getItem('route_favorites');
    let currentFavorites: string[] = [];
    if (stored) {
      try {
        currentFavorites = JSON.parse(stored);
      } catch (e) {}
    }

    let next: string[];
    if (currentFavorites.includes(id)) {
      next = currentFavorites.filter(fv => fv !== id);
    } else {
      next = [id, ...currentFavorites];
      if (next.length > 6) {
        next = next.slice(0, 6);
      }
    }

    localStorage.setItem('route_favorites', JSON.stringify(next));
    setFavorites(next);
    window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: next }));
  };

  return { favorites, toggleFavorite };
}
