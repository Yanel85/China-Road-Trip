const { getAllPOIs } = require('../../lib/notion');
const { parseCoordinates } = require('../../lib/geo');

Page({
  data: {
    poi: null,
    loading: true,
  },

  onLoad(options) {
    const { id } = options;
    this.loadPOI(id);
  },

  async loadPOI(id) {
    try {
      const allPois = await getAllPOIs();
      const poi = allPois.find((p) => p.id === id || p.poiId === id);
      this.setData({ poi, loading: false });
    } catch (err) {
      console.error('Failed to load POI:', err);
      this.setData({ loading: false });
    }
  },

  onNavigate() {
    const poi = this.data.poi;
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

  onShareAppMessage() {
    const poi = this.data.poi;
    return {
      title: poi ? poi.title : '点位详情',
      path: `/pages/poi-detail/poi-detail?id=${poi.id}`,
    };
  },
});
