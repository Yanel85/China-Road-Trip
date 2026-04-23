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
  routeSequence?: string[]; // 基于文本字段的直接POI次序
}

export type POIType = '景点' | '垭口' | '打卡点' | '地点' | '宿营地' | string;
export type RoadStatus = '畅通' | '拥堵' | '封路' | string;

export interface POIData {
  id: string;
  poiId: string; // 自定义点位ID（如 D0163）
  title: string; // 点位名称
  type: POIType; // 分类
  sequence: number; // 权重。
  coordinates: string; // "坐标（如 30.012, 101.123），用于唤起地图导航"
  roadStatus: RoadStatus; // 实时路况： 畅通（绿）、拥堵（黄）、封路（红）
  liveUpdate?: string; // 该点位最后一次手动更新路况的时间
  altitude: number; // 海拔高度，移动端非常关注的数据
  images: string[]; // 景点或实时路况的照片
  description: string; // 简短介绍（控制在 100 字内，适合手机阅读）
}

