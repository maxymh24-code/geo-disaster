/**
 * HUD - 玩家血量条和回合信息
 */

const PLAYER_COLORS = ['#ff4444', '#4488ff', '#44cc44', '#ffcc00', '#cc44ff', '#ff8844'];

export class HUD {
  constructor() {
    this.container = document.getElementById('hud');
    this.playerBar = document.getElementById('player-info-bar');
    this.turnInfo = document.getElementById('turn-info');
    this.playerCards = new Map();
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }

  /**
   * 初始化玩家卡片
   */
  init(players) {
    this.playerBar.innerHTML = '';
    this.playerCards.clear();

    for (const player of players) {
      const card = document.createElement('div');
      card.className = 'player-card';
      card.dataset.playerId = player.id;

      const color = PLAYER_COLORS[player.colorIndex % PLAYER_COLORS.length];

      const aiTag = player.isAI ? ' <span style="font-size:10px;color:#888;">[AI]</span>' : '';
      card.innerHTML = `
        <div class="name" style="color: ${color}">${player.name}${aiTag}</div>
        <div class="hp-bar">
          <div class="hp-fill" style="width: 100%; background: ${color}"></div>
        </div>
        <div class="hp-text">${player.hp}/${player.maxHp}</div>
      `;

      this.playerBar.appendChild(card);
      this.playerCards.set(player.id, card);
    }

    this.show();
  }

  /**
   * 更新状态
   */
  update(gameState) {
    for (const player of gameState.players) {
      const card = this.playerCards.get(player.id);
      if (!card) continue;

      const fill = card.querySelector('.hp-fill');
      const text = card.querySelector('.hp-text');
      const hpPercent = (player.hp / player.maxHp) * 100;

      fill.style.width = hpPercent + '%';
      text.textContent = `${player.hp}/${player.maxHp}`;

      // 低血量变色
      if (hpPercent <= 25) {
        fill.style.background = '#ff2222';
      } else if (hpPercent <= 50) {
        fill.style.background = '#ffaa00';
      }
    }

    // 回合信息
    const current = gameState.getCurrentPlayer();
    if (current) {
      this.turnInfo.textContent = `第 ${gameState.roundNumber} 回合 | ${current.name} 的回合`;
    }
  }

  setActivePlayer(playerId) {
    for (const [id, card] of this.playerCards) {
      card.classList.toggle('active', id === playerId);
    }
  }

  setEliminated(playerId) {
    const card = this.playerCards.get(playerId);
    if (card) {
      card.classList.add('eliminated');
    }
  }
}
