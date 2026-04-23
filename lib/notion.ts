import { Client } from "@notionhq/client";
import { RouteData, POIData, RouteStatus, POIType, RoadStatus } from "@/types";
import { parseCoordinates, distancePointToSegment } from "./geo";

const CACHE_TTL = process.env.NODE_ENV === 'development' ? 60 * 1000 : 30 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let routesCache: CacheEntry<RouteData[]> | null = null;
let poisCache: Record<string, CacheEntry<POIData[]>> = {};

const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;
const poiDatabaseId = process.env.NOTION_POI_DATABASE_ID;

const notion = new Client({ 
  auth: notionToken,
  notionVersion: "2026-03-11"
});

// ========================
// Routes Database (主表)
// ========================

export async function getRoutes(): Promise<RouteData[]> {
  const now = Date.now();
  if (routesCache && now - routesCache.timestamp < CACHE_TTL) {
    return routesCache.data;
  }

  if (!notionToken || !databaseId) {
    console.warn("NOTION_TOKEN or NOTION_DATABASE_ID is missing. Using mock data.");
    return getMockRoutes();
  }

  try {
    // 2026-03-11 API requires retrieving the database to get its data_source_id before querying
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const dataSourceId = (db as any).data_sources?.[0]?.id;

    if (!dataSourceId) throw new Error("No data_source_id found in database");

    let allResults: any[] = [];
    let hasMore = true;
    let nextCursor: string | undefined = undefined;

    while (hasMore) {
      const response: any = await (notion as any).dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: nextCursor,
      });
      if (response.results) {
         allResults = allResults.concat(response.results);
      }
      nextCursor = response.next_cursor;
      hasMore = response.has_more;
    }
     console.log(`成功获取到 ${allResults.length} 条路线数据`);

    const finalRoutes = allResults
      .filter((page: any) => !page.in_trash)
      .map((page: any, index: number) => {
      const properties = page.properties;
      
      const extractText = (propName: string) => {
          const prop = properties[propName];
          if (!prop) return "";
          if (prop.title) return prop.title[0]?.plain_text || "";
          if (prop.rich_text) return prop.rich_text[0]?.plain_text || "";
          if (prop.number) return prop.number.toString();
          return "";
      };

      const title = extractText("Name") || "未命名路线";
      const realId = String(index + 1);

      const distanceProp = properties["Distance"];
      const distance = distanceProp?.number || 0;

      const tagsProp = properties["Tags"];
      const tags = tagsProp?.multi_select?.map((t: any) => t.name.replace(/^#/, '')) || [];

      const seasonProp = properties["Season"];
      const season = seasonProp?.multi_select?.map((t: any) => t.name) || [];

      const statusProp = properties["Status"];
      const statusText = extractText("Status");
      const status = (statusText || statusProp?.status?.name || statusProp?.select?.name || "开放") as RouteStatus;

      let cover = "https://picsum.photos/seed/route_fall/800/600";
      const imageProp = properties["Cover"];
      if (imageProp?.files?.length > 0) {
          const file = imageProp.files[0];
          cover = file.file?.url || file.external?.url || cover;
      }

      const routeSeqString = extractText("Route_Sequence");
      const routeSequence = routeSeqString 
        ? routeSeqString.split(',').map((s: string) => s.trim()).filter(Boolean)
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

    routesCache = { data: finalRoutes, timestamp: Date.now() };
    return finalRoutes;
  } catch (error: any) {
    console.error("Notion API Error (Routes Database):", error.message);
    return getMockRoutes();
  }
}

export async function getRouteById(id: string): Promise<RouteData | null> {
  const routes = await getRoutes();
  return routes.find((r) => r.id === id) || null;
}

// ========================
// POIs Database (从表)
// ========================

export async function getAllPOIs(): Promise<POIData[]> {
  const cacheKey = "all_pois";
  const now = Date.now();
  if (poisCache[cacheKey] && now - poisCache[cacheKey].timestamp < CACHE_TTL) {
    return poisCache[cacheKey].data;
  }

  if (!notionToken || !poiDatabaseId) {
      console.warn("NOTION_TOKEN or NOTION_POI_DATABASE_ID is missing. Using mock POIs.");
      return getMockPOIs();
  }
  
  try {
    const db = await notion.databases.retrieve({ database_id: poiDatabaseId });
    const dataSourceId = (db as any).data_sources?.[0]?.id;

    if (!dataSourceId) throw new Error("No data_source_id found in POI database");

    let allResults: any[] = [];
    let hasMore = true;
    let nextCursor: string | undefined = undefined;

    while (hasMore) {
      const response: any = await (notion as any).dataSources.query({
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
      .filter((page: any) => !page.in_trash)
      .map((page: any, index: number) => {
      const properties = page.properties;
      if (index === 0) console.log("SAMPLE POI PROPS: ", JSON.stringify(properties, null, 2));
      const extractText = (propName: string) => {
          const prop = properties[propName];
          if (!prop) return "";
          if (prop.title) return prop.title[0]?.plain_text || "";
          if (prop.rich_text) return prop.rich_text[0]?.plain_text || "";
          if (prop.number) return prop.number.toString();
          return "";
      };

      const title = extractText("Name") || "未命名点位";
      const poiId = extractText("POI_ID") || "";
      const type = (properties["Type"]?.select?.name || "景点") as POIType;
      const sequence = properties["Sequence"]?.number || 0;
      const coordinates = extractText("Coordinates") || "";
      
      const roadStatusProp = properties["Road Status"] || properties["Road_Status"];
      const roadStatus = (roadStatusProp?.select?.name || "畅通") as RoadStatus;
      
      const liveUpdateProp = properties["Live Update"] || properties["Live_Update"];
      const liveUpdate = liveUpdateProp?.date?.start || undefined;
      
      const altitude = properties["Altitude"]?.number || 0;
      const description = extractText("Description") || "";

      let images: string[] = [];
      const imageProp = properties["Images"];
      if (imageProp?.files?.length > 0) {
          images = imageProp.files.map((file: any) => file.file?.url || file.external?.url).filter(Boolean);
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

    poisCache[cacheKey] = { data: results, timestamp: Date.now() };
    return results;
  } catch (error: any) {
    console.error("Notion API Error (POIs Database):", error.message);
    return getMockPOIs();
  }
}

export async function getRoutePOIs(routeId: string, routeSequence?: string[]): Promise<POIData[]> {
  const cacheKey = `${routeId}_seq`;
  const now = Date.now();
  if (poisCache[cacheKey] && now - poisCache[cacheKey].timestamp < CACHE_TTL) {
    return poisCache[cacheKey].data;
  }

  const results = await getAllPOIs();
  if (!routeSequence || routeSequence.length === 0) return [];

  // 1. Get structural points (D and S) assigned to this route
  const structuralPois = results.filter((poi: POIData) => routeSequence.includes(poi.poiId));
  // Sort them so they match the text sequence order exactly
  structuralPois.sort((a, b) => routeSequence.indexOf(a.poiId) - routeSequence.indexOf(b.poiId));

  // 2. Build coordinate segments for the route to check distances
  const structuralCoords = structuralPois
    .map(p => parseCoordinates(p.coordinates))
    .filter(c => c !== null) as [number, number][];

  // 3. Find candidate scattered points (V, P, etc. not in routeSequence)
  const candidatePois = results.filter((poi: POIData) => !routeSequence.includes(poi.poiId));
  const attachedSpots: POIData[] = [];

  const MAX_DISTANCE_KM = 80; // 30km radius for auto-snapping

  if (structuralCoords.length > 0) {
    for (const poi of candidatePois) {
      const pCoords = parseCoordinates(poi.coordinates);
      if (!pCoords) continue;

      let isAttached = false;

      if (structuralCoords.length === 1) {
         // Only one point in route
         const dist = distancePointToSegment(pCoords, structuralCoords[0], structuralCoords[0]);
         if (dist <= MAX_DISTANCE_KM) isAttached = true;
      } else {
         // Check distance to closest path segment
         for (let i = 0; i < structuralCoords.length - 1; i++) {
            const dist = distancePointToSegment(pCoords, structuralCoords[i], structuralCoords[i + 1]);
            if (dist <= MAX_DISTANCE_KM) {
              isAttached = true;
              break;
            }
         }
      }

      if (isAttached) {
        attachedSpots.push(poi);
      }
    }
  }

  // Final merge (front-end layout handles their respective sequence sorting)
  const finalPois = [...structuralPois, ...attachedSpots];

  poisCache[cacheKey] = { data: finalPois, timestamp: Date.now() };
  return finalPois;
}

// ========================
// Error Fallbacks (Mock Data)
// ========================

async function getMockRoutes(): Promise<RouteData[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [
    { id: "1", title: "NOTION未配置 (测试数据)", distance: 2140, tags: ["进藏"], season: ["夏", "秋"], status: "开放", cover: "https://picsum.photos/seed/route1/800/600", routeSequence: [] },
    { id: "2", title: "川藏南线 G318", distance: 2755, tags: ["极致风光", "高难度"], season: ["春", "夏"], status: "部分封路", cover: "https://picsum.photos/seed/route2/800/600", routeSequence: ["S001", "D001", "D002"] },
  ];
}

async function getMockPOIs(): Promise<POIData[]> {
  return [
    {
      id: "poi_1",
      poiId: "S001",
      title: "折多山垭口",
      type: "垭口",
      sequence: 1,
      coordinates: "30.078,101.801",
      roadStatus: "拥堵",
      liveUpdate: new Date().toISOString(),
      altitude: 4298,
      images: ["https://picsum.photos/seed/zheduo/400/300"],
      description: "川藏线第一座雪山垭口，康巴第一关，海拔4298米，风景壮丽但路况复杂。"
    },
    {
      id: "poi_2",
      poiId: "D001",
      title: "新都桥",
      type: "地点",
      sequence: 2,
      coordinates: "29.873,101.503",
      roadStatus: "畅通",
      liveUpdate: new Date().toISOString(),
      altitude: 3300,
      images: ["https://picsum.photos/seed/xindouqiao/400/300"],
      description: "光影变换迷人的摄影家天堂，秋季景色最为美丽。"
    },
    {
      id: "poi_3",
      poiId: "D002",
      title: "理塘高城",
      type: "驿站",
      sequence: 3,
      coordinates: "29.996,100.270",
      roadStatus: "畅通",
      liveUpdate: new Date().toISOString(),
      altitude: 4014,
      images: ["https://picsum.photos/seed/litang/400/300"],
      description: "世界高城，天空之城，仓央嘉措的故乡，可作补给点。"
    }
  ];
}
