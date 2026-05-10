# Miniprogram 分支

此分支包含中国自驾游项目的微信小程序平台代码，专为微信小程序生态系统设计和优化。

## 目录结构

项目的文件夹结构如下：

```
miniprogram/
├── app.js
├── app.json
├── app.wxss
├── components/
│   └── altitude-chart/
│       ├── altitude-chart.js
│       ├── altitude-chart.json
│       ├── altitude-chart.wxml
│       └── altitude-chart.wxss
├── lib/
│   ├── geo.js
│   └── notion.js
├── pages/
│   ├── index/
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── route-detail/
│       ├── route-detail.js
│       ├── route-detail.json
│       ├── route-detail.wxml
│       └── route-detail.wxss
├── utils/
│   └── index.js
├── project.config.json
├── sitemap.json
```

## 分支用途

此分支专注于微信小程序版本的开发和维护，主要包括：

- **组件**：可复用的 UI 组件，例如海拔图表。
- **页面**：应用的不同页面，包括首页和路线详情页。
- **工具函数**：用于各种任务的辅助函数。
- **配置文件**：微信小程序所需的关键配置文件。

## 注意事项

- 在推送到此分支之前，请确保所有更改已在微信开发者工具中充分测试。
- 此分支独立于 `master` 分支，`master` 分支可能面向其他平台。