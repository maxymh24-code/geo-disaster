import * as THREE from 'three';
import { MAP_CONFIG } from '../config.js';

// 地形调色板（匹配桌游原型实物颜色）
const TERRAIN_COLORS = {
  deepWater:    new THREE.Color(0.05, 0.15, 0.55),   // 深蓝（原型深蓝池）
  shallowWater: new THREE.Color(0.30, 0.60, 0.80),   // 浅蓝（原型浅蓝水面）
  sand:         new THREE.Color(0.60, 0.48, 0.30),   // 棕色沙滩
  grass:        new THREE.Color(0.50, 0.85, 0.15),   // 亮荧光绿（原型黄绿色）
  forest:       new THREE.Color(0.00, 0.65, 0.55),   // 青绿色/teal（原型蓝绿色区域）
  rock:         new THREE.Color(0.40, 0.38, 0.35),   // 灰色岩石
  snow:         new THREE.Color(0.78, 0.82, 0.88),   // 浅蓝银灰（原型冰川区）
  volcanic:     new THREE.Color(0.10, 0.08, 0.07),   // 几乎纯黑（原型火山底座）
  lava:         new THREE.Color(0.85, 0.10, 0.05),   // 鲜红岩浆（原型红色流）
};

// 每种地形的色相偏移范围（用于噪声变化）
const TERRAIN_VARIATION = {
  deepWater:    { h: 0.02, s: 0.03, v: 0.03 },
  shallowWater: { h: 0.03, s: 0.04, v: 0.04 },
  sand:         { h: 0.02, s: 0.04, v: 0.05 },
  grass:        { h: 0.03, s: 0.05, v: 0.06 },
  forest:       { h: 0.04, s: 0.06, v: 0.05 },
  rock:         { h: 0.01, s: 0.02, v: 0.05 },
  snow:         { h: 0.01, s: 0.02, v: 0.04 },
  volcanic:     { h: 0.01, s: 0.02, v: 0.03 },
  lava:         { h: 0.03, s: 0.04, v: 0.05 },
};

/**
 * 3D 地形 mesh 渲染（改进版）
 * 多层噪声着色 + 地形混合过渡 + 坡度岩壁 + 写实水面
 */
export class MapRenderer {
  constructor(scene, terrainGen) {
    this.scene = scene;
    this.terrainGen = terrainGen;
    this.cfg = MAP_CONFIG;
    this.terrainMesh = null;
    this.waterMesh = null;
    this._tempColor = new THREE.Color();
    this._blendColor = new THREE.Color();
  }

  generate() {
    this._createTerrain();
    this._createWater();
  }

  _createTerrain() {
    const { terrainSize, terrainSegments, heightScale, seaLevel } = this.cfg;

    const geometry = new THREE.PlaneGeometry(
      terrainSize, terrainSize,
      terrainSegments, terrainSegments
    );
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const colorAttr = new THREE.BufferAttribute(colors, 3);

    // 先设置高度
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const h = this.terrainGen.getHeight(x, z);
      const y = (h - seaLevel) * heightScale;
      // 水下部分压低，避免和水面 z-fighting
      if (y < 0.3) {
        positions.setY(i, Math.max(y - 0.3, -heightScale * seaLevel * 0.5));
      } else {
        positions.setY(i, y);
      }
    }

    // 计算法线（需要先有正确的高度）
    geometry.computeVertexNormals();
    const normals = geometry.attributes.normal;

    // 然后着色
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const h = this.terrainGen.getHeight(x, z);

      // 从法线估算坡度
      const ny = normals.getY(i);
      const slope = 1.0 - Math.abs(ny);

      // 获取地形混合权重
      const blend = this.terrainGen.getTerrainBlend(x, z, h, slope);

      // 获取噪声变化
      const variation = this.terrainGen.getColorVariation(x, z);

      // 混合颜色
      const finalColor = this._blendTerrainColors(blend, variation, x, z);

      // 简易AO：基于高度和坡度的暗化
      const ao = this._computeAO(h, slope, seaLevel);
      finalColor.multiplyScalar(ao);

