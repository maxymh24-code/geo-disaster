/**
 * 地图：灾变之岛
 * 基于桌游原型重新设计
 * 黄色节点 = 事件节点（disaster_random / disaster_fixed）
 * 黑色节点 = 普通安全节点（normal）
 * 约55个节点，环形路线 + 火山支线分叉
 *
 * 地形分布（匹配原型）:
 *   左上: 火山区（黑色，岩浆）
 *   右上/右侧: 热带森林（深绿）
 *   中部: 草地平原（亮绿）
 *   中右: 冰川/雪地
 *   底部: 海洋/海岸
 *   过渡: 沙滩、沼泽
 */

export const mapNodes = [
  // === 起点（中部平原，卡牌区旁） ===
  { id: 0,  x: 0,   z: 0,   type: 'start',           terrain: 'plains',  connections: [1], label: '起点' },

  // === 平原段向右，进入森林 ===
  { id: 1,  x: 8,   z: -2,  type: 'normal',           terrain: 'plains',  connections: [2] },
  { id: 2,  x: 16,  z: -3,  type: 'normal',           terrain: 'plains',  connections: [3] },
  { id: 3,  x: 23,  z: -1,  type: 'disaster_random',  terrain: 'plains',  connections: [4], label: '?' },
  { id: 4,  x: 30,  z: 2,   type: 'normal',           terrain: 'forest',  connections: [5] },
  { id: 5,  x: 36,  z: 6,   type: 'normal',           terrain: 'forest',  connections: [6] },
  { id: 6,  x: 40,  z: 12,  type: 'disaster_random',  terrain: 'forest',  connections: [7], label: '?' },
  { id: 7,  x: 43,  z: 19,  type: 'normal',           terrain: 'forest',  connections: [8] },

  // === 森林深处，向上 ===
  { id: 8,  x: 44,  z: 26,  type: 'normal',           terrain: 'forest',  connections: [9] },
  { id: 9,  x: 42,  z: 33,  type: 'disaster_random',  terrain: 'forest',  connections: [10], label: '?' },
  { id: 10, x: 38,  z: 38,  type: 'safe',             terrain: 'forest',  connections: [11], label: '森林营地' },
  { id: 11, x: 33,  z: 42,  type: 'normal',           terrain: 'forest',  connections: [12] },
  { id: 12, x: 27,  z: 44,  type: 'normal',           terrain: 'forest',  connections: [13] },

  // === 从森林穿过平原，接近火山区 ===
  { id: 13, x: 20,  z: 43,  type: 'disaster_random',  terrain: 'plains',  connections: [14], label: '?' },
  { id: 14, x: 13,  z: 42,  type: 'normal',           terrain: 'plains',  connections: [15] },
  { id: 15, x: 6,   z: 43,  type: 'normal',           terrain: 'plains',  connections: [16] },
  { id: 16, x: -2,  z: 44,  type: 'disaster_random',  terrain: 'plains',  connections: [17, 40], label: '?' },  // 分叉！直走或上火山

  // === 主路线：绕过火山外围 ===
  { id: 17, x: -10, z: 43,  type: 'normal',           terrain: 'plains',  connections: [18] },
  { id: 18, x: -18, z: 40,  type: 'disaster_fixed',   terrain: 'volcano', connections: [19], label: '火山灰', disasterId: 'ash_1' },
  { id: 19, x: -24, z: 36,  type: 'normal',           terrain: 'volcano', connections: [20] },
  { id: 20, x: -28, z: 30,  type: 'normal',           terrain: 'volcano', connections: [21] },
  { id: 21, x: -30, z: 23,  type: 'disaster_random',  terrain: 'volcano', connections: [22], label: '?' },
  { id: 22, x: -30, z: 16,  type: 'normal',           terrain: 'volcano', connections: [23] },

  // === 火山区向下，进入冰川 ===
  { id: 23, x: -28, z: 9,   type: 'disaster_fixed',   terrain: 'volcano', connections: [24], label: '泥石流', disasterId: 'mudslide_1' },
  { id: 24, x: -24, z: 3,   type: 'normal',           terrain: 'plains',  connections: [25] },
  { id: 25, x: -20, z: -3,  type: 'normal',           terrain: 'glacier', connections: [26] },
  { id: 26, x: -18, z: -10, type: 'disaster_fixed',   terrain: 'glacier', connections: [27], label: '暴风雪', disasterId: 'blizzard_1' },
  { id: 27, x: -15, z: -17, type: 'normal',           terrain: 'glacier', connections: [28] },
  { id: 28, x: -12, z: -23, type: 'safe',             terrain: 'glacier', connections: [29], label: '冰洞避难' },
  { id: 29, x: -8,  z: -28, type: 'normal',           terrain: 'glacier', connections: [30] },
  { id: 30, x: -3,  z: -32, type: 'disaster_random',  terrain: 'glacier', connections: [31], label: '?' },

  // === 冰川向右下，进入海洋/海岸 ===
  { id: 31, x: 3,   z: -35, type: 'normal',           terrain: 'ocean',   connections: [32] },
  { id: 32, x: 10,  z: -37, type: 'disaster_fixed',   terrain: 'ocean',   connections: [33], label: '海啸', disasterId: 'tsunami_1' },
  { id: 33, x: 17,  z: -38, type: 'normal',           terrain: 'ocean',   connections: [34] },
  { id: 34, x: 24,  z: -37, type: 'normal',           terrain: 'ocean',   connections: [35] },
  { id: 35, x: 30,  z: -34, type: 'disaster_random',  terrain: 'ocean',   connections: [36], label: '?' },
  { id: 36, x: 34,  z: -29, type: 'normal',           terrain: 'ocean',   connections: [37] },

  // === 海岸向上回到平原 ===
  { id: 37, x: 36,  z: -22, type: 'safe',             terrain: 'ocean',   connections: [38], label: '海边庇护所' },
  { id: 38, x: 35,  z: -15, type: 'normal',           terrain: 'plains',  connections: [39] },
  { id: 39, x: 32,  z: -9,  type: 'disaster_random',  terrain: 'plains',  connections: [48], label: '?' },

  // === 火山支线（从节点16分叉，穿过火山顶） ===
  { id: 40, x: -6,  z: 48,  type: 'normal',           terrain: 'volcano', connections: [41] },
  { id: 41, x: -12, z: 52,  type: 'disaster_random',  terrain: 'volcano', connections: [42], label: '?' },
  { id: 42, x: -18, z: 54,  type: 'disaster_fixed',   terrain: 'volcano', connections: [43], label: '火山喷发', disasterId: 'volcano_1' },
  { id: 43, x: -24, z: 53,  type: 'normal',           terrain: 'volcano', connections: [44] },
  { id: 44, x: -30, z: 50,  type: 'disaster_random',  terrain: 'volcano', connections: [45], label: '?' },
  { id: 45, x: -34, z: 44,  type: 'normal',           terrain: 'volcano', connections: [46] },
  { id: 46, x: -35, z: 37,  type: 'disaster_fixed',   terrain: 'volcano', connections: [47], label: '岩浆流', disasterId: 'lava_1' },
  { id: 47, x: -33, z: 30,  type: 'normal',           terrain: 'volcano', connections: [20] },  // 汇合到主路线节点20

  // === 回到起点段（从节点39继续） ===
  { id: 48, x: 27,  z: -5,  type: 'normal',           terrain: 'plains',  connections: [49] },
  { id: 49, x: 22,  z: -3,  type: 'disaster_random',  terrain: 'plains',  connections: [50], label: '?' },
  { id: 50, x: 16,  z: -1,  type: 'normal',           terrain: 'plains',  connections: [51] },
  { id: 51, x: 10,  z: 1,   type: 'normal',           terrain: 'plains',  connections: [0] },  // 回到起点
];

/**
 * 通过 ID 查找节点
 */
export function getNodeById(id) {
  return mapNodes.find(n => n.id === id);
}

/**
 * 获取节点的连接节点列表
 */
export function getConnectedNodes(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return [];
  return node.connections.map(id => getNodeById(id)).filter(Boolean);
}

/**
 * 从 startId 前进 steps 步的可达路径
 * 返回所有可能的终点节点（分叉时有多个）
 */
export function getReachableNodes(startId, steps) {
  if (steps <= 0) return [startId];

  const results = [];

  function walk(currentId, remaining) {
    if (remaining === 0) {
      if (!results.includes(currentId)) {
        results.push(currentId);
      }
      return;
    }
    const node = getNodeById(currentId);
    if (!node) return;
    for (const nextId of node.connections) {
      walk(nextId, remaining - 1);
    }
  }

  walk(startId, steps);
  return results;
}
