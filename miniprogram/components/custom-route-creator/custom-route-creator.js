const { getAllPOIs } = require('../../lib/notion');
const { saveLocalRoute } = require('../../utils/storage');

Component({
  properties: {
    isOpen: { type: Boolean, value: false },
  },

  data: {
    step: 'endpoints',
    name: '',
    allPois: [],
    startPoi: null,
    endPoi: null,
    selectedPois: [],
    startSearch: '',
    endSearch: '',
    focusedInput: '',
    startSearchResults: [],
    endSearchResults: [],
    canProceed: false,
  },

  observers: {
    'isOpen': function (isOpen) {
      if (isOpen) {
        this.loadPois();
        this.setData({ step: 'endpoints', name: '', startPoi: null, endPoi: null, selectedPois: [], startSearch: '', endSearch: '', focusedInput: '' });
      }
    },
    'startPoi, endPoi': function (startPoi, endPoi) {
      this.setData({ canProceed: !!(startPoi && endPoi) });
    },
  },

  methods: {
    async loadPois() {
      try {
        const allPois = await getAllPOIs();
        this.setData({ allPois });
      } catch (err) {
        console.error('Failed to load POIs:', err);
      }
    },

    onStartFocus() {
      this.setData({ focusedInput: 'start', startSearch: '' });
    },

    onStartBlur() {
      setTimeout(() => {
        if (this.data.focusedInput === 'start') {
          this.setData({ focusedInput: '' });
        }
      }, 200);
    },

    onEndFocus() {
      this.setData({ focusedInput: 'end', endSearch: '' });
    },

    onEndBlur() {
      setTimeout(() => {
        if (this.data.focusedInput === 'end') {
          this.setData({ focusedInput: '' });
        }
      }, 200);
    },

    onStartSearchInput(e) {
      const q = e.detail.value;
      const results = q ? this.data.allPois.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase()) || p.poiId.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 30) : [];
      this.setData({ startSearch: q, startSearchResults: results });
    },

    onEndSearchInput(e) {
      const q = e.detail.value;
      const results = q ? this.data.allPois.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase()) || p.poiId.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 30) : [];
      this.setData({ endSearch: q, endSearchResults: results });
    },

    onSelectStart(e) {
      const idx = e.currentTarget.dataset.index;
      const poi = this.data.startSearchResults[idx];
      this.setData({ startPoi: poi, startSearch: '', focusedInput: '', startSearchResults: [] });
    },

    onSelectEnd(e) {
      const idx = e.currentTarget.dataset.index;
      const poi = this.data.endSearchResults[idx];
      this.setData({ endPoi: poi, endSearch: '', focusedInput: '', endSearchResults: [] });
    },

    onNameInput(e) {
      this.setData({ name: e.detail.value });
    },

    onAction() {
      if (this.data.step === 'endpoints') {
        if (!this.data.startPoi || !this.data.endPoi) return;
        this.setData({
          step: 'naming',
          selectedPois: [this.data.startPoi, this.data.endPoi],
          canProceed: false,
        });
      } else {
        this.handleSave();
      }
    },

    handleSave() {
      const { name, selectedPois } = this.data;
      if (!name || selectedPois.length < 2) return;

      const newRoute = {
        id: 'custom_' + Date.now(),
        title: name,
        status: '自定义',
        distance: 0,
        tags: ['自定义'],
        season: ['春', '夏', '秋', '冬'],
        routeSequence: selectedPois.map(p => p.poiId),
        cover: 'https://picsum.photos/seed/custom/800/600',
        isCustom: true,
      };

      saveLocalRoute(newRoute);
      this.triggerEvent('saved');
      this.onClose();
    },

    onClose() {
      this.triggerEvent('close');
    },
  },
});
