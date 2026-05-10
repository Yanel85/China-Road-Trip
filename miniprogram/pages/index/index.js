const { getRoutes, getRoutePOIs, getCachedImage, precacheImages } = require('../../lib/notion');
const { parseCoordinates } = require('../../lib/geo');
const { getCurrentSeason } = require('../../utils/index');
const CHECKED_KEY = 'route_checked';

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
    sheetExpanded: true,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    const checkedIds = this.getChecked();
    this.setData({ checkedIds });
  },

  loadData() {
    this.setData({ loading: true });
    return getRoutes().then((routes) => {
      routes.forEach((r) => { r.id = String(r.id); });
      // 预缓存所有封面图
      const coverUrls = routes.map((r) => r.cover).filter(Boolean);
      return precacheImages(coverUrls).then(() => {
        // 缓存完成后，用本地路径替换 URL
        routes.forEach((r) => {
          if (r.cover) {
            const cached = getCachedImage(r.cover);
            if (cached) r._coverPath = cached;
          }
        });
        const allTags = [...new Set(routes.flatMap((r) => r.tags))].filter(Boolean);
        this.setData({ routes, allTags, loading: false }, () => {
          this.updateFilteredRoutes();
        });
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

    this.setData({ filteredRoutes: filtered });
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

  onCheckTap(e) {
    const id = String(e.currentTarget.dataset.id);
    let checkedIds = [...this.data.checkedIds];
    if (checkedIds.includes(id)) {
      checkedIds = checkedIds.filter((c) => c !== id);
    } else {
      checkedIds.push(id);
    }
    this.setData({ checkedIds });
    this.saveChecked(checkedIds);
    this.updateMapForChecked();
  },

  async updateMapForChecked() {
    const { checkedIds, routes } = this.data;
    if (checkedIds.length === 0) {
      this.setData({ mapPolyline: [] });
      return;
    }

    const allPolylines = [];

    for (const routeId of checkedIds) {
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
        }
      } catch (err) {
        console.error(`Failed to load POIs for route ${routeId}:`, err);
      }
    }

    this.setData({ mapPolyline: allPolylines });
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

  // ===== 路线卡片点击 → 进详情 =====

  onRouteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${id}`,
    });
  },

  // ===== 底部面板折叠/展开 =====

  onToggleSheet() {
    this.setData({ sheetExpanded: !this.data.sheetExpanded });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
