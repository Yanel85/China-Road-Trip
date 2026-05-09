const { getRoutes, getAllPOIs } = require('../../lib/notion');
const { getLocalRoutes, getFavorites } = require('../../utils/storage');
const { getCurrentSeason } = require('../../utils/index');

Page({
  data: {
    routes: [],
    localRoutes: [],
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
    this.refreshLocalData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [routes, localRoutes] = await Promise.all([
        getRoutes(),
        Promise.resolve(getLocalRoutes()),
      ]);

      const favorites = getFavorites();
      const allTags = [...new Set(routes.flatMap((r) => r.tags))].filter(Boolean);
      const allAvailable = [...localRoutes, ...routes];

      this.setData({
        routes,
        localRoutes,
        favorites,
        allTags,
        allAvailable,
        loading: false,
      }, () => {
        this.updateFilteredRoutes();
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      this.setData({ loading: false });
    }
  },

  refreshLocalData() {
    const localRoutes = getLocalRoutes();
    const favorites = getFavorites();
    const allAvailable = [...localRoutes, ...(this.data.routes || [])];
    this.setData({ localRoutes, favorites, allAvailable }, () => {
      this.updateFilteredRoutes();
    });
  },

  updateFilteredRoutes() {
    let filtered = [...(this.data.allAvailable || [])];

    if (this.data.query) {
      const q = this.data.query.toLowerCase();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(q));
    }

    if (this.data.selectedTag && this.data.selectedTag !== '全部') {
      filtered = filtered.filter((r) => r.tags && r.tags.includes(this.data.selectedTag));
    }

    const custom = filtered.filter((r) => r.isCustom);
    custom.sort((a, b) => b.id.localeCompare(a.id));

    const regular = filtered.filter((r) => !r.isCustom);
    const currentSeason = getCurrentSeason();

    const getStatusScore = (status) => {
      if (status.includes('开放') || status.includes('畅通')) return 0;
      if (status.includes('封') || status.includes('封闭') || status.includes('封路')) return 2;
      return 1;
    };

    regular.sort((a, b) => {
      const aHasSeason = a.season && a.season.includes(currentSeason) ? 1 : 0;
      const bHasSeason = b.season && b.season.includes(currentSeason) ? 1 : 0;
      if (aHasSeason !== bHasSeason) return bHasSeason - aHasSeason;
      if (a.distance !== b.distance) return (b.distance || 0) - (a.distance || 0);
      return getStatusScore(a.status) - getStatusScore(b.status);
    });

    this.setData({ filteredRoutes: [...custom, ...regular] });
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
