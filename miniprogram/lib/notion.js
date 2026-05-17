/**
 * 数据获取 - 通过 HTTP API 获取路线和 POI 数据，支持本地缓存兜底
 */

const BASE_URL = 'https://chinaroadtrip.xwabc.cn/api';
const CACHE_TTL = 60 * 1000; // 1分钟内存缓存
const LOCAL_KEY_ROUTES = 'cached_routes';
const LOCAL_KEY_POIS = 'cached_pois_';
const LOCAL_TTL = 7 * 24 * 60 * 60 * 1000; // 本地缓存有效期 7 天
const REQUEST_TIMEOUT = 8000;

let routesCache = null;
let lastRoutesSource = 'none';

/**
 * 统一请求封装
 */
function request(url, retries = 0) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      timeout: REQUEST_TIMEOUT,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  }).catch((err) => {
    if (retries > 0) {
      return request(url, retries - 1);
    }
    throw err;
  });
}

/**
 * 保存数据到本地缓存
 */
function saveToStorage(key, data) {
  try {
    wx.setStorageSync(key, {
      data,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('Failed to save to local storage:', e);
  }
}

/**
 * 从本地缓存读取数据（检查有效期）
 */
function getFromStorage(key) {
  try {
    const stored = wx.getStorageSync(key);
    if (!stored || !stored.data) return null;
    if (Date.now() - stored.timestamp > LOCAL_TTL) return null;
    return stored.data;
  } catch (e) {
    return null;
  }
}

/**
 * 格式化路线数据
 */
function normalizeRoutes(routes) {
  return routes.map((r) => {
    if (r.season && typeof r.season === 'string') {
      r.season = r.season.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(r.season)) r.season = [];
    if (!Array.isArray(r.tags)) r.tags = [];
    return r;
  });
}

/**
 * 获取所有路线
 * 优先级：内存缓存 > 网络 > 本地缓存
 */
function getRoutes() {
  const now = Date.now();
  if (routesCache && now - routesCache.timestamp < CACHE_TTL) {
    lastRoutesSource = 'memory';
    return Promise.resolve(routesCache.data);
  }

  return request(`${BASE_URL}/routes`, 1)
    .then((data) => {
      const routes = normalizeRoutes(Array.isArray(data) ? data : []);
      saveToStorage(LOCAL_KEY_ROUTES, routes);
      routesCache = { data: routes, timestamp: Date.now() };
      lastRoutesSource = 'network';
      return routes;
    })
    .catch((err) => {
      console.error('Failed to fetch routes:', err);
      const cached = getFromStorage(LOCAL_KEY_ROUTES);
      if (cached) {
        routesCache = { data: cached, timestamp: Date.now() };
        lastRoutesSource = 'local';
        return cached;
      }
      lastRoutesSource = 'none';
      return [];
    });
}

/**
 * 根据 ID 获取路线
 */
function getRouteById(id) {
  return getRoutes().then((routes) => routes.find((r) => String(r.id) === String(id)) || null);
}

/**
 * 获取指定路线的 POI 列表
 */
function getRoutePOIs(routeId) {
  return request(`${BASE_URL}/routes/${routeId}/pois`)
    .then((data) => {
      const pois = Array.isArray(data) ? data : [];
      saveToStorage(LOCAL_KEY_POIS + routeId, pois);
      return pois;
    })
    .catch((err) => {
      console.error('Failed to fetch route POIs:', err);
      const cached = getFromStorage(LOCAL_KEY_POIS + routeId);
      if (cached) return cached;
      return [];
    });
}

function getLastRoutesSource() {
  return lastRoutesSource;
}

module.exports = {
  getRoutes,
  getRouteById,
  getRoutePOIs,
  getLastRoutesSource,
};

