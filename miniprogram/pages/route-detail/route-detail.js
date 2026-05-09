const { getRouteById, getRoutePOIs } = require('../../lib/notion');
const { parseCoordinates } = require('../../lib/geo');

Page({
  data: {
    route: null,
    pois: [],
    sortedPois: [],
    sortBy: 'sequence',
    sortAsc: true,
    isExpanded: true,
    selectedPOI: null,
    chartData: [],
    seasonText: '',
    loading: true,
    latitude: 30.0,
    longitude: 101.0,
    scale: 6,

    polyline: [],
  },

  onLoad(options) {
    const { id } = options;
    this.routeId = id;
    this.loadRouteData(id);
  },

  async loadRouteData(id) {
    this.setData({ loading: true });
    try {
      let route = await getRouteById(id);
      let pois = [];
      if (route) {
        pois = await getRoutePOIs(id);
      }

      if (!route) {
        this.setData({ loading: false });
        return;
      }

      // 构建路线 polyline - 只连线地点和垭口，忽略景区
      const points = pois
        .filter((p) => (p.type === '地点' || p.type === '垭口') && p.coordinates && p.coordinates.includes(','))
        .map((p) => {
          const coords = parseCoordinates(p.coordinates);
          return coords ? { latitude: coords[0], longitude: coords[1] } : null;
        })
        .filter(Boolean);

      const polyline = points.length > 1
        ? [{ points, color: '#F39C12', width: 3, arrowLine: true }]
        : [];

      // 海拔图表数据
      const chartPois = pois
        .filter(
          (p) =>
            route.routeSequence &&
            route.routeSequence.includes(p.poiId) &&
            (p.type === '地点' || p.type === '垭口') &&
            typeof p.altitude === 'number'
        )
        .sort(
          (a, b) =>
            route.routeSequence.indexOf(a.poiId) -
            route.routeSequence.indexOf(b.poiId)
        );

      // 选取关键点（起止、最高最低、均匀采样）
      let selectedChartPois = [];
      if (chartPois.length > 0) {
        const essential = new Set();
        essential.add(chartPois[0].poiId);
        essential.add(chartPois[chartPois.length - 1].poiId);
        let highest = chartPois[0];
        let lowest = chartPois[0];
        chartPois.forEach((p) => {
          if (p.altitude > highest.altitude) highest = p;
          if (p.altitude < lowest.altitude) lowest = p;
        });
        essential.add(highest.poiId);
        essential.add(lowest.poiId);

        const essentialPois = chartPois.filter((p) => essential.has(p.poiId));
        const targetCount = Math.max(5, Math.min(18, chartPois.length));
        const remainingCount = targetCount - essentialPois.length;

        selectedChartPois = [...essentialPois];
        if (remainingCount > 0) {
          const candidates = chartPois.filter((p) => !essential.has(p.poiId));
          if (candidates.length <= remainingCount) {
            selectedChartPois = selectedChartPois.concat(candidates);
          } else {
            const step = candidates.length / remainingCount;
            for (let i = 0; i < remainingCount; i++) {
              selectedChartPois.push(candidates[Math.floor(i * step)]);
            }
          }
        }
        selectedChartPois.sort(
          (a, b) =>
            route.routeSequence.indexOf(a.poiId) -
            route.routeSequence.indexOf(b.poiId)
        );
      }

      const chartData = selectedChartPois.map((p) => ({
        name: p.title,
        altitude: p.altitude || 0,
      }));

      // 设置地图中心点
      let centerLat = 30.0;
      let centerLng = 101.0;
      if (points.length > 0) {
        centerLat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
        centerLng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
      }

      let seasonText = '';
      if (Array.isArray(route.season)) {
        seasonText = route.season.join('/');
      } else if (typeof route.season === 'string') {
        seasonText = route.season;
      }

      this.setData({
        route,
        pois,
        sortedPois: pois,
        chartData,
        seasonText,
        polyline,
        latitude: centerLat,
        longitude: centerLng,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to load route:', err);
      this.setData({ loading: false });
    }
  },

  // 排序
  onSortTap(e) {
    const type = e.currentTarget.dataset.type;
    let { sortBy, sortAsc, pois, route } = this.data;

    if (sortBy === type) {
      sortAsc = !sortAsc;
    } else {
      sortBy = type;
      sortAsc = type === 'roadStatus' ? false : true;
    }

    const statusScore = {
      '畅通': 0, 'green': 0,
      '拥堵': 1, 'yellow': 1,
      '封路': 2, 'red': 2,
    };

    const sorted = [...pois].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'sequence') {
        const getSeqVal = (poi) => {
          if (route.routeSequence) {
            const idx = route.routeSequence.indexOf(poi.poiId);
            if (idx !== -1) return idx;
          }
          return 1000 + (poi.sequence || 999);
        };
        diff = getSeqVal(a) - getSeqVal(b);
      } else if (sortBy === 'altitude') {
        diff = (a.altitude || 0) - (b.altitude || 0);
      } else if (sortBy === 'roadStatus') {
        diff = (statusScore[a.roadStatus] ?? 0) - (statusScore[b.roadStatus] ?? 0);
      }
      return sortAsc ? diff : -diff;
    });

    this.setData({ sortBy, sortAsc, sortedPois: sorted });
  },

  // 折叠/展开
  onToggleExpand() {
    this.setData({ isExpanded: !this.data.isExpanded });
  },

  // POI 点击
  onPOITap(e) {
    const poi = e.currentTarget.dataset.poi;
    this.setData({ selectedPOI: poi, isExpanded: false });
  },

  // 关闭 POI 详情
  onClosePOI() {
    this.setData({ selectedPOI: null });
  },

  // 导航
  onNavigate() {
    const poi = this.data.selectedPOI;
    if (!poi || !poi.coordinates) return;

    const coords = parseCoordinates(poi.coordinates);
    if (!coords) return;

    wx.openLocation({
      latitude: coords[0],
      longitude: coords[1],
      name: poi.title,
      scale: 15,
    });
  },

});
