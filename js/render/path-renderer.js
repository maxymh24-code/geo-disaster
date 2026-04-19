import * as THREE from 'three';
import { MAP_CONFIG, NODE_TYPES } from '../config.js';

/**
 * 路线和节点标记渲染
 */
export class PathRenderer {
  constructor(scene, terrainGen, mapNodes) {
    this.scene = scene;
    this.terrainGen = terrainGen;
    this.mapNodes = mapNodes;
    this.nodeMarkers = new Map();  // id -> mesh
    this.pathLines = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  generate() {
    this._createNodes();
    this._createPaths();
  }

  _getNodeColor(type) {
    switch (type) {
      case 'start':           return 0x44ff44; // 绿色
      case 'safe':            return 0x4488ff; // 蓝色
      case 'disaster_fixed':  return 0xff3333; // 红色
      case 'disaster_random': return 0xff8800; // 橙色
      default:                return 0xcccccc; // 灰色
    }
  }

  _createNodes() {
    for (const node of this.mapNodes) {
      const y = this.terrainGen.getWorldY(node.x, node.z);
      const nodeY = Math.max(y, 0.5) + 0.5; // 确保在地面以上

      // 节点标记：圆柱体
      const radius = node.type === 'start' ? 1.2 : MAP_CONFIG.nodeMarkerRadius;
      const height = MAP_CONFIG.nodeMarkerHeight;
      const geo = new THREE.CylinderGeometry(radius, radius, height, 16);
      const color = this._getNodeColor(node.type);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.2,
      });

      const marker = new THREE.Mesh(geo, mat);
      marker.position.set(node.x, nodeY, node.z);
      marker.castShadow = true;
      marker.receiveShadow = true;
      marker.userData = { nodeId: node.id, type: node.type };

      this.group.add(marker);
      this.nodeMarkers.set(node.id, marker);

      // 节点光晕
      if (node.type !== 'normal') {
        const glowGeo = new THREE.RingGeometry(radius + 0.2, radius + 0.6, 24);
        const glowMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(node.x, nodeY + 0.01, node.z);
        this.group.add(glow);
      }

      // 标签精灵（如果有 label）
      if (node.label) {
        const sprite = this._createLabelSprite(node.label, color);
        sprite.position.set(node.x, nodeY + 2.5, node.z);
        sprite.scale.set(6, 2, 1);
        this.group.add(sprite);
      }
    }
  }

  _createPaths() {
    const visited = new Set();

    for (const node of this.mapNodes) {
      for (const nextId of node.connections) {
        const edgeKey = `${Math.min(node.id, nextId)}-${Math.max(node.id, nextId)}`;
        if (visited.has(edgeKey)) continue;
        visited.add(edgeKey);

        const nextNode = this.mapNodes.find(n => n.id === nextId);
        if (!nextNode) continue;

        this._createPathBetween(node, nextNode);
      }
    }
  }

  _createPathBetween(fromNode, toNode) {
    // 使用 CatmullRomCurve3 平滑路径
    const segments = 20;
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = fromNode.x + (toNode.x - fromNode.x) * t;
      const z = fromNode.z + (toNode.z - fromNode.z) * t;
      const y = this.terrainGen.getWorldY(x, z);
      points.push(new THREE.Vector3(x, Math.max(y, 0.3) + 0.3, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(40);

    // 路径线条
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffaa55,
      linewidth: 2,
      transparent: true,
      opacity: 0.6,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    this.group.add(line);
    this.pathLines.push(line);

    // 路径管道（更粗可见）
    const tubeGeo = new THREE.TubeGeometry(curve, 20, MAP_CONFIG.pathWidth * 0.3, 6, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xd4904a,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.5,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.receiveShadow = true;
    this.group.add(tube);
  }

  _createLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(4, 4, 248, 72, 10);
      ctx.fill();
    } else {
      ctx.fillRect(4, 4, 248, 72);
    }

    // 文字
    ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 42);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    return new THREE.Sprite(mat);
  }

  /**
   * 高亮指定节点
   */
  highlightNodes(nodeIds) {
    for (const [id, marker] of this.nodeMarkers) {
      if (nodeIds.includes(id)) {
        marker.scale.set(1.3, 1.5, 1.3);
        marker.material.emissiveIntensity = 0.8;
      } else {
        marker.scale.set(1, 1, 1);
        marker.material.emissiveIntensity = 0.3;
      }
    }
  }

  /**
   * 获取节点的世界坐标
   */
  getNodeWorldPosition(nodeId) {
    const marker = this.nodeMarkers.get(nodeId);
    if (marker) return marker.position.clone();
    return null;
  }
}
