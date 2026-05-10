# Miniprogram Branch

This branch contains the code for the Miniprogram platform of the China Road Trip project. It is specifically designed and optimized for the WeChat Mini Program ecosystem.

## Structure

The folder structure is as follows:

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

## Purpose

This branch is dedicated to the development and maintenance of the WeChat Mini Program version of the China Road Trip application. It includes:

- **Components**: Reusable UI components such as the altitude chart.
- **Pages**: Different pages of the application, including the index and route detail pages.
- **Utilities**: Helper functions for various tasks.
- **Configuration Files**: Essential configuration files for the Mini Program.

## Notes

- Ensure that all changes are tested thoroughly in the WeChat Developer Tools before pushing to this branch.
- This branch is independent of the `master` branch, which may target other platforms.