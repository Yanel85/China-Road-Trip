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
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 每次显示时刷新本地数据（自定义路线可能已更改）
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
    this.setData({ localRoutes, favorites, allAvailable });
  },

  // 搜索
  onSearchInput(e) {
    const query = e.detail.value;
    this.setData({ query });
  },

  // 标签筛选
  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      selectedTag: this.data.selectedTag === tag ? '' : tag,
    });
  },

  // 获取筛选后的路线
  getFilteredRoutes() {
    let filtered = [...(this.data.allAvailable || [])];

    if (this.data.query) {
      const q = this.data.query.toLowerCase();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(q));
    }

    if (this.data.selectedTag && this.data.selectedTag !== '全部') {
      filtered = filtered.filter((r) => r.tags.includes(this.data.selectedTag));
    }

    // 排序：自定义路线优先，然后按季节匹配度、距离、状态
    const custom = filtered.filter((r) => r.isCustom);
    custom.sort((a, b) => b.id.localeCompare(a.id));

    const regular = filtered.filter((r) => !r.isCustom);
    const currentSeason = getCurrentSeason();

    const getStatusScore = (status) => {
      if (status.includes('开放') || status.includes('畅通')) return 0;
      if (status.includes('封') || status.includes('封闭') || status.includes('封路'))
        return 2;
      return 1;
    };

    regular.sort((a, b) => {
      const aHasSeason = a.season.includes(currentSeason) ? 1 : 0;
      const bHasSeason = b.season.includes(currentSeason) ? 1 : 0;
      if (aHasSeason !== bHasSeason) return bHasSeason - aHasSeason;
      if (a.distance !== b.distance) return (b.distance || 0) - (a.distance || 0);
      return getStatusScore(a.status) - getStatusScore(b.status);
    });

    return [...custom, ...regular];
  },

  // 路线卡片点击
  onRouteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${id}`,
    });
  },

  // 删除自定义路线
  onDeleteRoute(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条自定义路线吗？',
      success: (res) => {
        if (res.confirm) {
          const { deleteLocalRoute } = require('../../utils/storage');
          const updated = deleteLocalRoute(id);
          this.refreshLocalData();
        }
      },
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
