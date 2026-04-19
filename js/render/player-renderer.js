import * as THREE from 'three';

// 玩家颜色
const PLAYER_COLORS = [
  0xff4444, // 红
  0x4488ff, // 蓝
  0x44cc44, // 绿
  0xffcc00, // 黄
  0xcc44ff, // 紫
  0xff8844, // 橙
];

/**
 * 棋子模型和移动动画
 */
export class PlayerRenderer {
  constructor(scene, terrainGen, mapNodes) {
    this.scene = scene;
    this.terrainGen = terrainGen;
    this.mapNodes = mapNodes;
    this.pieces = new Map();  // playerId -> { mesh, group }
    this.animations = [];     // 进行中的动画
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  /**
   * 创建玩家棋子
   */
  createPiece(playerId, playerIndex, startNodeId) {
    const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    const pieceGroup = new THREE.Group();

    // 棋子底座
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.4,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.castShadow = true;
    pieceGroup.add(base);

    // 棋子主体（圆锥形）
    const bodyGeo = new THREE.ConeGeometry(0.5, 1.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.5,
      emissive: color,
      emissiveIntensity: 0.15,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    body.castShadow = true;
    pieceGroup.add(body);

    // 顶部球
    const topGeo = new THREE.SphereGeometry(0.25, 12, 8);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.6,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 2.1;
    top.castShadow = true;
    pieceGroup.add(top);

    // 初始位置
    const node = this.mapNodes.find(n => n.id === startNodeId);
    if (node) {
      const y = this.terrainGen.getWorldY(node.x, node.z);
      // 多人在同一节点时错开位置
      const offset = this._getOffsetForPlayer(playerId, startNodeId);
      pieceGroup.position.set(node.x + offset.x, Math.max(y, 0.5) + 0.8, node.z + offset.z);
    }

    this.group.add(pieceGroup);

    const piece = {
      group: pieceGroup,
      body,
      top,
      currentNodeId: startNodeId,
      color,
      bobPhase: Math.random() * Math.PI * 2,
    };
    this.pieces.set(playerId, piece);

    return piece;
  }

  /**
   * 同一节点上多人错开位置
   */
  _getOffsetForPlayer(playerId, nodeId) {
    const samePlayers = [];
    for (const [pid, piece] of this.pieces) {
      if (piece.currentNodeId === nodeId) {
        samePlayers.push(pid);
      }
    }
    const idx = samePlayers.length;
    const angle = (idx * Math.PI * 2) / 6;
    const r = idx > 0 ? 1.2 : 0;
    return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
  }

  /**
   * 移动棋子到指定节点（逐节点动画）
   */
  movePiece(playerId, path, onComplete) {
    const piece = this.pieces.get(playerId);
    if (!piece || path.length === 0) {
      onComplete?.();
      return;
    }

    let stepIndex = 0;
    const moveNext = () => {
      if (stepIndex >= path.length) {
        piece.currentNodeId = path[path.length - 1];
        onComplete?.();
        return;
      }

      const targetNodeId = path[stepIndex];
      const targetNode = this.mapNodes.find(n => n.id === targetNodeId);
      if (!targetNode) {
        stepIndex++;
        moveNext();
        return;
      }

      const y = this.terrainGen.getWorldY(targetNode.x, targetNode.z);
      const targetPos = {
        x: targetNode.x,
        y: Math.max(y, 0.5) + 0.8,
        z: targetNode.z,
      };

      this.animations.push({
        piece,
        startPos: { ...piece.group.position },
        targetPos,
        startTime: performance.now(),
        duration: 400,  // ms per step
        onComplete: () => {
          piece.currentNodeId = targetNodeId;
          stepIndex++;
          moveNext();
        },
      });
    };

    moveNext();
  }

  /**
   * 设置棋子淘汰视觉
   */
  setEliminated(playerId) {
    const piece = this.pieces.get(playerId);
    if (!piece) return;

    piece.group.traverse(child => {
      if (child.isMesh) {
        child.material.opacity = 0.3;
        child.material.transparent = true;
      }
    });
  }

  /**
   * 帧更新
   */
  update(elapsed) {
    // 棋子浮动动画
    for (const [, piece] of this.pieces) {
      const bob = Math.sin(elapsed * 2 + piece.bobPhase) * 0.15;
      piece.body.position.y = 1.1 + bob;
      piece.top.position.y = 2.1 + bob;
    }

    // 移动动画
    const now = performance.now();
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      const progress = Math.min(1, (now - anim.startTime) / anim.duration);

      // 缓动函数
      const ease = 1 - Math.pow(1 - progress, 3);

      // 插值位置（带弧形跳跃）
      const jumpHeight = 3;
      const jump = Math.sin(progress * Math.PI) * jumpHeight;

      anim.piece.group.position.x = anim.startPos.x + (anim.targetPos.x - anim.startPos.x) * ease;
      anim.piece.group.position.y = anim.startPos.y + (anim.targetPos.y - anim.startPos.y) * ease + jump;
      anim.piece.group.position.z = anim.startPos.z + (anim.targetPos.z - anim.startPos.z) * ease;

      if (progress >= 1) {
        anim.piece.group.position.set(anim.targetPos.x, anim.targetPos.y, anim.targetPos.z);
        anim.onComplete?.();
        this.animations.splice(i, 1);
      }
    }
  }

  /**
   * 获取棋子当前世界位置
   */
  getPiecePosition(playerId) {
    const piece = this.pieces.get(playerId);
    return piece ? piece.group.position.clone() : null;
  }
}
