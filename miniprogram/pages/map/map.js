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

      this.setData({
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

});
