/**
 * 数据获取 - 通过 HTTP API 获取路线和 POI 数据
 */

const BASE_URL = 'https://chinaroadtrip.xwabc.cn/api';
const CACHE_TTL = 60 * 1000; // 1分钟缓存

let routesCache = null;
let poisCache = null;

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
 * 获取所有 POI
 */
function getAllPOIs() {
  const now = Date.now();
  if (poisCache && now - poisCache.timestamp < CACHE_TTL) {
    return Promise.resolve(poisCache.data);
  }

  return request(`${BASE_URL}/pois`)
    .then((data) => {
      poisCache = { data: data || [], timestamp: Date.now() };
      return data || [];
    })
    .catch((err) => {
      console.error('Failed to fetch POIs:', err);
      return getMockPOIs();
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

/**
 * 图片缓存 - 使用 wx.downloadFile + 文件系统实现本地缓存，有效期一个月
 * 图片链接 15 分钟失效，所以需要立即下载到本地
 */
const IMAGE_CACHE_DIR = `${wx.env.USER_DATA_PATH}/image_cache`;
const IMAGE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 一个月
const IMAGE_CACHE_MANIFEST = `${IMAGE_CACHE_DIR}/manifest.json`;
let imageManifest = null;
// 记录下载失败的 URL，不再重试
const failedUrls = new Set();

function ensureCacheDir() {
  try {
    const fs = wx.getFileSystemManager();
    try { fs.accessSync(IMAGE_CACHE_DIR); } catch (e) {
      fs.mkdirSync(IMAGE_CACHE_DIR, true);
    }
  } catch (e) {}
}

function loadManifest() {
  if (imageManifest) return imageManifest;
  try {
    const fs = wx.getFileSystemManager();
    const data = fs.readFileSync(IMAGE_CACHE_MANIFEST, 'utf8');
    imageManifest = JSON.parse(data);
  } catch (e) {
    imageManifest = {};
  }
  return imageManifest;
}

function saveManifest() {
  try {
    const fs = wx.getFileSystemManager();
    fs.writeFileSync(IMAGE_CACHE_MANIFEST, JSON.stringify(imageManifest), 'utf8');
  } catch (e) {}
}

function urlToFilename(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  const ext = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
  return `${Math.abs(hash)}${ext ? '.' + ext[1].toLowerCase() : '.jpg'}`;
}

/**
 * 同步获取已缓存的本地路径，未缓存返回 null
 */
function getCachedImagePath(url) {
  const manifest = loadManifest();
  const entry = manifest[url];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > IMAGE_CACHE_TTL) {
    delete manifest[url];
    saveManifest();
    return null;
  }
  return entry.path;
}

/**
 * 下载图片到本地缓存，失败时记录到 failedUrls 不再重试
 */
function downloadAndCacheImage(url) {
  return new Promise((resolve, reject) => {
    if (failedUrls.has(url)) {
      reject(new Error('Previously failed URL'));
      return;
    }
    ensureCacheDir();
    const filename = urlToFilename(url);
    const filePath = `${IMAGE_CACHE_DIR}/${filename}`;

    // 检查文件是否已存在
    try {
      const fs = wx.getFileSystemManager();
      const stat = fs.statSync(filePath);
      if (stat && stat.size > 0) {
        const manifest = loadManifest();
        if (manifest[url] && Date.now() - manifest[url].timestamp < IMAGE_CACHE_TTL) {
          resolve(filePath);
          return;
        }
      }
    } catch (e) {}

    wx.downloadFile({
      url,
      filePath,
      success: (res) => {
        if (res.statusCode === 200) {
          const manifest = loadManifest();
          manifest[url] = { path: filePath, timestamp: Date.now() };
          saveManifest();
          resolve(filePath);
        } else {
          failedUrls.add(url);
          reject(new Error(`Download failed: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        failedUrls.add(url);
        reject(err);
      },
    });
  });
}

/**
 * 批量预缓存图片，返回 Promise 在全部完成后 resolve
 * 失败的 URL 不缓存，也不会阻塞其他图片
 */
function precacheImages(urls) {
  if (!Array.isArray(urls)) return Promise.resolve();
  const tasks = urls
    .filter((u) => u && u.startsWith('http'))
    .map((url) => {
      const cached = getCachedImagePath(url);
      if (cached) return Promise.resolve();
      return downloadAndCacheImage(url).catch(() => {});
    });
  return Promise.all(tasks);
}

/**
 * 获取图片的本地缓存路径，未缓存时返回空字符串
 * 使用 precacheImages 后再调用此函数即可获取本地路径
 */
function getCachedImage(url) {
  if (!url || !url.startsWith('http')) return url;
  const cached = getCachedImagePath(url);
  return cached || '';
}

module.exports = {
  getRoutes,
  getAllPOIs,
  getRouteById,
  getRoutePOIs,
  getCachedImage,
  precacheImages,
};
