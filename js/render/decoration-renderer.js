import * as THREE from 'three';

/**
 * 地形装饰物渲染（树木、岩石、雪块等）
 * 根据地形类型程序化放置
 */
export class DecorationRenderer {
  constructor(scene, terrainGen) {
    this.scene = scene;
    this.terrainGen = terrainGen;
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  generate() {
    this._placeTrees();
    this._placeRocks();
    this._placeSnowChunks();
    this._placeVolcanicRocks();
  }

  /**
   * 在森林区域放置树木
   */
  _placeTrees() {
    const treePositions = this._scatter(-75, 70, -60, 75, 0, 350);

    for (const [x, z] of treePositions) {
      const h = this.terrainGen.getHeight(x, z);
      const seaLevel = this.terrainGen.cfg.seaLevel;
      if (h < seaLevel + 0.02) continue;

      // 火山区和冰川区用距离直接判断，不依赖blend权重
      const volcDist = Math.sqrt((x + 25) ** 2 + (z - 50) ** 2);
      const glacierDist = Math.sqrt((x + 10) ** 2 + (z + 18) ** 2);

      // 火山核心区不放树
      if (volcDist < 18) continue;
      // 冰川核心区不放树
      if (glacierDist < 12) continue;

      // 森林区（右上方）密集
      const forestDist = Math.sqrt((x - 38) ** 2 + (z - 22) ** 2);
      if (forestDist < 25) {
        this._createTree(x, z, h);
        continue;
      }

      // 其他陆地：少量树
      if (Math.random() < 0.1) {
        this._createTree(x, z, h);
      }
    }
  }

  /**
   * 创建一棵树
   */
  _createTree(x, z, h) {
    const y = this.terrainGen.getWorldY(x, z);
    if (y < 0.1) return;

    const treeGroup = new THREE.Group();
    const type = Math.random();
    const scale = 0.6 + Math.random() * 0.8;

    if (type < 0.5) {
      // 松树（锥形）
      this._createPineTree(treeGroup, scale);
    } else if (type < 0.8) {
      // 圆形灌木/阔叶树
      this._createBushTree(treeGroup, scale);
    } else {
      // 球簇树（匹配原型中的大树）
      this._createClusterTree(treeGroup, scale);
    }

    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.castShadow = true;
    this.group.add(treeGroup);
  }

  /**
   * 松树（锥形树冠 + 树干）
   */
  _createPineTree(group, scale) {
    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 1.2 * scale, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.6 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // 树冠（2-3层锥形）
    const leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.05, 0.35, 0.12),
      roughness: 0.8,
    });

    for (let i = 0; i < 3; i++) {
      const r = (1.0 - i * 0.25) * scale;
      const h = 1.0 * scale;
      const coneGeo = new THREE.ConeGeometry(r, h, 6);
      const cone = new THREE.Mesh(coneGeo, leafMat);
      cone.position.y = (1.2 + i * 0.65) * scale;
      cone.castShadow = true;
      group.add(cone);
    }
  }

  /**
   * 圆形灌木树
   */
  _createBushTree(group, scale) {
    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 0.8 * scale, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.4 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // 球形树冠
    const leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.08, 0.40, 0.15),
      roughness: 0.85,
    });
    const sphereGeo = new THREE.SphereGeometry(0.8 * scale, 6, 5);
    const crown = new THREE.Mesh(sphereGeo, leafMat);
    crown.position.y = 1.3 * scale;
    crown.castShadow = true;
    group.add(crown);
  }

  /**
   * 球簇大树（匹配原型中的橡皮泥大树）
   */
  _createClusterTree(group, scale) {
    scale *= 1.3;

    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1.5 * scale, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b15, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // 多个球拼成的树冠
    const leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.06, 0.38, 0.12),
      roughness: 0.8,
    });

    const ballPositions = [
      [0, 2.0, 0, 0.7],
      [0.4, 1.6, 0.3, 0.55],
      [-0.3, 1.7, 0.4, 0.5],
      [0.2, 1.5, -0.4, 0.5],
      [-0.4, 1.8, -0.2, 0.45],
      [0, 2.5, 0, 0.5],
    ];

    for (const [bx, by, bz, br] of ballPositions) {
      const geo = new THREE.SphereGeometry(br * scale, 6, 5);
      const ball = new THREE.Mesh(geo, leafMat);
      ball.position.set(bx * scale, by * scale, bz * scale);
      ball.castShadow = true;
      group.add(ball);
    }
  }

  /**
   * 在冰川区域放置雪块/冰块
   */
  _placeSnowChunks() {
    const positions = this._scatter(-50, 20, -50, 15, 1.5, 250);
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xe8eef5,
      roughness: 0.6,
      metalness: 0.1,
    });

    for (const [x, z] of positions) {
      const h = this.terrainGen.getHeight(x, z);
      if (h < this.terrainGen.cfg.seaLevel + 0.02) continue;

      const blend = this.terrainGen.getTerrainBlend(x, z, h, 0);
      const snowW = blend.find(b => b.type === 'snow')?.weight || 0;
      if (snowW < 0.15) continue;

      const y = this.terrainGen.getWorldY(x, z);
      if (y < 0.1) continue;

      const scale = 0.3 + Math.random() * 0.6;
      const geo = new THREE.SphereGeometry(scale, 5, 4);
      // 稍微压扁
      geo.scale(1, 0.6 + Math.random() * 0.4, 1);
      const chunk = new THREE.Mesh(geo, snowMat);
      chunk.position.set(x, y + scale * 0.3, z);
      chunk.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      chunk.castShadow = true;
      this.group.add(chunk);
    }
  }

  /**
   * 在火山区域放置暗色岩石
   */
  _placeVolcanicRocks() {
    const positions = this._scatter(-65, 10, 10, 75, 0, 120);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x2a2220,
      roughness: 0.95,
    });

    for (const [x, z] of positions) {
      const h = this.terrainGen.getHeight(x, z);
      if (h < this.terrainGen.cfg.seaLevel + 0.02) continue;

      const volcDist = Math.sqrt((x + 25) ** 2 + (z - 50) ** 2);
      if (volcDist > 35) continue;

      const y = this.terrainGen.getWorldY(x, z);
      if (y < 0.1) continue;

      const scale = 0.3 + Math.random() * 0.7;
      const geo = new THREE.DodecahedronGeometry(scale, 0);
      const rock = new THREE.Mesh(geo, rockMat);
      rock.position.set(x, y + scale * 0.3, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.group.add(rock);
    }
  }

  /**
   * 在一般区域放置岩石
   */
  _placeRocks() {
    const positions = this._scatter(-70, 65, -55, 65, 0, 60);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x6b6560,
      roughness: 0.9,
    });

    for (const [x, z] of positions) {
      const h = this.terrainGen.getHeight(x, z);
      if (h < this.terrainGen.cfg.seaLevel + 0.03) continue;

      const blend = this.terrainGen.getTerrainBlend(x, z, h, 0);
      const rockW = blend.find(b => b.type === 'rock')?.weight || 0;
      const grassW = blend.find(b => b.type === 'grass')?.weight || 0;
      if (rockW < 0.05 && grassW < 0.15) continue;

      const y = this.terrainGen.getWorldY(x, z);
      if (y < 0.1) continue;

      const scale = 0.2 + Math.random() * 0.5;
      const geo = new THREE.DodecahedronGeometry(scale, 0);
      const rock = new THREE.Mesh(geo, rockMat);
      rock.position.set(x, y + scale * 0.2, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.group.add(rock);
    }
  }

  /**
   * 在区域内随机撒点
   */
  _scatter(xMin, xMax, zMin, zMax, spacing, count) {
    const points = [];
    for (let i = 0; i < count; i++) {
      const x = xMin + Math.random() * (xMax - xMin);
      const z = zMin + Math.random() * (zMax - zMin);
      points.push([x, z]);
    }
    return points;
  }
}
