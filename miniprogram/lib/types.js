/**
 * 路线数据类型 - 对应原项目 types/index.ts
 */
const RouteStatus = {
  OPEN: '开放',
  PARTIAL_CLOSED: '部分封路',
  WINTER_CLOSED: '冬季封闭',
};

const POIType = {
  SCENIC: '景点',
  PASS: '垭口',
  CHECKPOINT: '打卡点',
  PLACE: '地点',
  CAMPSITE: '宿营地',
};

const RoadStatus = {
  CLEAR: '畅通',
  CONGESTED: '拥堵',
  CLOSED: '封路',
};

/**
 * @typedef {Object} RouteData
 * @property {string} id
 * @property {string} [notionId]
 * @property {string} title
 * @property {string} cover
 * @property {number} distance
 * @property {string[]} tags
 * @property {string[]} season
 * @property {string} status
 * @property {string[]} [routeSequence]
 * @property {boolean} [isCustom]
 */

/**
 * @typedef {Object} POIData
 * @property {string} id
 * @property {string} poiId
 * @property {string} title
 * @property {string} type
 * @property {number} sequence
 * @property {string} coordinates
 * @property {string} roadStatus
 * @property {string} [liveUpdate]
 * @property {number} altitude
 * @property {string[]} images
 * @property {string} description
 */

module.exports = {
  RouteStatus,
  POIType,
  RoadStatus,
};
