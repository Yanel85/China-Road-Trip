export function parseCoordinates(coordString: string): [number, number] | null {
  if (!coordString || !coordString.includes(',')) return null;
  const parts = coordString.split(',');
  const lat = parseFloat(parts[0].trim());
  const lon = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lon)) return null;
  return [lat, lon];
}

/**
 * Calculates the shortest distance (in km) from a point p to a line segment a-b.
 * Uses a local equirectangular approximation which is highly accurate for distances < 100km.
 */
export function distancePointToSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // Earth radius in km
  const meanLat = toRad((a[0] + b[0]) / 2);

  // Map to local flat Cartesian grid (in kilometers)
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
  if (c1 <= 0) return Math.sqrt(wx * wx + wy * wy); // Point is before A

  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    const dx = px - bx;
    const dy = py - by;
    return Math.sqrt(dx * dx + dy * dy); // Point is after B
  }

  const ratio = c1 / c2;
  const projX = ax + ratio * vx;
  const projY = ay + ratio * vy;
  const dx = px - projX;
  const dy = py - projY;
  
  return Math.sqrt(dx * dx + dy * dy); // Distance to the projection point
}
