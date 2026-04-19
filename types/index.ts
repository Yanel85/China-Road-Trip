export type RouteStatus = '开放' | '部分封路' | '冬季封闭' | string;

export interface RouteData {
  id: string; // 唯一标识符（如 g318），用于 URL 路由
  notionId?: string; // 对应的 Notion Page ID
  title: string; // 线路名称
  cover: string; // 列表页展示的高清大图
  distance: number; // 总里程（km）
  tags: string[]; // 标签：#进藏、#极致风光、#高难度
  season: string[]; // 最佳季节：春夏秋冬
  status: RouteStatus;
  poiIds: string[]; // 关联下方的“点位从表”
}

export type POIType = '景点' | '垭口' | '加油站' | '检修点' | '宿营地' | string;
export type RoadStatus = '畅通' | '拥堵' | '封路' | string;

export interface POIData {
  id: string;
  title: string; // 点位名称
  routeIds: string[]; // 关联回“线路主表”
  type: POIType; // 分类
  sequence: number; // 排序权重。前端根据此数字从小到大排列行程顺序
  coordinates: string; // "坐标（如 30.012, 101.123），用于唤起地图导航"
  roadStatus: RoadStatus; // 实时路况： 畅通（绿）、拥堵（黄）、封路（红）
  liveUpdate?: string; // 该点位最后一次手动更新路况的时间
  altitude: number; // 海拔高度，移动端非常关注的数据
  images: string[]; // 景点或实时路况的照片
  description: string; // 简短介绍（控制在 100 字内，适合手机阅读）
}

