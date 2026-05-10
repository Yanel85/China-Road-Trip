/**
 * 数据获取 - 通过 HTTP API 获取路线和 POI 数据
 */

const BASE_URL = 'https://chinaroadtrip.xwabc.cn/api';
const CACHE_TTL = 60 * 1000; // 1分钟缓存

let routesCache = null;

function request(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
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
  });
}

/**
 * 获取所有路线
 */
function getRoutes() {
  const now = Date.now();
  if (routesCache && now - routesCache.timestamp < CACHE_TTL) {
    return Promise.resolve(routesCache.data);
  }

  return request(`${BASE_URL}/routes`)
    .then((data) => {
      const routes = Array.isArray(data) ? data : [];
      routes.forEach((r) => {
        if (r.season && typeof r.season === 'string') {
          r.season = r.season.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
        }
        if (!Array.isArray(r.season)) r.season = [];
        if (!Array.isArray(r.tags)) r.tags = [];
      });
      routesCache = { data: routes, timestamp: Date.now() };
      return routes;
    })
    .catch((err) => {
      console.error('Failed to fetch routes:', err);
      return getMockRoutes();
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
  return request(`${BASE_URL}/routes/${routeId}/pois`).then((data) => {
    return Array.isArray(data) ? data : [];
  }).catch((err) => {
    console.error('Failed to fetch route POIs:', err);
    return [];
  });
}

// Mock 数据兜底
function getMockRoutes() {
  return [
    {
      id: '1',
      title: 'API未配置 (测试数据)',
      distance: 2140,
      tags: ['进藏'],
      season: ['夏', '秋'],
      status: '开放',
      cover: 'https://picsum.photos/seed/route1/800/600',
      routeSequence: [],
    },
    {
      id: '2',
      title: '川藏南线 G318',
      distance: 2755,
      tags: ['极致风光', '高难度'],
      season: ['春', '夏'],
      status: '部分封路',
      cover: 'https://picsum.photos/seed/route2/800/600',
      routeSequence: ['S001', 'D001', 'D002'],
    },
  ];
}

module.exports = {
  getRoutes,
  getRouteById,
  getRoutePOIs,
};
