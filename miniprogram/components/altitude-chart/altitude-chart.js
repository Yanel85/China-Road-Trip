const defaultData = [
  { name: '成都', altitude: 500 },
  { name: '雅安', altitude: 600 },
  { name: '康定', altitude: 2560 },
  { name: '折多山', altitude: 4298 },
  { name: '新都桥', altitude: 3300 },
  { name: '理塘', altitude: 4014 },
  { name: '东达山', altitude: 5130 },
  { name: '林芝', altitude: 2900 },
  { name: '拉萨', altitude: 3650 },
];

Component({
  properties: {
    data: { type: Array, value: defaultData },
  },

  lifetimes: {
    ready() {
      this.drawChart();
    },
  },

  observers: {
    'data': function () {
      this.drawChart();
    },
  },

  methods: {
    drawChart() {
      const query = this.createSelectorQuery();
      query.select('#altitudeCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;
        const width = res[0].width;
        const height = res[0].height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        this.renderChart(ctx, width, height);
      });
    },

    renderChart(ctx, width, height) {
      const data = this.data.data && this.data.data.length > 0 ? this.data.data : defaultData;
      const padding = { top: 40, right: 30, bottom: 40, left: 10 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const maxAlt = Math.max(...data.map((d) => d.altitude));
      const minAlt = Math.min(...data.map((d) => d.altitude));
      const range = maxAlt - minAlt || 1;

      // 清空
      ctx.clearRect(0, 0, width, height);

      // 背景
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 16);
      ctx.fill();

      // 标题
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('海拔概览', width - 30, 24);

      // 绘制网格线
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 计算点位
      const points = data.map((d, i) => ({
        x: padding.left + (chartW / (data.length - 1)) * i,
        y: padding.top + chartH - ((d.altitude - minAlt) / range) * chartH,
        name: d.name,
        altitude: d.altitude,
      }));

      // 绘制渐变填充
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(44, 62, 80, 0.3)');
      gradient.addColorStop(1, 'rgba(44, 62, 80, 0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartH);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // 绘制线条
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // 绘制数据点
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#2C3E50';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 绘制首尾标签
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'start';
      ctx.fillText(points[0].name, points[0].x, padding.top + chartH + 24);
      ctx.textAlign = 'end';
      ctx.fillText(points[points.length - 1].name, points[points.length - 1].x, padding.top + chartH + 24);
    },
  },
});
