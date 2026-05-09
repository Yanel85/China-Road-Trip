const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { Client } = require('@notionhq/client');

const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

exports.main = async (event, context) => {
  const CACHE_TTL = 30 * 60 * 1000; // 30分钟缓存
  const cacheKey = 'routes_cache';

  // 尝试从云缓存获取
  try {
    const cacheRes = await cloud.database().collection('cache').doc(cacheKey).get();
    if (cacheRes.data && Date.now() - cacheRes.data.timestamp < CACHE_TTL) {
      return { data: cacheRes.data.data };
    }
  } catch (e) {
    // 缓存不存在，继续获取
  }

  if (!notionToken || !databaseId) {
    console.warn('NOTION_TOKEN or NOTION_DATABASE_ID is missing. Using mock data.');
    return { data: getMockRoutes() };
  }

  try {
    const notion = new Client({ auth: notionToken, notionVersion: '2026-03-11' });
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const dataSourceId = db.data_sources && db.data_sources[0] && db.data_sources[0].id;

    if (!dataSourceId) throw new Error('No data_source_id found in database');

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

    const finalRoutes = allResults
      .filter((page) => !page.in_trash)
      .map((page, index) => {
        const properties = page.properties;

        const extractText = (propName) => {
          const prop = properties[propName];
          if (!prop) return '';
          if (prop.title) return prop.title[0] && prop.title[0].plain_text || '';
          if (prop.rich_text) return prop.rich_text[0] && prop.rich_text[0].plain_text || '';
          if (prop.number) return prop.number.toString();
          return '';
        };

        const title = extractText('Name') || '未命名路线';
        const realId = String(index + 1);

        const distanceProp = properties['Distance'];
        const distance = (distanceProp && distanceProp.number) || 0;

        const tagsProp = properties['Tags'];
        const tags = (tagsProp && tagsProp.multi_select && tagsProp.multi_select.map((t) => t.name.replace(/^#/, ''))) || [];

        const seasonProp = properties['Season'];
        const season = (seasonProp && seasonProp.multi_select && seasonProp.multi_select.map((t) => t.name)) || [];

        const statusProp = properties['Status'];
        const statusText = extractText('Status');
        const status = statusText || (statusProp && statusProp.status && statusProp.status.name) || (statusProp && statusProp.select && statusProp.select.name) || '开放';

        let cover = 'https://picsum.photos/seed/route_fall/800/600';
        const imageProp = properties['Cover'];
        if (imageProp && imageProp.files && imageProp.files.length > 0) {
          const file = imageProp.files[0];
          cover = (file.file && file.file.url) || (file.external && file.external.url) || cover;
        }

        const routeSeqString = extractText('Route_Sequence');
        const routeSequence = routeSeqString
          ? routeSeqString.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        return {
          id: realId,
          notionId: page.id,
          title,
          distance,
          tags,
          season,
          status,
          cover,
          routeSequence,
        };
      });

    // 写入缓存
    try {
      await cloud.database().collection('cache').doc(cacheKey).set({
        data: { data: finalRoutes, timestamp: Date.now() },
      });
    } catch (e) {
      console.warn('Cache write failed:', e.message);
    }

    return { data: finalRoutes };
  } catch (error) {
    console.error('Notion API Error (Routes):', error.message);
    return { data: getMockRoutes() };
  }
};

function getMockRoutes() {
  return [
    { id: '1', title: 'NOTION未配置 (测试数据)', distance: 2140, tags: ['进藏'], season: ['夏', '秋'], status: '开放', cover: 'https://picsum.photos/seed/route1/800/600', routeSequence: [] },
    { id: '2', title: '川藏南线 G318', distance: 2755, tags: ['极致风光', '高难度'], season: ['春', '夏'], status: '部分封路', cover: 'https://picsum.photos/seed/route2/800/600', routeSequence: ['S001', 'D001', 'D002'] },
  ];
}
