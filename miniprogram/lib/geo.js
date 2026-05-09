/**
 * 坐标计算工具 - 对应原项目 lib/geo.ts
 */

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
 * 计算点到线段的最短距离（km）
 * 使用等距投影近似，100km内非常精确
 */
function distancePointToSegment(p, a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // 地球半径 km
  const meanLat = toRad((a[0] + b[0]) / 2);

  const px = toRad(p[1]) * R * Math.cos(meanLat);
  const py = toRad(p[0]) * R;
  const ax = toRad(a[1]) * R * Math.cos(meanLat);
  const ay = toRad(a[0]) * R;
  const bx = toRad(b[1]) * R * Math.cos(meanLat);
  const by = toRad(b[0]) * R;

  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;

  const c1 = wx * vx + wy * vy;
  if (c1 <= 0) return Math.sqrt(wx * wx + wy * wy);

  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    const dx = px - bx;
    const dy = py - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const ratio = c1 / c2;
  const projX = ax + ratio * vx;
  const projY = ay + ratio * vy;
  const dx = px - projX;
  const dy = py - projY;

  return Math.sqrt(dx * dx + dy * dy);
}

module.exports = {
  parseCoordinates,
  distancePointToSegment,
};
