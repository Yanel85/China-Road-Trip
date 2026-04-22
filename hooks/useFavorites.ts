import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('route_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      // If already has, remove it
      if (prev.includes(id)) {
        const next = prev.filter(fv => fv !== id);
        localStorage.setItem('route_favorites', JSON.stringify(next));
        return next;
      }
      // If not, add to the front (latest)
      let next = [id, ...prev];
      if (next.length > 6) {
        next = next.slice(0, 6);
      }
      localStorage.setItem('route_favorites', JSON.stringify(next));
      return next;
    });
  };

  return { favorites, toggleFavorite };
}
