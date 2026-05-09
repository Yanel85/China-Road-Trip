/**
 * Notion 数据获取 - 对应原项目 lib/notion.ts
 * 在小程序中通过云函数调用
 */

const CACHE_TTL = 60 * 1000; // 1分钟缓存

let routesCache = null;
let poisCache = null;

/**
 * 获取所有路线
 */
function getRoutes() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (routesCache && now - routesCache.timestamp < CACHE_TTL) {
      return resolve(routesCache.data);
    }

    wx.cloud.callFunction({
      name: 'getRoutes',
      success: (res) => {
        const data = res.result && res.result.data ? res.result.data : res.result;
        routesCache = { data: data || [], timestamp: Date.now() };
        resolve(data || []);
      },
      fail: (err) => {
        console.error('Failed to fetch routes:', err);
        // 使用 mock 数据作为兜底
        resolve(getMockRoutes());
      },
    });
  });
}

/**
 * 获取所有 POI
 */
function getAllPOIs() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (poisCache && now - poisCache.timestamp < CACHE_TTL) {
      return resolve(poisCache.data);
    }

    wx.cloud.callFunction({
      name: 'getPOIs',
      success: (res) => {
        const data = res.result && res.result.data ? res.result.data : res.result;
        poisCache = { data: data || [], timestamp: Date.now() };
        resolve(data || []);
      },
      fail: (err) => {
        console.error('Failed to fetch POIs:', err);
        resolve(getMockPOIs());
      },
    });
  });
}

/**
 * 根据 ID 获取路线
 */
function getRouteById(id) {
  return getRoutes().then((routes) => routes.find((r) => r.id === id) || null);
}

/**
 * 获取路线的 POI 列表
 */
function getRoutePOIs(routeId, routeSequence) {
  return getAllPOIs().then((allPois) => {
    if (!routeSequence || routeSequence.length === 0) return [];

    const structuralPois = allPois.filter((poi) => routeSequence.includes(poi.poiId));
    structuralPois.sort(
      (a, b) => routeSequence.indexOf(a.poiId) - routeSequence.indexOf(b.poiId)
    );

    return structuralPois;
  });
}

// Mock 数据兜底
function getMockRoutes() {
  return [
    {
      id: '1',
      title: 'NOTION未配置 (测试数据)',
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

function getMockPOIs() {
  return [
    {
      id: 'poi_1',
      poiId: 'S001',
      title: '折多山垭口',
      type: '垭口',
      sequence: 1,
      coordinates: '30.078,101.801',
      roadStatus: '拥堵',
      liveUpdate: new Date().toISOString(),
      altitude: 4298,
      images: ['https://picsum.photos/seed/zheduo/400/300'],
      description: '川藏线第一座雪山垭口，康巴第一关，海拔4298米，风景壮丽但路况复杂。',
    },
    {
      id: 'poi_2',
      poiId: 'D001',
      title: '新都桥',
      type: '地点',
      sequence: 2,
      coordinates: '29.873,101.503',
      roadStatus: '畅通',
      liveUpdate: new Date().toISOString(),
      altitude: 3300,
      images: ['https://picsum.photos/seed/xindouqiao/400/300'],
      description: '光影变换迷人的摄影家天堂，秋季景色最为美丽。',
    },
    {
      id: 'poi_3',
      poiId: 'D002',
      title: '理塘高城',
      type: '地点',
      sequence: 3,
      coordinates: '29.996,100.270',
      roadStatus: '畅通',
      liveUpdate: new Date().toISOString(),
      altitude: 4014,
      images: ['https://picsum.photos/seed/litang/400/300'],
      description: '世界高城，天空之城，仓央嘉措的故乡，可作补给点。',
    },
  ];
}

module.exports = {
  getRoutes,
  getAllPOIs,
  getRouteById,
  getRoutePOIs,
};
