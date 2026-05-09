Component({
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '搜索...' },
  },
  methods: {
    onInput(e) {
      this.triggerEvent('input', { value: e.detail.value });
    },
  },
});
