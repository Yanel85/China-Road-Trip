const { getRoutes, getRoutePOIs } = require('../../lib/notion');
const { parseCoordinates } = require('../../lib/geo');
const { getCurrentSeason } = require('../../utils/index');
const CHECKED_KEY = 'route_checked';

// 截取线路简称：取｜前面部分，没有｜最多6字
function getShortName(title) {
  if (!title) return '';
  const parts = title.split('｜');
  let name = parts[0];
  if (name.length > 6) name = name.substring(0, 6);
  return name;
}

// 判断文字是否主要是中文/日文/韩文
function hasCJK(str) {
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(str);
}

// 判断文字是否主要是英文/数字（无CJK字符）
function isAlphanumeric(str) {
  return str.length > 0 && !hasCJK(str);
}

Page({
  data: {
    routes: [],
    allTags: [],
    selectedTag: '',
    loading: true,
    filteredRoutes: [],
    checkedIds: [],
    latitude: 33.5,
    longitude: 100.0,
    scale: 5,
    mapPolyline: [],
    mapMarkers: [],
    sheetExpanded: true,
    toastMessage: '',
    toastVisible: false,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    const checkedIds = this.getChecked();
    this.setData({ checkedIds }, () => {
      this.syncCheckedFlags();
    });
  },

  loadData() {
    this.setData({ loading: true });
    return getRoutes().then((routes) => {
      routes.forEach((r) => { r.id = String(r.id); });
      routes.forEach((r) => { 
        r._shortName = getShortName(r.title);
        r._isAlphanumeric = isAlphanumeric(r._shortName);
      });
      const allTags = [...new Set(routes.flatMap((r) => r.tags))].filter(Boolean);
      this.setData({ routes, allTags, loading: false }, () => {
        this.updateFilteredRoutes();
      });
    }).catch((err) => {
      console.error('Failed to load data:', err);
      this.setData({ loading: false });
    });
  },

  updateFilteredRoutes() {
    let filtered = [...(this.data.routes || [])];

    if (this.data.selectedTag && this.data.selectedTag !== '全部') {
      filtered = filtered.filter((r) => r.tags && r.tags.includes(this.data.selectedTag));
    }

    const currentSeason = getCurrentSeason();
    const getStatusScore = (status) => {
      if (status.includes('开放') || status.includes('畅通')) return 0;
      if (status.includes('封') || status.includes('封闭') || status.includes('封路')) return 2;
      return 1;
    };

    filtered.sort((a, b) => {
      const aHasSeason = a.season && a.season.includes(currentSeason) ? 1 : 0;
      const bHasSeason = b.season && b.season.includes(currentSeason) ? 1 : 0;
      if (aHasSeason !== bHasSeason) return bHasSeason - aHasSeason;
      if (a.distance !== b.distance) return (b.distance || 0) - (a.distance || 0);
      return getStatusScore(a.status) - getStatusScore(b.status);
    });

    this.setData({ filteredRoutes: filtered }, () => {
      this.syncCheckedFlags();
    });
  },

  // ===== 勾选线路 =====

  getChecked() {
    try {
      const stored = wx.getStorageSync(CHECKED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  saveChecked(ids) {
    wx.setStorageSync(CHECKED_KEY, JSON.stringify(ids));
  },

  // 将 checkedIds 状态同步到 filteredRoutes 每个 item 的 _checked 属性
  syncCheckedFlags() {
    const checkedSet = new Set(this.data.checkedIds);
    const filteredRoutes = this.data.filteredRoutes.map((r) => ({
      ...r,
      _checked: checkedSet.has(r.id),
    }));
    this.setData({ filteredRoutes });
  },

  onClearChecked() {
    const checkedIds = [];
    const filteredRoutes = this.data.filteredRoutes.map((r) => ({ ...r, _checked: false }));
    this.setData({ checkedIds, filteredRoutes, mapPolyline: [], mapMarkers: [], latitude: 33.5, longitude: 100.0, scale: 5 });
    this.saveChecked(checkedIds);
  },

  // 显示顶部提示消息
  showToast(msg) {
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this.setData({ toastMessage: msg, toastVisible: true });
    this._toastTimer = setTimeout(() => {
      this.setData({ toastVisible: false });
    }, 2000);
  },

  onCheckTap(e) {
    const id = String(e.currentTarget.dataset.id);
    const route = this.data.routes.find((r) => String(r.id) === id);
    let checkedIds = [...this.data.checkedIds];
    if (checkedIds.includes(id)) {
      checkedIds = checkedIds.filter((c) => c !== id);
    } else {
      checkedIds.push(id);
      this.showToast(`${route ? route.title : '线路'}已显示`);
    }
    this.setData({ checkedIds });
    this.saveChecked(checkedIds);
    this.syncCheckedFlags();
    this.updateMapForChecked();
  },

  async updateMapForChecked() {
    const { checkedIds, routes } = this.data;
    if (checkedIds.length === 0) {
      this.setData({ mapPolyline: [], mapMarkers: [], latitude: 33.5, longitude: 100.0, scale: 5 });
      return;
    }

    const allPolylines = [];
    const allMarkers = [];
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

    for (let i = 0; i < checkedIds.length; i++) {
      const routeId = checkedIds[i];
      const route = routes.find((r) => String(r.id) === String(routeId));
      if (!route) continue;

      try {
        const pois = await getRoutePOIs(routeId);
        const routePoiIds = route.routeSequence || [];
        const routePoisMap = {};
        pois.forEach((p) => { routePoisMap[p.poiId] = p; });

        const points = routePoiIds
          .map((poiId) => routePoisMap[poiId])
          .filter((p) => p && p.coordinates && p.coordinates.includes(','))
          .map((p) => {
            const coords = parseCoordinates(p.coordinates);
            return coords ? { latitude: coords[0], longitude: coords[1] } : null;
          })
          .filter(Boolean);

        if (points.length > 1) {
          allPolylines.push({
            points,
            color: '#F39C12',
            width: 3,
            arrowLine: true,
          });
          // 取中点作为 marker 位置
          const midIdx = Math.floor(points.length / 2);
          const mid = points[midIdx];
          allMarkers.push({
            id: i + 1,
            latitude: mid.latitude,
            longitude: mid.longitude,
            width: 24,
            height: 24,
            callout: {
              content: route._shortName || route.title,
              color: '#ffffff',
              fontSize: 11,
              borderRadius: 4,
              borderWidth: 0,
              bgColor: '#F39C12',
              padding: 4,
              display: 'ALWAYS',
            },
          });
          points.forEach((pt) => {
            if (pt.latitude < minLat) minLat = pt.latitude;
            if (pt.latitude > maxLat) maxLat = pt.latitude;
            if (pt.longitude < minLng) minLng = pt.longitude;
            if (pt.longitude > maxLng) maxLng = pt.longitude;
          });
        }
      } catch (err) {
        console.error(`Failed to load POIs for route ${routeId}:`, err);
      }
    }

    const update = { mapPolyline: allPolylines, mapMarkers: allMarkers };

    if (allPolylines.length > 0 && minLat !== Infinity) {
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latSpan = maxLat - minLat;
      const lngSpan = (maxLng - minLng) * Math.cos(centerLat * Math.PI / 180);
      const maxSpan = Math.max(latSpan, lngSpan, 0.01);
      const targetViewport = maxSpan / 0.8;
      let scale = Math.ceil(3 + Math.log2(60 / targetViewport));
      scale = Math.max(3, Math.min(20, scale));

      update.latitude = centerLat;
      update.longitude = centerLng;
      update.scale = scale;
    }

    this.setData(update);
  },

  // ===== 搜索和筛选 =====

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      selectedTag: this.data.selectedTag === tag ? '' : tag,
    }, () => {
      this.updateFilteredRoutes();
    });
  },

  // ===== 复制网址 =====
  onCopyUrl() {
    wx.setClipboardData({
      data: 'go.xwabc.cn',
      success: () => {
        wx.showToast({
          title: '网址已复制，请用电脑浏览器打开',
          icon: 'none',
          duration: 3000,
        });
      },
    });
  },

  // ===== 路线卡片点击 → 进详情 =====

  onRouteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${id}`,
    });
  },

  // ===== 地图 marker 点击 =====
  onMarkerTap(e) {
    const markerId = e.markerId;
    const idx = markerId - 1;
    const routeId = this.data.checkedIds[idx];
    if (!routeId) return;
    const route = this.data.routes.find((r) => String(r.id) === String(routeId));
    if (route) {
      this.showToast(`${route.title}已显示`);
    }
  },

  // ===== 底部面板折叠/展开 =====

  onToggleSheet() {
    this.setData({ sheetExpanded: !this.data.sheetExpanded });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    return {
      title: '探索西部自驾路书',
      path: '/pages/index/index',
    };
  },

  onShareTimeline() {
    return {
      title: '探索西部自驾路书',
    };
  },
});
