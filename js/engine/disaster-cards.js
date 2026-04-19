/**
 * 灾害卡牌库
 * 基于桌游原型调整，HP上限50
 */

export const disasterCards = [
  // === 地震 ===
  {
    id: 'eq_1', name: '轻微地震', type: 'earthquake', rarity: 'common',
    description: '地面轻微晃动，碎石滚落。',
    effects: [{ type: 'damage', value: 4, target: 'self' }],
  },
  {
    id: 'eq_2', name: '强烈地震', type: 'earthquake', rarity: 'rare',
    description: '大地剧烈震动，地面开裂！',
    effects: [{ type: 'damage', value: 10, target: 'self' }],
  },
  {
    id: 'eq_3', name: '地裂', type: 'earthquake', rarity: 'epic',
    description: '地面突然崩裂，所有人都受到波及！',
    effects: [{ type: 'damage', value: 6, target: 'all' }],
  },

  // === 火山 ===
  {
    id: 'vol_1', name: '火山灰', type: 'volcano', rarity: 'common',
    description: '火山灰弥漫，视野受阻。',
    effects: [{ type: 'damage', value: 3, target: 'self' }, { type: 'skip_turn', value: 1, target: 'self' }],
  },
  {
    id: 'vol_2', name: '熔岩流', type: 'volcano', rarity: 'rare',
    description: '炽热的熔岩向你涌来！',
    effects: [{ type: 'damage', value: 12, target: 'self' }, { type: 'knockback', value: 2, target: 'self' }],
  },
  {
    id: 'vol_3', name: '火山喷发', type: 'volcano', rarity: 'epic',
    description: '火山猛烈喷发，岩浆四射！',
    effects: [{ type: 'damage', value: 18, target: 'self' }],
  },

  // === 海啸 ===
  {
    id: 'tsu_1', name: '潮汐异常', type: 'tsunami', rarity: 'common',
    description: '海水突然上涨，你被迫后退。',
    effects: [{ type: 'knockback', value: 2, target: 'self' }],
  },
  {
    id: 'tsu_2', name: '海啸', type: 'tsunami', rarity: 'rare',
    description: '一道巨浪席卷而来！',
    effects: [{ type: 'damage', value: 7, target: 'self' }, { type: 'knockback', value: 2, target: 'self' }],
  },

  // === 台风 ===
  {
    id: 'ty_1', name: '强风', type: 'typhoon', rarity: 'common',
    description: '狂风大作，站立不稳。',
    effects: [{ type: 'knockback', value: 3, target: 'self' }],
  },
  {
    id: 'ty_2', name: '台风', type: 'typhoon', rarity: 'rare',
    description: '超强台风登陆，摧毁一切！',
    effects: [{ type: 'damage', value: 8, target: 'self' }, { type: 'knockback', value: 3, target: 'self' }],
  },

  // === 暴风雪 ===
  {
    id: 'blz_1', name: '寒风刺骨', type: 'blizzard', rarity: 'common',
    description: '刺骨的寒风让你行动迟缓。',
    effects: [{ type: 'skip_turn', value: 1, target: 'self' }],
  },
  {
    id: 'blz_2', name: '暴风大雪', type: 'blizzard', rarity: 'rare',
    description: '暴风雪来袭，冻伤持续伤害。',
    effects: [{ type: 'damage', value: 5, target: 'self' }, { type: 'dot_damage', value: 2, turnsLeft: 2, target: 'self' }],
  },

  // === 泥石流/滑坡 ===
  {
    id: 'ls_1', name: '小型滑坡', type: 'landslide', rarity: 'common',
    description: '山体松动，碎石滑落。',
    effects: [{ type: 'damage', value: 5, target: 'self' }],
  },
  {
    id: 'ls_2', name: '泥石流', type: 'landslide', rarity: 'rare',
    description: '泥石流倾泻而下，无处可逃！',
    effects: [{ type: 'damage', value: 10, target: 'self' }, { type: 'knockback', value: 2, target: 'self' }],
  },

  // === 天坑 ===
  {
    id: 'sk_1', name: '地面塌陷', type: 'sinkhole', rarity: 'rare',
    description: '脚下的地面突然塌陷！',
    effects: [{ type: 'damage', value: 8, target: 'self' }, { type: 'skip_turn', value: 1, target: 'self' }],
  },

  // === 野火 ===
  {
    id: 'wf_1', name: '灌木着火', type: 'wildfire', rarity: 'common',
    description: '附近灌木丛起火，热浪袭来。',
    effects: [{ type: 'damage', value: 4, target: 'self' }],
  },
  {
    id: 'wf_2', name: '森林大火', type: 'wildfire', rarity: 'rare',
    description: '森林大火蔓延，烈焰吞噬一切！',
    effects: [{ type: 'damage', value: 6, target: 'nearby' }],
  },

  // === 洪水 ===
  {
    id: 'fl_1', name: '洪水', type: 'flood', rarity: 'common',
    description: '河水暴涨，洪水淹没了道路。',
    effects: [{ type: 'damage', value: 3, target: 'self' }, { type: 'knockback', value: 2, target: 'self' }],
  },
  {
    id: 'fl_2', name: '特大洪灾', type: 'flood', rarity: 'epic',
    description: '洪水席卷大地，所有人被冲散！',
    effects: [{ type: 'damage', value: 5, target: 'all' }, { type: 'knockback', value: 2, target: 'all' }],
  },

  // === 正面卡牌 ===
  {
    id: 'heal_1', name: '急救包', type: 'heal', rarity: 'common',
    description: '找到了一个急救包，恢复生命值。',
    effects: [{ type: 'heal', value: 8, target: 'self' }],
  },
  {
    id: 'heal_2', name: '温泉疗养', type: 'heal', rarity: 'rare',
    description: '发现了天然温泉，好好休息一下。',
    effects: [{ type: 'heal', value: 15, target: 'self' }],
  },
  {
    id: 'shield_1', name: '地质护盾', type: 'shield', rarity: 'rare',
    description: '获得了地质护盾，抵御下一次灾害。',
    effects: [{ type: 'shield', value: 1, turnsLeft: 3, target: 'self' }],
  },
];

