import { Player } from './player.js';
import { createShuffledDeck, drawCard, fixedDisasters } from './disaster-cards.js';
import { rollDice } from './dice.js';
import { applyEffects, setMapNodesRef } from './effects.js';
import { getNodeById, getReachableNodes, mapNodes } from './map-data.js';
import { GAME_CONFIG } from '../config.js';

/**
 * 游戏状态机
 * 管理整个游戏的完整状态和回合流程
 */
export class GameState {
  constructor() {
    this.phase = 'lobby';  // lobby | playing | ended
    this.players = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.turnPhase = 'idle';  // idle | roll | moving | event | resolve
    this.diceResult = 0;
    this.disasterDeck = [];
    this.roundNumber = 0;
    this.maxRounds = GAME_CONFIG.maxRounds;
    this.mode = 'local';  // local | online
    this.roomCode = null;
    this.eventLog = [];
    this.pendingForkChoices = null;  // 分叉待选
    this.currentCard = null;

    // 回调
    this.onStateChange = null;      // (state) => void
    this.onPlayerMove = null;       // (playerId, path) => Promise
    this.onDiceRolled = null;       // (playerId, result) => void
    this.onCardDrawn = null;        // (card, logs) => void
    this.onFixedDisaster = null;    // (disaster, logs) => void
    this.onSafeNode = null;         // (logs) => void
    this.onForkChoice = null;       // (choices) => void
    this.onPlayerEliminated = null; // (playerId) => void
    this.onGameEnd = null;          // (rankings) => void
    this.onTurnStart = null;        // (playerId) => void
    this.onLog = null;              // (entry) => void

    setMapNodesRef(mapNodes);
  }

  /**
   * 添加玩家
   */
  addPlayer(name, isAI = false) {
    if (this.phase !== 'lobby') return null;
    if (this.players.length >= GAME_CONFIG.maxPlayers) return null;

    const id = `p${this.players.length}`;
    const player = new Player(id, name, this.players.length, isAI);
    this.players.push(player);
    return player;
  }

  /**
   * 开始游戏
   */
  startGame() {
    if (this.players.length < GAME_CONFIG.minPlayers) return false;

    this.phase = 'playing';
    this.disasterDeck = createShuffledDeck();
    this.roundNumber = 1;

    // 随机决定出发顺序
    this.turnOrder = this.players.map(p => p.id);
    for (let i = this.turnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.turnOrder[i], this.turnOrder[j]] = [this.turnOrder[j], this.turnOrder[i]];
    }

    this.currentTurnIndex = 0;
    this._log(`游戏开始！共 ${this.players.length} 位玩家，最多 ${this.maxRounds} 回合。`);
    this._log(`出发顺序：${this.turnOrder.map(id => this.getPlayer(id).name).join(' → ')}`);

