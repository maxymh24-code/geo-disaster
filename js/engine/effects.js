import { getNodeById } from './map-data.js';

/**
 * 灾害效果处理器
 * 解析 effects 数组并应用到玩家
 */

/**
 * 应用效果列表到游戏状态
 * @param {Array} effects - 效果列表
 * @param {Player} triggerPlayer - 触发者
 * @param {Player[]} allPlayers - 所有玩家
 * @returns {Array} 日志条目
 */
export function applyEffects(effects, triggerPlayer, allPlayers) {
  const logs = [];

  for (const effect of effects) {
    const targets = resolveTargets(effect.target, triggerPlayer, allPlayers);

    for (const player of targets) {
      if (!player.isAlive) continue;

      // 护盾检查
      if (effect.type === 'damage' && player.hasEffect('shield')) {
        const shieldIdx = player.statusEffects.findIndex(e => e.type === 'shield');
        if (shieldIdx >= 0) {
          player.statusEffects.splice(shieldIdx, 1);
          logs.push({ player: player.name, text: `护盾抵挡了伤害！` });
          continue;
        }
      }

      switch (effect.type) {
        case 'damage': {
          const dmg = player.takeDamage(effect.value);
          logs.push({ player: player.name, text: `受到 ${dmg} 点伤害 (HP: ${player.hp}/${player.maxHp})` });
          if (!player.isAlive) {
            logs.push({ player: player.name, text: `已被淘汰！`, type: 'eliminate' });
          }
          break;
        }

        case 'heal': {
          const healed = player.heal(effect.value);
          logs.push({ player: player.name, text: `恢复 ${healed} 点生命 (HP: ${player.hp}/${player.maxHp})`, type: 'heal' });
          break;
        }

        case 'knockback': {
          const steps = effect.value || 1;
          const prevNode = player.currentNodeId;
          // 后退：沿路线反向走
          const newNode = knockback(player.currentNodeId, steps);
          player.currentNodeId = newNode;
          logs.push({ player: player.name, text: `被击退 ${steps} 步 (节点 ${prevNode} → ${newNode})` });
          break;
        }

        case 'skip_turn': {
          const turns = effect.value || 1;
          player.addStatusEffect('skip_turn', turns);
          logs.push({ player: player.name, text: `下 ${turns} 回合无法行动` });
          break;
        }

        case 'dot_damage': {
          const turnsLeft = effect.turnsLeft || 2;
          player.addStatusEffect('dot_damage', turnsLeft, effect.value);
          logs.push({ player: player.name, text: `受到持续伤害 (${effect.value}/回合，持续 ${turnsLeft} 回合)` });
          break;
        }

        case 'shield': {
          const turnsLeft = effect.turnsLeft || 3;
          player.addStatusEffect('shield', turnsLeft, effect.value);
          logs.push({ player: player.name, text: `获得护盾 (持续 ${turnsLeft} 回合)` });
          break;
        }

        case 'move_back': {
          const steps = effect.value || 1;
          const newNode = knockback(player.currentNodeId, steps);
          player.currentNodeId = newNode;
          logs.push({ player: player.name, text: `后退 ${steps} 步` });
          break;
        }
      }
    }
  }

  return logs;
}

/**
 * 解析目标
 */
function resolveTargets(target, triggerPlayer, allPlayers) {
  switch (target) {
    case 'self':
      return [triggerPlayer];
    case 'all':
      return allPlayers.filter(p => p.isAlive);
    case 'others':
      return allPlayers.filter(p => p.isAlive && p.id !== triggerPlayer.id);
    case 'nearby': {
      // 同一节点或相邻节点的玩家
      const node = getNodeById(triggerPlayer.currentNodeId);
      const nearbyIds = node ? [node.id, ...node.connections] : [triggerPlayer.currentNodeId];
      return allPlayers.filter(p => p.isAlive && nearbyIds.includes(p.currentNodeId));
    }
    default:
      return [triggerPlayer];
  }
}

/**
 * 后退 N 步（沿连接反向查找）
 * 简化实现：向前搜索连接到当前节点的节点
 */
function knockback(currentNodeId, steps) {
  // 由于是有向图，需要找到哪些节点连接到当前节点
  // 懒导入避免循环
  let nodeId = currentNodeId;

  for (let i = 0; i < steps; i++) {
    // 查找所有地图节点中连接到当前节点的
    const prevNodeId = findPreviousNode(nodeId);
    if (prevNodeId !== null) {
      nodeId = prevNodeId;
    } else {
      break; // 无法再后退
    }
  }

  return nodeId;
}

// 用于在 effects 模块内查找前驱节点
let _mapNodesRef = null;

export function setMapNodesRef(nodes) {
  _mapNodesRef = nodes;
}

function findPreviousNode(nodeId) {
  if (!_mapNodesRef) return null;
  for (const node of _mapNodesRef) {
    if (node.connections.includes(nodeId)) {
      return node.id;
    }
  }
  return null;
}
