import { createNoise2D } from 'simplex-noise';
import { MAP_CONFIG } from '../config.js';

/**
 * 程序化地形高度图生成器
 * 生成写实风格的岛屿地形
 */
export class TerrainGenerator {
  constructor(seed = 42) {
    this.cfg = MAP_CONFIG;

    // 为每层噪声创建独立的种子随机函数
    const makeRng = (s) => {
      let state = s;
      return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
      };
    };

    this.continentNoise = createNoise2D(makeRng(seed));
    this.detailNoise = createNoise2D(makeRng(seed * 3 + 1));
    this.mountainNoise = createNoise2D(makeRng(seed * 5 + 2));
    this.ridgeNoise = createNoise2D(makeRng(seed * 7 + 3));
    this.biomeNoise = createNoise2D(makeRng(seed * 11 + 4));
    this.volcanoNoise = createNoise2D(makeRng(seed * 13 + 5));
    this.colorNoise1 = createNoise2D(makeRng(seed * 17 + 6));
    this.colorNoise2 = createNoise2D(makeRng(seed * 19 + 7));
    this.colorNoise3 = createNoise2D(makeRng(seed * 23 + 8));
  }

  /**
   * 获取指定世界坐标的高度 (0~1 归一化)
   */
  getHeight(worldX, worldZ) {
    const ns = this.cfg.noise;

    // 岛屿掩码：中心高、边缘低
    const halfSize = this.cfg.terrainSize / 2;
    const dx = worldX / halfSize;
    const dz = worldZ / halfSize;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const islandMask = Math.max(0, 1.0 - dist * dist * 0.8);

    // 大陆形状
    const continent = (this.continentNoise(worldX * ns.continentScale, worldZ * ns.continentScale) + 1) * 0.5;

    // 细节噪声
    const detail = (this.detailNoise(worldX * ns.detailScale, worldZ * ns.detailScale) + 1) * 0.5;

    // 山脉（使用 ridge 噪声）
    const ridgeRaw = this.ridgeNoise(worldX * ns.ridgeScale, worldZ * ns.ridgeScale);
    const ridge = 1.0 - Math.abs(ridgeRaw);

    const mountain = (this.mountainNoise(worldX * ns.mountainScale, worldZ * ns.mountainScale) + 1) * 0.5;

    // 组合
    let h = continent * 0.5 + detail * 0.15 + ridge * mountain * 0.35;

    // 应用岛屿掩码
    h *= islandMask;

    // 添加火山锥（在特定区域）
    const volcanoStrength = this._getVolcanoInfluence(worldX, worldZ);
    if (volcanoStrength > 0) {
      h = Math.max(h, volcanoStrength);
    }

    return Math.max(0, Math.min(1, h));
  }

  /**
   * 火山锥形影响（左上区域，匹配桌游原型）
   */
  _getVolcanoInfluence(wx, wz) {
    const vx = -25, vz = 50;
    const dx = wx - vx;
    const dz = wz - vz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const radius = 25;

    if (dist > radius) return 0;

    const t = dist / radius;
    let cone = (1 - t) * 0.95;

    // 火山口凹陷
    if (dist < 5) {
      cone -= (1 - dist / 5) * 0.15;
    }

    // 噪声扰动让锥体更自然
    const noise = this.volcanoNoise(wx * 0.05, wz * 0.05) * 0.08;
    cone += noise * (1 - t);

    return cone;
  }

  /**
   * 计算坡度（0~1，0=平地，1=垂直）
   */
  getSlope(worldX, worldZ) {
    const d = 0.5;
    const hL = this.getHeight(worldX - d, worldZ);
    const hR = this.getHeight(worldX + d, worldZ);
    const hU = this.getHeight(worldX, worldZ - d);
    const hD = this.getHeight(worldX, worldZ + d);
    const dx = (hR - hL) / (2 * d);
    const dz = (hD - hU) / (2 * d);
    return Math.min(1, Math.sqrt(dx * dx + dz * dz) * 8);
  }

  /**
   * 获取地形混合权重（多种地形类型带权重，用于平滑过渡）
   * 返回 [{type, weight}]
   */
  getTerrainBlend(worldX, worldZ, height, slope) {
    const seaLevel = this.cfg.seaLevel;
    const weights = {};
    const add = (type, w) => { weights[type] = (weights[type] || 0) + w; };

    // 水下
    if (height < seaLevel) {
      const depthRatio = height / seaLevel;
      if (depthRatio < 0.7) {
        add('deepWater', 1);
      } else {
        const t = (depthRatio - 0.7) / 0.3;
        add('deepWater', 1 - t);
        add('shallowWater', t);
      }
      return this._normalizeWeights(weights);
    }

    // 沙滩过渡带
    const shoreT = Math.min(1, (height - seaLevel) / 0.05);
    if (shoreT < 1) {
      add('sand', 1 - shoreT);
    }

    const landWeight = shoreT;
    if (landWeight <= 0) return this._normalizeWeights(weights);

    // 火山区域（左上角，大范围纯黑地面 + 红岩浆）
    const volcDist = Math.sqrt((worldX + 25) ** 2 + (worldZ - 50) ** 2);
    const volcInfluence = Math.max(0, 1 - volcDist / 32);
    if (volcInfluence > 0) {
      // 岩浆：火山口附近 + 沿着几条路径流下
      const lavaStream1 = Math.max(0, 1 - Math.abs(worldX + 25 - worldZ * 0.3 + 15) / 3);
      const lavaStream2 = Math.max(0, 1 - Math.abs(worldX + 20 + worldZ * 0.2 - 12) / 3);
      const lavaDist = Math.max(0, 1 - volcDist / 10);
      const lavaT = Math.max(lavaDist, (lavaStream1 + lavaStream2) * 0.4) * volcInfluence;
      if (lavaT > 0.15) add('lava', lavaT * landWeight * 3);
      // 整个火山区几乎纯黑
      add('volcanic', volcInfluence * volcInfluence * landWeight * 3);
    }

    // 冰川区域（中偏右下，对应节点25-30附近）
    const glacierDist = Math.sqrt((worldX + 10) ** 2 + (worldZ + 18) ** 2);
    const glacierInfluence = Math.max(0, 1 - glacierDist / 24);
    if (glacierInfluence > 0) {
      add('snow', glacierInfluence * glacierInfluence * landWeight * 2.5);
    }

    // 陡坡 → 岩石（只在非特殊区域）
    if (slope > 0.4 && volcInfluence < 0.3) {
      const rockT = Math.min(1, (slope - 0.4) / 0.4);
      add('rock', rockT * landWeight * 0.4);
    }

    // 森林区域（右上方，大面积青绿色）
    const forestCX = 38, forestCZ = 22;
    const forestDist = Math.sqrt((worldX - forestCX) ** 2 + (worldZ - forestCZ) ** 2);
    const forestInfluence = Math.max(0, 1 - forestDist / 28);

    if (forestInfluence > 0.15 && height > 0.32) {
      add('forest', forestInfluence * forestInfluence * landWeight * 2.5);
    }

    // 基础草地填充（中央大面积亮绿，但被其他区域排挤）
    if (height > seaLevel + 0.03) {
      const grassW = Math.max(0, 1 - volcInfluence * 3 - glacierInfluence * 2 - forestInfluence * 1.5);
      add('grass', grassW * landWeight * 0.6);
    }

    return this._normalizeWeights(weights);
  }

  _normalizeWeights(weights) {
    const result = [];
    let total = 0;
    for (const type in weights) {
      if (weights[type] > 0.01) {
        total += weights[type];
        result.push({ type, weight: weights[type] });
      }
    }
    if (total > 0) {
      for (const entry of result) entry.weight /= total;
    }
    return result;
  }

  /**
   * 获取颜色噪声变化（用于打破均匀色块）
   */
  getColorVariation(worldX, worldZ) {
    const n1 = this.colorNoise1(worldX * 0.08, worldZ * 0.08) * 0.04;
    const n2 = this.colorNoise2(worldX * 0.25, worldZ * 0.25) * 0.02;
    const n3 = this.colorNoise3(worldX * 0.5, worldZ * 0.5) * 0.01;
    return n1 + n2 + n3;
  }

  /**
   * 获取地形类型（简单版，用于非着色逻辑）
   */
  getTerrainType(worldX, worldZ, height) {
    const blend = this.getTerrainBlend(worldX, worldZ, height, 0);
    if (blend.length === 0) return 'grass';
    blend.sort((a, b) => b.weight - a.weight);
    return blend[0].type;
  }

  /**
   * 获取世界坐标处的实际 Y 高度
   */
  getWorldY(worldX, worldZ) {
    const h = this.getHeight(worldX, worldZ);
    return (h - this.cfg.seaLevel) * this.cfg.heightScale;
  }
}