    this._startTurn();
    return true;
  }

  /**
   * 获取当前行动玩家
   */
  getCurrentPlayer() {
    const id = this.turnOrder[this.currentTurnIndex];
    return this.getPlayer(id);
  }

  getPlayer(id) {
    return this.players.find(p => p.id === id);
  }

  /**
   * 开始回合
   */
  _startTurn() {
    const player = this.getCurrentPlayer();
    if (!player || !player.isAlive) {
      this._nextTurn();
      return;
    }

    // 处理持续效果
    const skip = player.tickStatusEffects();
    if (skip) {
      this._log(`${player.name} 因状态效果跳过本回合。`);
      if (!player.isAlive) {
        this._log(`${player.name} 因持续伤害被淘汰！`);
        this.onPlayerEliminated?.(player.id);
      }
      this._nextTurn();
      return;
    }

    this.turnPhase = 'roll';
    this._log(`--- ${player.name} 的回合 ---`);
    this.onTurnStart?.(player.id);
    this.onStateChange?.(this);
  }

  /**
   * 执行掷骰子
   */
  async doRoll() {
    if (this.turnPhase !== 'roll') return;

    const player = this.getCurrentPlayer();
    this.diceResult = rollDice();
    this._log(`${player.name} 掷出了 ${this.diceResult}`);

    this.onDiceRolled?.(player.id, this.diceResult);

    // 计算可到达的终点
    const reachable = getReachableNodes(player.currentNodeId, this.diceResult);

    if (reachable.length > 1) {
      // 存在分叉，需要玩家选择
      this.pendingForkChoices = reachable;
      this.turnPhase = 'moving';
      this.onForkChoice?.(reachable);
      this.onStateChange?.(this);
    } else if (reachable.length === 1) {
      // 唯一路线，等待移动和事件处理完毕
      this.onStateChange?.(this);
      await this._moveToNode(player, reachable[0]);
    }
  }

  /**
   * 选择分叉方向
   */
  async chooseFork(targetNodeId) {
    if (this.turnPhase !== 'moving' || !this.pendingForkChoices) return;
    if (!this.pendingForkChoices.includes(targetNodeId)) return;

    const player = this.getCurrentPlayer();
    this.pendingForkChoices = null;
    await this._moveToNode(player, targetNodeId);
  }

  /**
   * 移动到目标节点
   */
  async _moveToNode(player, targetNodeId) {
    const prevNodeId = player.currentNodeId;
    this.turnPhase = 'moving';

    // 计算移动路径
    const path = this._buildPath(prevNodeId, targetNodeId, this.diceResult);
    player.currentNodeId = targetNodeId;

    // 通知渲染层执行动画
    if (this.onPlayerMove) {
      await this.onPlayerMove(player.id, path);
    }

    // 触发节点事件
    this.turnPhase = 'event';
    await this._triggerNodeEvent(player, targetNodeId);

    // 结算
    this.turnPhase = 'resolve';
    this._checkGameEnd();

    if (this.phase === 'playing') {
      this._nextTurn();
    }
  }

  /**
   * 构建从起点到终点的路径
   */
  _buildPath(fromId, toId, steps) {
    const path = [];
    let currentId = fromId;

    for (let i = 0; i < steps; i++) {
      const node = getNodeById(currentId);
      if (!node) break;

      // 选择朝 toId 方向的下一步
      let nextId = node.connections[0];

      // 如果有多个连接，选择最终通往目标的
      if (node.connections.length > 1) {
        for (const connId of node.connections) {
          if (connId === toId || this._canReach(connId, toId, steps - i - 1)) {
            nextId = connId;
            break;
          }
        }
      }

      path.push(nextId);
      currentId = nextId;
    }

    return path;
  }

  _canReach(fromId, toId, maxSteps) {
    if (fromId === toId) return true;
    if (maxSteps <= 0) return false;
    const node = getNodeById(fromId);
    if (!node) return false;
    return node.connections.some(c => this._canReach(c, toId, maxSteps - 1));
  }

  /**
   * 触发节点事件
   */
  async _triggerNodeEvent(player, nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;

    switch (node.type) {
      case 'disaster_fixed': {
        const disaster = fixedDisasters[node.disasterId];
        if (disaster) {
          const logs = applyEffects(disaster.effects, player, this.players);
          this._log(`${player.name} 遭遇 ${disaster.name}！`);
          logs.forEach(l => this._log(`  ${l.player}: ${l.text}`));
          // 等待弹窗关闭
          if (this.onFixedDisaster) {
            await this.onFixedDisaster(disaster, logs);
          }
          if (!player.isAlive) {
            this.onPlayerEliminated?.(player.id);
          }
        }
        break;
      }

      case 'disaster_random': {
        const card = drawCard(this.disasterDeck);
        this.currentCard = card;
        const logs = applyEffects(card.effects, player, this.players);
        this._log(`${player.name} 抽到了 [${card.name}]`);
        logs.forEach(l => this._log(`  ${l.player}: ${l.text}`));
        // 等待弹窗关闭
        if (this.onCardDrawn) {
          await this.onCardDrawn(card, logs);
        }

        for (const log of logs) {
          const p = this.players.find(pl => pl.name === log.player);
          if (p && !p.isAlive) {
            this.onPlayerEliminated?.(p.id);
          }
        }
        break;
      }

      case 'safe': {
        const healAmount = 8;
        const healed = player.heal(healAmount);
        const logs = [{ player: player.name, text: `在安全点恢复了 ${healed} 点生命 (HP: ${player.hp}/${player.maxHp})`, type: 'heal' }];
        this._log(`${player.name} 到达安全点 "${node.label}"，恢复 ${healed} HP`);
        if (this.onSafeNode) {
          await this.onSafeNode(logs);
        }
        break;
      }

      case 'start': {
        // 经过起点回血
        if (this.roundNumber > 1) {
          const healed = player.heal(5);
          this._log(`${player.name} 经过起点，恢复 ${healed} HP`);
        }
        break;
      }
    }

    this.onStateChange?.(this);
  }

  /**
   * 下一回合
   */
  _nextTurn() {
    this.turnPhase = 'idle';

    // 找下一个存活玩家
    let tries = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
      tries++;

      // 完成一轮
      if (this.currentTurnIndex === 0) {
        this.roundNumber++;
        this._log(`=== 第 ${this.roundNumber} 回合 ===`);
      }
    } while (!this.getCurrentPlayer().isAlive && tries < this.turnOrder.length);

    if (this._checkGameEnd()) return;

    this._startTurn();
  }

  /**
   * 检查游戏结束
   */
  _checkGameEnd() {
    const alive = this.players.filter(p => p.isAlive);

    // 只剩一人存活
    if (alive.length <= 1) {
      this.phase = 'ended';
      const rankings = this._calculateRankings();
      this._log('游戏结束！');
      this.onGameEnd?.(rankings);
      return true;
    }

    // 达到回合上限
    if (this.roundNumber > this.maxRounds) {
      this.phase = 'ended';
      const rankings = this._calculateRankings();
      this._log(`已达到最大回合数 ${this.maxRounds}，游戏结束！`);
      this.onGameEnd?.(rankings);
      return true;
    }

    return false;
  }

  /**
   * 计算排名
   */
  _calculateRankings() {
    return [...this.players].sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1;
      if (!a.isAlive && b.isAlive) return 1;
      return b.hp - a.hp;
    });
  }

  _log(text) {
    const entry = { text, time: Date.now() };
    this.eventLog.push(entry);
    this.onLog?.(entry);
  }

  /**
   * 序列化（用于网络同步）
   */
  toJSON() {
    return {
      phase: this.phase,
      players: this.players.map(p => p.toJSON()),
      turnOrder: this.turnOrder,
      currentTurnIndex: this.currentTurnIndex,
      turnPhase: this.turnPhase,
      diceResult: this.diceResult,
      roundNumber: this.roundNumber,
      maxRounds: this.maxRounds,
    };
  }
}
