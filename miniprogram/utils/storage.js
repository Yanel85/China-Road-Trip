/**
 * 本地存储工具 - 替代原项目的 localStorage + useFavorites/useLocalRoutes hooks
 */

const ROUTES_KEY = 'custom_routes';
const FAVORITES_KEY = 'route_favorites';
const MAX_FAVORITES = 6;

// ========== 自定义路线 ==========

function getLocalRoutes() {
  try {
    const stored = wx.getStorageSync(ROUTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse local routes', e);
    return [];
  }
}

function saveLocalRoute(route) {
  const routes = getLocalRoutes();
  const updated = [route, ...routes.filter((r) => r.id !== route.id)];
  wx.setStorageSync(ROUTES_KEY, JSON.stringify(updated));
  return updated;
}

function deleteLocalRoute(id) {
  const routes = getLocalRoutes();
  const updated = routes.filter((r) => r.id !== id);
  wx.setStorageSync(ROUTES_KEY, JSON.stringify(updated));
  return updated;
}

function findLocalRoute(id) {
  const routes = getLocalRoutes();
  return routes.find((r) => r.id === id) || null;
}

// ========== 收藏路线 ==========

function getFavorites() {
  try {
    const stored = wx.getStorageSync(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  let next;
  if (favorites.includes(id)) {
    next = favorites.filter((f) => f !== id);
  } else {
    next = [id, ...favorites];
    if (next.length > MAX_FAVORITES) {
      next = next.slice(0, MAX_FAVORITES);
    }
  }
  wx.setStorageSync(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

function isFavorited(id) {
  return getFavorites().includes(id);
}

module.exports = {
  getLocalRoutes,
  saveLocalRoute,
  deleteLocalRoute,
  findLocalRoute,
  getFavorites,
  toggleFavorite,
  isFavorited,
};
