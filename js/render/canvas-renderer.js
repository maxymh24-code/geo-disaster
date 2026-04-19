import { MAP_CONFIG } from '../config.js';

/**
 * 2D Canvas 地图渲染器
 * 俯视图，匹配桌游原型风格
 */

// 地形颜色（匹配原型）
const COLORS = {
  deepWater:    '#0d2888',
  shallowWater: '#4d99cc',
  sand:         '#9a7b4d',
  grass:        '#7ad41a',
  forest:       '#00a88a',
  rock:         '#666058',
  snow:         '#c8d0e0',
  volcanic:     '#1a1412',
  lava:         '#d91a08',
};

const NODE_COLORS = {
  start:           '#44ff44',
  safe:            '#4488ff',
  disaster_fixed:  '#ff3333',
  disaster_random: '#ffaa00',
  normal:          '#222222',
};

const PLAYER_COLORS = [
  '#ff4444', '#4488ff', '#44cc44', '#ffcc00', '#cc44ff', '#ff8844',
];

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.terrainGen = null;
    this.mapNodes = [];
    this.players = [];       // [{id, colorIndex, nodeId}]
    this.playerAnims = {};   // id -> {x, z, targetX, targetZ, t}

    // 视图变换
    this.offsetX = 0;
    this.offsetZ = 0;
    this.scale = 1;

    // 预渲染的地形
    this.terrainCanvas = null;
    this.terrainPixelSize = 2;  // 每像素对应多少世界单位

    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._setupControls();
  }

  init(terrainGen, mapNodes) {
    this.terrainGen = terrainGen;
    this.mapNodes = mapNodes;
    this._renderTerrain();
    this._fitView();
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * 预渲染地形到离屏 canvas
   */
  _renderTerrain() {
    const pxSize = this.terrainPixelSize;
    const worldMin = -80, worldMax = 80;
    const range = worldMax - worldMin;
    const w = Math.ceil(range / pxSize);
    const h = Math.ceil(range / pxSize);

    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = w;
    this.terrainCanvas.height = h;
    const tctx = this.terrainCanvas.getContext('2d');
    const imgData = tctx.createImageData(w, h);

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const wx = worldMin + px * pxSize;
        const wz = worldMin + py * pxSize;
        const height = this.terrainGen.getHeight(wx, wz);
        const blend = this.terrainGen.getTerrainBlend(wx, wz, height, 0);

        // 混合颜色
        let r = 0, g = 0, b = 0;
        for (const { type, weight } of blend) {
          const hex = COLORS[type] || COLORS.grass;
          const c = this._hexToRgb(hex);
          r += c.r * weight;
          g += c.g * weight;
          b += c.b * weight;
        }

        // 加一点噪声变化
        const v = this.terrainGen.getColorVariation(wx, wz) * 20;
        r = Math.max(0, Math.min(255, r + v));
        g = Math.max(0, Math.min(255, g + v));
        b = Math.max(0, Math.min(255, b + v));

        const idx = (py * w + px) * 4;
        imgData.data[idx] = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = 255;
      }
    }

    tctx.putImageData(imgData, 0, 0);

    this.terrainWorldMin = worldMin;
    this.terrainWorldMax = worldMax;
  }

  /**
   * 适配视图以显示所有节点
   */
  _fitView() {
    if (this.mapNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const n of this.mapNodes) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minZ = Math.min(minZ, n.z);
      maxZ = Math.max(maxZ, n.z);
    }

    const pad = 15;
    const rangeX = (maxX - minX) + pad * 2;
    const rangeZ = (maxZ - minZ) + pad * 2;
    const scaleX = this.canvas.width / rangeX;
    const scaleZ = this.canvas.height / rangeZ;
    this.scale = Math.min(scaleX, scaleZ);

    this.offsetX = this.canvas.width / 2 - ((minX + maxX) / 2) * this.scale;
    this.offsetZ = this.canvas.height / 2 - ((minZ + maxZ) / 2) * this.scale;
  }

  /**
   * 世界坐标 → 屏幕坐标
   */
  _toScreen(wx, wz) {
    return {
      x: wx * this.scale + this.offsetX,
      y: wz * this.scale + this.offsetZ,
    };
  }

  /**
   * 设置平移/缩放控制
   */
  _setupControls() {
    let dragging = false, lastX = 0, lastY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.offsetX += e.clientX - lastX;
      this.offsetZ += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const mx = e.clientX, my = e.clientY;
      this.offsetX = mx - (mx - this.offsetX) * factor;
      this.offsetZ = my - (my - this.offsetZ) * factor;
      this.scale *= factor;
    }, { passive: false });

    // 触摸支持
    let lastTouchDist = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        dragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
      }
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging) {
        this.offsetX += e.touches[0].clientX - lastX;
        this.offsetZ += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        if (lastTouchDist > 0) {
          const factor = dist / lastTouchDist;
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          this.offsetX = mx - (mx - this.offsetX) * factor;
          this.offsetZ = my - (my - this.offsetZ) * factor;
          this.scale *= factor;
        }
        lastTouchDist = dist;
      }
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => { dragging = false; lastTouchDist = 0; });
  }

  /**
   * 每帧绘制
   */
  render() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    // 清屏
    ctx.fillStyle = '#0a1e44';
    ctx.fillRect(0, 0, W, H);

    // 画地形
    this._drawTerrain(ctx);

    // 画路径
    this._drawPaths(ctx);

    // 画装饰（简单树/雪/石头）
    this._drawDecorations(ctx);

    // 画节点
    this._drawNodes(ctx);

    // 画玩家
    this._drawPlayers(ctx);
  }

  _drawTerrain(ctx) {
    if (!this.terrainCanvas) return;

    const worldMin = this.terrainWorldMin;
    const worldMax = this.terrainWorldMax;
    const range = worldMax - worldMin;

    const topLeft = this._toScreen(worldMin, worldMin);
    const botRight = this._toScreen(worldMax, worldMax);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      this.terrainCanvas,
      topLeft.x, topLeft.y,
      botRight.x - topLeft.x, botRight.y - topLeft.y
    );
  }

  _drawPaths(ctx) {
    const visited = new Set();

    ctx.strokeStyle = 'rgba(210, 160, 80, 0.7)';
    ctx.lineWidth = Math.max(2, 3 * this.scale / 8);
    ctx.lineCap = 'round';

    for (const node of this.mapNodes) {
      for (const nextId of node.connections) {
        const key = `${Math.min(node.id, nextId)}-${Math.max(node.id, nextId)}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const next = this.mapNodes.find(n => n.id === nextId);
        if (!next) continue;

        const a = this._toScreen(node.x, node.z);
        const b = this._toScreen(next.x, next.z);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  _drawNodes(ctx) {
    const r = Math.max(4, 8 * this.scale / 8);

    for (const node of this.mapNodes) {
      const p = this._toScreen(node.x, node.z);
      const color = NODE_COLORS[node.type] || NODE_COLORS.normal;

      // 节点圆圈
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 标签
      if (node.label) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(9, 11 * this.scale / 8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(node.label, p.x, p.y - r - 3);
      }
    }
  }

  _drawDecorations(ctx) {
    if (!this.terrainGen) return;
    // 简单的树用三角形，根据区域
    // 用确定性种子，每帧一致
    const rng = this._makeRng(12345);

    for (let i = 0; i < 200; i++) {
      const x = -65 + rng() * 130;
      const z = -55 + rng() * 120;
      const h = this.terrainGen.getHeight(x, z);
      if (h < this.terrainGen.cfg.seaLevel + 0.03) continue;

      const volcDist = Math.sqrt((x + 25) ** 2 + (z - 50) ** 2);
      const glacierDist = Math.sqrt((x + 10) ** 2 + (z + 18) ** 2);

      const p = this._toScreen(x, z);
      const s = Math.max(3, 5 * this.scale / 8);

      if (volcDist < 18) {
        // 火山区岩石
        if (rng() < 0.3) {
          ctx.fillStyle = '#2a2018';
          ctx.beginPath();
          ctx.moveTo(p.x - s * 0.6, p.y + s * 0.3);
          ctx.lineTo(p.x + s * 0.6, p.y + s * 0.3);
          ctx.lineTo(p.x + s * 0.3, p.y - s * 0.4);
          ctx.lineTo(p.x - s * 0.2, p.y - s * 0.5);
          ctx.fill();
        }
      } else if (glacierDist < 15) {
        // 冰川雪块
        if (rng() < 0.3) {
          ctx.fillStyle = '#e0e8f0';
          ctx.beginPath();
          ctx.arc(p.x, p.y, s * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 树
        const forestDist = Math.sqrt((x - 38) ** 2 + (z - 22) ** 2);
        const chance = forestDist < 25 ? 0.7 : 0.2;
        if (rng() < chance) {
          // 树干
          ctx.fillStyle = '#3d2b15';
          ctx.fillRect(p.x - s * 0.1, p.y, s * 0.2, s * 0.5);
          // 树冠
          ctx.fillStyle = forestDist < 25 ? '#0a6b50' : '#2d8a18';
          ctx.beginPath();
          ctx.moveTo(p.x - s * 0.5, p.y);
          ctx.lineTo(p.x + s * 0.5, p.y);
          ctx.lineTo(p.x, p.y - s * 0.9);
          ctx.fill();
        }
      }
    }
  }

  _drawPlayers(ctx) {
    const now = performance.now();

    for (const player of this.players) {
      const anim = this.playerAnims[player.id];
      let wx, wz;

      if (anim && anim.t < 1) {
        // 动画中
        anim.t = Math.min(1, anim.t + 0.03);
        wx = anim.fromX + (anim.toX - anim.fromX) * anim.t;
        wz = anim.fromZ + (anim.toZ - anim.fromZ) * anim.t;
      } else {
        const node = this.mapNodes.find(n => n.id === player.nodeId);
        if (!node) continue;
        wx = node.x;
        wz = node.z;
      }

      const p = this._toScreen(wx, wz);
      const r = Math.max(5, 10 * this.scale / 8);
      const color = PLAYER_COLORS[player.colorIndex] || '#fff';

      // 外圈
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();

      // 棋子
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 名字
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(8, 10 * this.scale / 8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(player.name, p.x, p.y - r - 5);
    }
  }

  // === 外部接口（供 TurnManager 调用） ===

  createPiece(playerId, colorIndex, nodeId, name) {
    this.players.push({ id: playerId, colorIndex, nodeId, name });
  }

  async movePiece(playerId, path) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    for (const nodeId of path) {
      const fromNode = this.mapNodes.find(n => n.id === player.nodeId);
      const toNode = this.mapNodes.find(n => n.id === nodeId);
      if (!fromNode || !toNode) continue;

      this.playerAnims[playerId] = {
        fromX: fromNode.x, fromZ: fromNode.z,
        toX: toNode.x, toZ: toNode.z,
        t: 0,
      };
      player.nodeId = nodeId;

      await new Promise(r => setTimeout(r, 300));
    }
  }

  getNodeWorldPosition(nodeId) {
    const node = this.mapNodes.find(n => n.id === nodeId);
    if (!node) return null;
    return this._toScreen(node.x, node.z);
  }

  highlightNodes(nodeIds) {
    this._highlightedNodes = nodeIds;
  }

  // === 工具函数 ===

  _hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  _makeRng(seed) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
}
