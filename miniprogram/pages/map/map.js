const { getRoutes, getAllPOIs } = require('../../lib/notion');
const { getFavorites } = require('../../utils/storage');

Page({
  data: {
    mapMarkers: [],
    routes: [],
    favorites: [],
    loading: true,
    latitude: 30.0,
    longitude: 101.0,
    scale: 5,
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [routes, allPois] = await Promise.all([getRoutes(), getAllPOIs()]);
      const favorites = getFavorites();

      // 筛选有坐标的 POI 作为地图标记
      const mapMarkers = allPois
        .filter(
          (poi) =>
            poi.coordinates &&
            poi.coordinates.includes(',') &&
            poi.altitude !== null &&
            poi.altitude !== undefined
        )
        .map((poi) => {
          const parts = poi.coordinates.split(',');
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          return {
            ...poi,
            latitude: lat,
            longitude: lng,
            iconPath: '/assets/marker.png',
            width: 24,
            height: 24,
          };
        })
        .filter((m) => !isNaN(m.latitude) && !isNaN(m.longitude));

      this.setData({
        mapMarkers,
        routes,
        favorites,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to load map data:', err);
      this.setData({ loading: false });
    }
  },

  onMarkerTap(e) {
    const markerId = e.markerId;
    const marker = this.data.mapMarkers.find((m) => m.id === markerId);
    if (marker) {
      wx.navigateTo({
        url: `/pages/poi-detail/poi-detail?id=${marker.id}`,
      });
    }
  },

  onBack() {
    wx.navigateBack();
  },
});
