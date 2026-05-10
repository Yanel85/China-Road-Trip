/**
 * 本地存储工具
 */

const CHECKED_KEY = 'route_checked';

function getChecked() {
  try {
    const stored = wx.getStorageSync(CHECKED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveChecked(ids) {
  wx.setStorageSync(CHECKED_KEY, JSON.stringify(ids));
}

module.exports = {
  getChecked,
  saveChecked,
};
