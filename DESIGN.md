# Geo-Disaster 设计文档

## 需求描述
将自制自然灾害主题桌游做成网页版。类大富翁路线行走 + 灾害抽卡派对游戏，支持 3D 地图渲染和在线多人。

## 技术方案
- 前端: Three.js 3D 渲染 + 原生 JS + GSAP 动画 + HTML/CSS UI
- 后端: Node.js + ws WebSocket
- 架构: 引擎层(engine/)纯逻辑前后端共用，本地/在线模式通过 Controller 抽象统一

## 核心数据模型

### 地图节点
```js
MapNode = { id, position:{x,y,z}, terrain, type, disasterId, connections }
```
- terrain: volcano | ocean | glacier | plateau | forest | desert
- type: normal | disaster_fixed | disaster_random | safe | start

### 玩家
```js
Player = { id, name, color, hp, maxHp:100, currentNodeId, isAlive, statusEffects }
```

### 灾害卡
```js
DisasterCard = { id, name, type, rarity, description, effects }
```
- type: earthquake | volcano | tsunami | blizzard | landslide | sinkhole | wildfire | flood
- effects: damage | knockback | heal | skip_turn | move_back | shield

### 游戏状态
```js
GameState = { phase, players, turnOrder, currentPlayerId, turnPhase, diceResult,
              disasterDeck, roundNumber, maxRounds, mode, roomCode }
```

## 模块划分
- engine/: 状态机、回合管理、玩家、地图、灾害卡、骰子、效果处理
- render/: 场景管理、地形生成、地图/路线/棋子/骰子/卡牌渲染、灾害特效、相机控制
- network/: WebSocket 客户端、协议、房间管理、状态同步
- ui/: 菜单、大厅、HUD、弹窗、骰子按钮、分叉选择、日志、结算

## 交互流程
1. 主菜单 → 选择本地/在线
2. 本地: 设置玩家数量和名字 → 开始
3. 在线: 创建/加入房间 → 大厅等待 → 房主开始
4. 游戏循环: 掷骰 → 移动 → 触发事件(灾害/抽卡/安全) → 结算 → 下一位
5. 结束: 血量归零淘汰 / 达到回合上限 → 结算界面

## 在线架构
- 服务端权威: 骰子、抽卡由服务端决定
- 客户端只发意图: roll_dice, choose_fork, end_turn
- 服务端验证执行后广播结果
