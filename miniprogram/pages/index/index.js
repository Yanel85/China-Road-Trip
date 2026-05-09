const { getRoutes } = require('../../lib/notion');
const { getFavorites } = require('../../utils/storage');
const { getCurrentSeason } = require('../../utils/index');

Page({
  data: {
    routes: [],
    favorites: [],
    allTags: [],
    selectedTag: '',
    query: '',
    loading: true,
    filteredRoutes: [],
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    const favorites = getFavorites();
    this.setData({ favorites }, () => {
      this.updateFilteredRoutes();
    });
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const routes = await getRoutes();
      const favorites = getFavorites();
      const allTags = [...new Set(routes.flatMap((r) => r.tags))].filter(Boolean);

      this.setData({
        routes,
        favorites,
        allTags,
        loading: false,
      }, () => {
        this.updateFilteredRoutes();
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      this.setData({ loading: false });
    }
  },

  updateFilteredRoutes() {
    let filtered = [...(this.data.routes || [])];

    if (this.data.query) {
      const q = this.data.query.toLowerCase();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(q));
    }

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

  onSearchInput(e) {
    const query = e.detail.value;
    this.setData({ query }, () => {
      this.updateFilteredRoutes();
    });
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      selectedTag: this.data.selectedTag === tag ? '' : tag,
    }, () => {
      this.updateFilteredRoutes();
    });
  },

  onRouteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${id}`,
    });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
