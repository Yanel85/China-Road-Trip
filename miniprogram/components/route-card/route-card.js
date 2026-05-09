const { toggleFavorite, isFavorited } = require('../../utils/storage');
const { getCachedImage } = require('../../lib/notion');

Component({
  properties: {
    data: { type: Object, value: {} },
    isFavorited: { type: Boolean, value: false },
  },

  data: {
    statusColor: '',
    statusBg: '',
    cardBg: '',
    statusText: '',
    seasonText: '',
    coverUrl: '',
  },

  lifetimes: {
    attached() {
      this.updateStatusStyle();
    },
  },

  observers: {
    'data': function () {
      this.updateStatusStyle();
      this.updateSeasonText();
      this.updateCover();
    },
  },

  methods: {
    updateStatusStyle() {
      const { data } = this.data;
      if (!data || !data.status) return;

      const status = data.status || '未知';
      let statusColor = 'status-gray';
      let cardBg = 'card-default';

      if (status.includes('开放') || status.includes('clear')) {
        statusColor = 'status-success';
        cardBg = 'card-green';
      } else if (status.includes('封路') || status.includes('congested')) {
        statusColor = 'status-warning';
        cardBg = 'card-yellow';
      } else if (status.includes('封闭') || status.includes('closed')) {
        statusColor = 'status-danger';
        cardBg = 'card-red';
      }

      this.setData({ statusColor, cardBg, statusText: status });
    },

    updateSeasonText() {
      const { data } = this.data;
      if (!data || !data.season) return;
      let seasonText = '';
      if (Array.isArray(data.season)) {
        seasonText = data.season.join('/');
      } else if (typeof data.season === 'string') {
        seasonText = data.season;
      }
      this.setData({ seasonText });
    },

    updateCover() {
      const { data } = this.data;
      if (!data || !data.cover) return;
      this.setData({ coverUrl: getCachedImage(data.cover) });
    },

    onFavoriteTap(e) {
      // 阻止冒泡
      const id = this.data.data.id;
      const newFavorites = toggleFavorite(id);
      this.triggerEvent('favoritechange', { id, isFavorited: newFavorites.includes(id) });
    },

    onCardTap() {
      const id = this.data.data.id;
      wx.navigateTo({
        url: `/pages/route-detail/route-detail?id=${id}`,
      });
    },
  },
});
