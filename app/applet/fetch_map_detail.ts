import fs from 'fs';
import https from 'https';

https.get('https://geo.datav.aliyun.com/areas_v3/bound/100000.json', {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      let ObjectPaths: number[][][] = [];
      
      geojson.features.forEach((f: any) => {
        if (f.geometry.type === 'Polygon') {
          ObjectPaths.push(f.geometry.coordinates[0]);
        } else if (f.geometry.type === 'MultiPolygon') {
          f.geometry.coordinates.forEach((poly: any) => {
            ObjectPaths.push(poly[0]);
          });
        }
      });
      
      let totalPts = 0;
      ObjectPaths.forEach(p => totalPts += p.length);
      console.log('Original total points:', totalPts);

      // We want to keep around 1000~1500 points in total
      // So skip factor = totalPts / 1200
      const skipFactor = Math.max(1, Math.ceil(totalPts / 1500));
      
      const simplifiedPaths = ObjectPaths.map((path: number[][]) => {
        return path.filter((_, i) => i % skipFactor === 0 || i === path.length - 1);
      }).filter((path: number[][]) => path.length > 5); // filter out tiny islands entirely
      
      let newPts = 0;
      simplifiedPaths.forEach(p => newPts += p.length);
      console.log('New total points:', newPts);

      const tsContent = `export const chinaBorderCoords = ${JSON.stringify(simplifiedPaths)};`;
      fs.writeFileSync('lib/chinaPolygonData.ts', tsContent);
      console.log('Saved to lib/chinaPolygonData.ts');
    } catch(e) {
      console.error('Error parsing:', e);
    }
  });
}).on('error', e => console.error(e));
