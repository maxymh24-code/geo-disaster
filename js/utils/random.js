/**
 * 种子随机数生成器
 * 用于在线模式的确定性随机
 */
export class SeededRandom {
  constructor(seed = 42) {
    this.seed = seed;
  }

  /**
   * 返回 [0, 1) 的随机数
   */
  next() {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * 返回 [min, max] 的整数
   */
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * 洗牌数组（原地修改）
   */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
