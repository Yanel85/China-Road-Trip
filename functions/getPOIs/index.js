const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { Client } = require('@notionhq/client');

const notionToken = process.env.NOTION_TOKEN;
const poiDatabaseId = process.env.NOTION_POI_DATABASE_ID;

exports.main = async (event, context) => {
  const CACHE_TTL = 30 * 60 * 1000;
  const cacheKey = 'pois_cache';

  // 尝试从云缓存获取
  try {
    const cacheRes = await cloud.database().collection('cache').doc(cacheKey).get();
    if (cacheRes.data && Date.now() - cacheRes.data.timestamp < CACHE_TTL) {
      return { data: cacheRes.data.data };
    }
  } catch (e) {
    // 缓存不存在
  }

  if (!notionToken || !poiDatabaseId) {
    console.warn('NOTION_TOKEN or NOTION_POI_DATABASE_ID is missing. Using mock POIs.');
    return { data: getMockPOIs() };
  }

  try {
    const notion = new Client({ auth: notionToken, notionVersion: '2026-03-11' });
    const db = await notion.databases.retrieve({ database_id: poiDatabaseId });
    const dataSourceId = db.data_sources && db.data_sources[0] && db.data_sources[0].id;

    if (!dataSourceId) throw new Error('No data_source_id found in POI database');

    let allResults = [];
    let hasMore = true;
    let nextCursor = undefined;

    while (hasMore) {
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: nextCursor,
      });
      if (response.results) {
        allResults = allResults.concat(response.results);
      }
      nextCursor = response.next_cursor;
      hasMore = response.has_more;
    }

    const results = allResults
      .filter((page) => !page.in_trash)
      .map((page) => {
        const properties = page.properties;

        const extractText = (propName) => {
          const prop = properties[propName];
          if (!prop) return '';
          if (prop.title) return prop.title[0] && prop.title[0].plain_text || '';
          if (prop.rich_text) return prop.rich_text[0] && prop.rich_text[0].plain_text || '';
          if (prop.number) return prop.number.toString();
          return '';
        };

        const title = extractText('Name') || '未命名点位';
        const poiId = extractText('POI_ID') || '';
        const type = (properties['Type'] && properties['Type'].select && properties['Type'].select.name) || '景点';
        const sequence = (properties['Sequence'] && properties['Sequence'].number) || 0;
        const coordinates = extractText('Coordinates') || '';

        const roadStatusProp = properties['Road Status'] || properties['Road_Status'];
        const roadStatus = (roadStatusProp && roadStatusProp.select && roadStatusProp.select.name) || '畅通';

        const liveUpdateProp = properties['Live Update'] || properties['Live_Update'];
        const liveUpdate = liveUpdateProp && liveUpdateProp.date && liveUpdateProp.date.start || undefined;

        const altitude = (properties['Altitude'] && properties['Altitude'].number) || 0;
        const description = extractText('Description') || '';

        let images = [];
        const imageProp = properties['Images'];
        if (imageProp && imageProp.files && imageProp.files.length > 0) {
          images = imageProp.files.map((file) => (file.file && file.file.url) || (file.external && file.external.url)).filter(Boolean);
        }

        return {
          id: page.id,
          poiId,
          title,
          type,
          sequence,
          coordinates,
          roadStatus,
          liveUpdate,
          altitude,
          images,
          description,
        };
      });

    // 写入缓存
    try {
      await cloud.database().collection('cache').doc(cacheKey).set({
        data: { data: results, timestamp: Date.now() },
      });
    } catch (e) {
      console.warn('Cache write failed:', e.message);
    }

    return { data: results };
  } catch (error) {
    console.error('Notion API Error (POIs):', error.message);
    return { data: getMockPOIs() };
  }
};

function getMockPOIs() {
  return [
    {
      id: 'poi_1', poiId: 'S001', title: '折多山垭口', type: '垭口', sequence: 1,
      coordinates: '30.078,101.801', roadStatus: '拥堵', liveUpdate: new Date().toISOString(),
      altitude: 4298, images: ['https://picsum.photos/seed/zheduo/400/300'],
      description: '川藏线第一座雪山垭口，康巴第一关，海拔4298米，风景壮丽但路况复杂。',
    },
    {
      id: 'poi_2', poiId: 'D001', title: '新都桥', type: '地点', sequence: 2,
      coordinates: '29.873,101.503', roadStatus: '畅通', liveUpdate: new Date().toISOString(),
      altitude: 3300, images: ['https://picsum.photos/seed/xindouqiao/400/300'],
      description: '光影变换迷人的摄影家天堂，秋季景色最为美丽。',
    },
    {
      id: 'poi_3', poiId: 'D002', title: '理塘高城', type: '地点', sequence: 3,
      coordinates: '29.996,100.270', roadStatus: '畅通', liveUpdate: new Date().toISOString(),
      altitude: 4014, images: ['https://picsum.photos/seed/litang/400/300'],
      description: '世界高城，天空之城，仓央嘉措的故乡，可作补给点。',
    },
  ];
}
