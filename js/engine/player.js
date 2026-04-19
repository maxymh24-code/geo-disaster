/**
 * 玩家数据模型
 */
export class Player {
  constructor(id, name, colorIndex, isAI = false) {
    this.id = id;
    this.name = name;
    this.colorIndex = colorIndex;
    this.hp = 50;
    this.maxHp = 50;
    this.currentNodeId = 0;  // 起点
    this.isAlive = true;
    this.isAI = isAI;
    this.statusEffects = [];  // [{type, turnsLeft, value}]
  }

  takeDamage(amount) {
    if (!this.isAlive) return 0;
    const actual = Math.min(this.hp, amount);
    this.hp -= actual;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }
    return actual;
  }

  heal(amount) {
    if (!this.isAlive) return 0;
    const actual = Math.min(this.maxHp - this.hp, amount);
    this.hp += actual;
    return actual;
  }

  addStatusEffect(type, turnsLeft, value = 0) {
    this.statusEffects.push({ type, turnsLeft, value });
  }

  /**
   * 回合开始时处理状态效果
   * 返回需要跳过的布尔值
   */
  tickStatusEffects() {
    let skipTurn = false;

    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const effect = this.statusEffects[i];

      if (effect.type === 'skip_turn') {
        skipTurn = true;
      }
      if (effect.type === 'dot_damage') {
        this.takeDamage(effect.value);
      }
      if (effect.type === 'regen') {
        this.heal(effect.value);
      }

      effect.turnsLeft--;
      if (effect.turnsLeft <= 0) {
        this.statusEffects.splice(i, 1);
      }
    }

    return skipTurn;
  }

  hasEffect(type) {
    return this.statusEffects.some(e => e.type === type);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      colorIndex: this.colorIndex,
      hp: this.hp,
      maxHp: this.maxHp,
      currentNodeId: this.currentNodeId,
      isAlive: this.isAlive,
      isAI: this.isAI,
      statusEffects: [...this.statusEffects],
    };
  }

  static fromJSON(data) {
    const p = new Player(data.id, data.name, data.colorIndex, data.isAI);
    p.hp = data.hp;
    p.maxHp = data.maxHp;
    p.currentNodeId = data.currentNodeId;
    p.isAlive = data.isAlive;
    p.statusEffects = data.statusEffects || [];
    return p;
  }
}
