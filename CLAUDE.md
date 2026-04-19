# Geo-Disaster 地质灾变桌游电子版

## 项目简介
自然灾害主题的路线行走派对桌游网页版。掷骰子走路线，踩到特殊点触发灾害或抽卡，血量归零淘汰，最终存活者或血量最多者获胜。

## 技术栈
- Three.js v0.170 (ES Module via CDN importmap)
- simplex-noise v4.0.3 (ES Module via CDN)
- GSAP (ES Module via CDN)
- 原生 JavaScript (ES Modules)
- Node.js + ws (WebSocket) 用于在线多人
- 写实视觉风格

## 运行方式
- 本地开发: `python3 -m http.server 8080` 或 `node server.js`
- 在线多人: `node server.js`

## 项目结构
```
├── index.html              # 入口
├── server.js               # WebSocket + 静态文件服务
├── package.json            # Node 依赖
├── css/style.css
├── js/
│   ├── main.js             # 入口初始化
│   ├── config.js           # 全局配置常量
│   ├── engine/             # 纯游戏逻辑（前后端共用）
│   ├── render/             # Three.js 3D 渲染
│   ├── network/            # 在线多人
│   ├── ui/                 # DOM UI 层
│   └── utils/              # 工具函数
```

## 开发规则
- 不使用构建工具，纯 ES Module
- engine/ 层为纯逻辑，不依赖渲染或网络
- 地形纹理程序化生成，写实风格
- 性能目标: 60 FPS
