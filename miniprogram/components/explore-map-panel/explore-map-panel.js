const { toggleFavorite } = require('../../utils/storage');

Component({
  properties: {
    routes: { type: Array, value: [] },
    favorites: { type: Array, value: [] },
  },

  observers: {
    'routes, favorites': function (routes, favorites) {
      this.buildFavItems(routes, favorites);
    },
  },

  data: {
    showList: false,
    favItems: [],
    visibleRoutes: [],
  },

  methods: {
    buildFavItems(routes, favorites) {
      const favItems = favorites
        .map((favId) => {
          const route = routes.find((r) => r.id === favId);
          if (!route) return null;
          return {
            id: favId,
            title: route.title,
            visible: this.data.visibleRoutes.includes(favId),
          };
        })
        .filter(Boolean);
      this.setData({ favItems });
    },

    onToggleList() {
      this.setData({ showList: !this.data.showList });
    },

    onToggleVisible(e) {
      const id = e.currentTarget.dataset.id;
      let visibleRoutes = [...this.data.visibleRoutes];
      if (visibleRoutes.includes(id)) {
        visibleRoutes = visibleRoutes.filter((v) => v !== id);
      } else {
        visibleRoutes.push(id);
      }
      this.setData({ visibleRoutes }, () => {
        this.buildFavItems(this.data.routes, this.data.favorites);
      });
    },

    onRemoveFavorite(e) {
      const id = e.currentTarget.dataset.id;
      toggleFavorite(id);
      const newFavs = this.data.favorites.filter((f) => f !== id);
      const newVisible = this.data.visibleRoutes.filter((v) => v !== id);
      this.setData({ favorites: newFavs, visibleRoutes: newVisible }, () => {
        this.buildFavItems(this.data.routes, newFavs);
      });
    },
  },
});