      colorAttr.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
    }

    geometry.setAttribute('color', colorAttr);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.03,
      flatShading: false,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);
  }

  /**
   * 混合多种地形颜色
   */
  _blendTerrainColors(blend, variation, x, z) {
    this._blendColor.setRGB(0, 0, 0);

    for (const { type, weight } of blend) {
      const base = TERRAIN_COLORS[type];
      if (!base) continue;

      const vari = TERRAIN_VARIATION[type] || { h: 0, s: 0, v: 0 };

      // 用噪声偏移每个通道
      this._tempColor.copy(base);
      this._tempColor.r += variation * vari.v * 3 + Math.sin(x * 0.3 + z * 0.2) * vari.h;
      this._tempColor.g += variation * vari.s * 2;
      this._tempColor.b += variation * vari.v * 2 - Math.cos(x * 0.2 + z * 0.4) * vari.h;

      // 限制范围
      this._tempColor.r = Math.max(0, Math.min(1, this._tempColor.r));
      this._tempColor.g = Math.max(0, Math.min(1, this._tempColor.g));
      this._tempColor.b = Math.max(0, Math.min(1, this._tempColor.b));

      // 加权累加
      this._blendColor.r += this._tempColor.r * weight;
      this._blendColor.g += this._tempColor.g * weight;
      this._blendColor.b += this._tempColor.b * weight;
    }

    return this._blendColor.clone();
  }

  /**
   * 简易环境光遮蔽
   */
  _computeAO(height, slope, seaLevel) {
    let ao = 1.0;

    // 低洼处稍暗
    const relH = (height - seaLevel) / (1 - seaLevel);
    if (relH > 0 && relH < 0.15) {
      ao *= 0.88 + relH * 0.8;
    }

    // 陡坡处稍暗（模拟裂缝/阴影）
    if (slope > 0.4) {
      ao *= 1.0 - (slope - 0.4) * 0.3;
    }

    return Math.max(0.7, Math.min(1.05, ao));
  }

  _createWater() {
    const { terrainSize } = this.cfg;

    const waterGeo = new THREE.PlaneGeometry(terrainSize * 2, terrainSize * 2, 64, 64);
    waterGeo.rotateX(-Math.PI / 2);

    // 自定义水面着色器
    const waterMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color(0x0d2888) },
        uShallowColor: { value: new THREE.Color(0x4d99cc) },
        uSunDir: { value: new THREE.Vector3(0.5, 0.7, 0.3).normalize() },
        uOpacity: { value: 0.82 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // 多层波浪
          float wave1 = sin(pos.x * 0.15 + uTime * 0.8) * cos(pos.z * 0.12 + uTime * 0.6) * 0.25;
          float wave2 = sin(pos.x * 0.3 + pos.z * 0.2 + uTime * 1.2) * 0.12;
          float wave3 = sin(pos.x * 0.5 - uTime * 1.5) * cos(pos.z * 0.4 + uTime) * 0.06;
          pos.y += wave1 + wave2 + wave3;

          vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

          // 计算波浪法线
          float dx = cos(pos.x * 0.15 + uTime * 0.8) * 0.15 * cos(pos.z * 0.12 + uTime * 0.6) * 0.25
                   + cos(pos.x * 0.3 + pos.z * 0.2 + uTime * 1.2) * 0.3 * 0.12
                   + cos(pos.x * 0.5 - uTime * 1.5) * 0.5 * cos(pos.z * 0.4 + uTime) * 0.06;
          float dz = -sin(pos.x * 0.15 + uTime * 0.8) * sin(pos.z * 0.12 + uTime * 0.6) * 0.12 * 0.25
                   + cos(pos.x * 0.3 + pos.z * 0.2 + uTime * 1.2) * 0.2 * 0.12
                   + sin(pos.x * 0.5 - uTime * 1.5) * cos(pos.z * 0.4 + uTime + 0.4) * 0.4 * 0.06;
          vNormal = normalize(vec3(-dx, 1.0, -dz));

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uSunDir;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main() {
          // 深浅过渡（基于距中心距离）
          float dist = length(vWorldPos.xz) / 100.0;
          float depthMix = smoothstep(0.3, 0.9, dist);
          vec3 waterColor = mix(uShallowColor, uDeepColor, depthMix);

          // 高光
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 halfDir = normalize(uSunDir + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 80.0);
          waterColor += vec3(1.0, 0.95, 0.85) * spec * 0.5;

          // 菲涅尔效果
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
          waterColor = mix(waterColor, vec3(0.5, 0.7, 0.85), fresnel * 0.25);

          gl_FragColor = vec4(waterColor, uOpacity - depthMix * 0.1);
        }
      `,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = 0.12;  // 略高于地形海平面，避免z-fighting
    this.waterMesh.renderOrder = 1;    // 后渲染
    this.scene.add(this.waterMesh);
  }

  /**
   * 动画更新
   */
  update(time) {
    if (this.waterMesh && this.waterMesh.material.uniforms) {
      this.waterMesh.material.uniforms.uTime.value = time;
    }
  }
}
