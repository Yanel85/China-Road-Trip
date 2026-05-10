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

module.exports = {
  parseCoordinates,
};
