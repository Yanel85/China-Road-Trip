/**
 * 本地存储工具 - 替代原项目的 localStorage + useFavorites hooks
 */

const FAVORITES_KEY = 'route_favorites';
const MAX_FAVORITES = 6;

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
  getFavorites,
  toggleFavorite,
  isFavorited,
};
