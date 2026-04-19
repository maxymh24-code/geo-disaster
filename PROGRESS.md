# Geo-Disaster 进度日志

## 当前状态: 基于桌游原型更新完成

## 阶段 1: 基础框架 + 3D 地图 ✅
- [x] 创建项目文件结构 + CLAUDE.md / DESIGN.md / PROGRESS.md
- [x] index.html + CDN importmap (Three.js, simplex-noise, GSAP)
- [x] config.js: 全局配置常量
- [x] scene-manager.js: Three.js 场景初始化（渲染器/相机/灯光/天空）
- [x] terrain-gen.js: simplex-noise 多层噪声高度图 + 岛屿掩码 + 火山锥
- [x] map-renderer.js: PlaneGeometry 顶点位移/着色 + 写实海水面
- [x] camera-controller.js: 鼠标拖拽旋转 + 滚轮缩放 + 右键平移 + 触摸支持

## 阶段 2: 路线系统 + 棋子 ✅
- [x] map-data.js: 28节点环形路线 + 冰川支线分叉
- [x] path-renderer.js: CatmullRomCurve3 路径 + TubeGeometry 管道 + 节点标记 + 标签精灵
- [x] player-renderer.js: 棋子模型(底座+锥体+球) + 弧形跳跃移动动画 + 浮动效果

## 阶段 3: 游戏逻辑核心 ✅
- [x] player.js: 玩家模型（HP/状态效果/伤害/治疗/淘汰）
- [x] dice.js: 骰子逻辑
- [x] disaster-cards.js: 21张灾害卡 + 固定灾害事件 + 洗牌/抽卡
- [x] effects.js: 灾害效果处理（damage/heal/knockback/skip_turn/dot_damage/shield）
- [x] game-state.js: 完整游戏状态机（回合流程/掷骰/移动/事件/淘汰/结算）
- [x] turn-manager.js: 回合控制器（连接引擎层与渲染/UI层）

## 阶段 4: UI + 视觉效果 ✅
- [x] menu.js: 主菜单 + 玩家设置（2-6人）
- [x] hud.js: 血量条/回合信息/玩家状态
- [x] dice-ui.js: 掷骰子按钮和结果显示
- [x] card-popup.js: 灾害卡弹窗 / 固定灾害 / 安全点提示
- [x] fork-choice.js: 分叉路线选择
- [x] game-log.js: 游戏日志面板
- [x] result-screen.js: 结算排名界面
- [x] style.css: 完整 UI 样式

## 阶段 5: 本地多人 ✅
- [x] 同设备轮流模式（内置在 GameState/TurnManager 中）
- [x] 玩家设置界面（可添加/移除 2-6 人）
- [x] 回合切换提示（HUD 高亮当前玩家）

## 阶段 6: 在线多人 ✅
- [x] server.js: HTTP 静态文件服务 + WebSocket 房间管理
- [x] package.json: type:module + ws 依赖
- [x] protocol.js: 消息协议定义
- [x] client.js: WebSocket 客户端 + 自动重连
- [x] room-client.js: 房间管理封装
- [x] sync.js: 游戏状态同步
- [x] lobby.js: 创建/加入房间 UI

## 桌游原型适配 ✅
- [x] HP上限从100改为50（config.js + player.js）
- [x] 地图重做：~52节点环形路线 + 火山支线，匹配实物布局（map-data.js）
- [x] 灾害卡重做：伤害值校准到50HP体系，新增台风类型（disaster-cards.js）
- [x] 地形生成：火山移至左上(-25,50)，冰川区中左，森林区右侧（terrain-gen.js）
- [x] 安全点恢复从15降到8，起点回血从10降到5（game-state.js）
- [x] AI自动行动（掷骰/选叉/跳过弹窗）
- [x] 骰子UI竞态条件修复

## 阶段 7: 打磨 (待开始)
- [ ] 更多灾害卡和地图
- [ ] 音效系统
- [ ] 移动端适配
- [ ] 性能优化和平衡调整
- [ ] 3D 骰子动画
- [ ] 灾害视觉特效

## 文件清单
```
projects/geo-disaster/
├── CLAUDE.md / DESIGN.md / PROGRESS.md
├── index.html
├── package.json
├── server.js
├── css/style.css
├── js/
│   ├── main.js
│   ├── config.js
│   ├── engine/
│   │   ├── game-state.js
│   │   ├── turn-manager.js
│   │   ├── player.js
│   │   ├── map-data.js
│   │   ├── disaster-cards.js
│   │   ├── dice.js
│   │   └── effects.js
│   ├── render/
│   │   ├── scene-manager.js
│   │   ├── terrain-gen.js
│   │   ├── map-renderer.js
│   │   ├── path-renderer.js
│   │   ├── player-renderer.js
│   │   └── camera-controller.js
│   ├── network/
│   │   ├── client.js
│   │   ├── protocol.js
│   │   ├── room-client.js
│   │   └── sync.js
│   ├── ui/
│   │   ├── menu.js
│   │   ├── lobby.js
│   │   ├── hud.js
│   │   ├── card-popup.js
│   │   ├── dice-ui.js
│   │   ├── fork-choice.js
│   │   ├── game-log.js
│   │   └── result-screen.js
│   └── utils/
│       ├── math.js
│       └── random.js
```

## 未解决问题
- 在线模式的服务端游戏引擎是简化版，未完全复用 engine/ 代码
- 3D 骰子动画和灾害特效尚未实现
- 需要实际浏览器测试验证完整游戏流程
