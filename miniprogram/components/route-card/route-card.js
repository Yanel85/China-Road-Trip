const { getCachedImage, precacheImages } = require('../../lib/notion');

Component({
  properties: {
    data: { type: Object, value: {} },
  },

  data: {
    statusColor: '',
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
      // 先同步检查本地缓存
      const cached = getCachedImage(data.cover);
      if (cached) {
        this.setData({ coverUrl: cached });
        return;
      }
      // 没有缓存则异步下载，完成后更新
      this.setData({ coverUrl: '' });
      precacheImages([data.cover]).then(() => {
        const path = getCachedImage(data.cover);
        if (path) this.setData({ coverUrl: path });
      }).catch(() => {});
    },
  },
});
