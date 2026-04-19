/**
 * 骰子逻辑
 */

/**
 * 掷骰子（1-6）
 */
export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * 使用种子随机数掷骰子（用于在线同步）
 */
export function rollDiceSeeded(rng) {
  return Math.floor(rng() * 6) + 1;
}
