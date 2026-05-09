/**
 * 工具函数 - 对应原项目 lib/utils.ts
 * 微信小程序不支持 clsx/tailwind-merge，使用简单的类名拼接
 */

/**
 * 简单的类名合并
 */
function cn(...args) {
  return args.filter(Boolean).join(' ');
}

/**
 * 解析坐标字符串 "lat,lng" -> [lat, lng]
 */
function parseCoordinates(coordString) {
  if (!coordString || !coordString.includes(',')) return null;
  const parts = coordString.split(',');
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
}

/**
 * 格式化距离
 */
function formatDistance(km) {
  if (km >= 1000) {
    return (km / 1000).toFixed(1) + '千公里';
  }
  return km + 'km';
}

/**
 * 获取当前季节
 */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

/**
 * 获取路线状态颜色类名
 */
function getStatusColor(status) {
  if (!status) return { bg: 'bg-gray-500', text: 'text-white' };
  if (status.includes('开放') || status.includes('畅通')) {
    return { bg: 'bg-success', text: 'text-white', cardBg: 'bg-card-green' };
  }
  if (status.includes('封路') || status.includes('拥堵')) {
    return { bg: 'bg-warning', text: 'text-white', cardBg: 'bg-card-yellow' };
  }
  if (status.includes('封闭')) {
    return { bg: 'bg-danger', text: 'text-white', cardBg: 'bg-card-red' };
  }
  return { bg: 'bg-gray-500', text: 'text-white', cardBg: 'bg-card' };
}

/**
 * 获取路况点颜色
 */
function getRoadStatusDotColor(status) {
  if (!status) return '#9ca3af';
  const s = status.toLowerCase();
  if (s.includes('green') || s === '畅通') return '#22c55e';
  if (s.includes('red') || s === '封路' || s === '封闭') return '#ef4444';
  if (s.includes('yellow') || s.includes('orange') || s === '拥堵') return '#eab308';
  if (s.includes('blue')) return '#3b82f6';
  if (s.includes('purple')) return '#a855f7';
  if (s.includes('pink')) return '#ec4899';
  if (s.includes('brown')) return '#92400e';
  return '#9ca3af';
}

module.exports = {
  cn,
  parseCoordinates,
  formatDistance,
  getCurrentSeason,
  getStatusColor,
  getRoadStatusDotColor,
};