// 固定灾害事件（地图上固定位置触发）
export const fixedDisasters = {
  volcano_1: {
    name: '火山喷发',
    type: 'volcano',
    description: '火山口猛烈喷发，岩浆四射！',
    effects: [{ type: 'damage', value: 18, target: 'self' }],
  },
  lava_1: {
    name: '岩浆流',
    type: 'volcano',
    description: '炽热的岩浆挡住了去路！',
    effects: [{ type: 'damage', value: 12, target: 'self' }],
  },
  ash_1: {
    name: '火山灰',
    type: 'volcano',
    description: '浓厚的火山灰弥漫，难以前行。',
    effects: [{ type: 'damage', value: 5, target: 'self' }, { type: 'skip_turn', value: 1, target: 'self' }],
  },
  mudslide_1: {
    name: '泥石流',
    type: 'landslide',
    description: '泥石流从山坡上倾泻而下。',
    effects: [{ type: 'damage', value: 8, target: 'self' }, { type: 'knockback', value: 2, target: 'self' }],
  },
  tsunami_1: {
    name: '海啸',
    type: 'tsunami',
    description: '巨浪从海面涌来！',
    effects: [{ type: 'damage', value: 7, target: 'self' }, { type: 'knockback', value: 2, target: 'self' }],
  },
  blizzard_1: {
    name: '暴风雪',
    type: 'blizzard',
    description: '冰川上的暴风雪区域，极度寒冷。',
    effects: [{ type: 'damage', value: 5, target: 'self' }, { type: 'skip_turn', value: 1, target: 'self' }],
  },
};

/**
 * 创建洗过的灾害卡牌组
 */
export function createShuffledDeck() {
  const deck = [...disasterCards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * 从牌组抽一张
 */
export function drawCard(deck) {
  if (deck.length === 0) {
    const newDeck = createShuffledDeck();
    deck.push(...newDeck);
  }
  return deck.pop();
}
