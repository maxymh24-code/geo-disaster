/**
 * 主菜单 + 玩家设置
 */
export class Menu {
  constructor(onStartLocal, onStartOnline) {
    this.container = document.getElementById('main-menu');
    this.onStartLocal = onStartLocal;
    this.onStartOnline = onStartOnline;
    this._styleInjected = false;

    this._setupButtons();
  }

  _setupButtons() {
    document.getElementById('btn-local')?.addEventListener('click', () => {
      this._showPlayerSetup();
    });

    document.getElementById('btn-online')?.addEventListener('click', () => {
      this.onStartOnline?.();
    });
  }

  _injectStyle() {
    if (this._styleInjected) return;
    this._styleInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      .player-setup { text-align: center; }
      .player-input-row {
        margin: 8px 0; display: flex; align-items: center;
        justify-content: center; gap: 8px;
      }
      .player-name-input {
        width: 150px; padding: 10px 14px; font-size: 15px;
        background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px; color: #fff; outline: none;
      }
      .player-name-input:focus { border-color: #ff6b35; }
      .player-setup button { width: 200px; }
      .ai-toggle {
        padding: 6px 12px; font-size: 12px; border-radius: 4px; cursor: pointer;
        border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05);
        color: #888; transition: all 0.2s; min-width: 50px;
      }
      .ai-toggle.is-ai {
        background: rgba(255,107,53,0.25); border-color: #ff6b35; color: #ff9a5c;
      }
    `;
    document.head.appendChild(style);
  }

  _showPlayerSetup() {
    this._injectStyle();
    const buttons = this.container.querySelector('.menu-buttons');
    buttons.innerHTML = `
      <div class="player-setup">
        <h3 style="color: #ff9a5c; margin-bottom: 16px;">玩家设置</h3>
        <div id="player-inputs">
          <div class="player-input-row">
            <input type="text" placeholder="玩家 1 名字" value="你" class="player-name-input" />
            <button class="ai-toggle" data-ai="false">人类</button>
          </div>
          <div class="player-input-row">
            <input type="text" placeholder="玩家 2 名字" value="AI-1" class="player-name-input" />
            <button class="ai-toggle is-ai" data-ai="true">AI</button>
          </div>
          <div class="player-input-row">
            <input type="text" placeholder="玩家 3 名字" value="AI-2" class="player-name-input" />
            <button class="ai-toggle is-ai" data-ai="true">AI</button>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 12px; justify-content: center;">
          <button id="btn-add-player" style="flex: none; width: 95px;">+ 添加</button>
          <button id="btn-remove-player" style="flex: none; width: 95px;">- 移除</button>
        </div>
        <button id="btn-start-game" style="margin-top: 20px; background: rgba(255,107,53,0.3);">开始游戏</button>
        <button id="btn-back-setup" style="margin-top: 8px;">返回</button>
      </div>
    `;

    const inputsEl = document.getElementById('player-inputs');
    let playerCount = 3;

    // AI 切换事件委托
    inputsEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('ai-toggle')) {
        const isAI = e.target.dataset.ai === 'true';
        e.target.dataset.ai = isAI ? 'false' : 'true';
        e.target.textContent = isAI ? '人类' : 'AI';
        e.target.classList.toggle('is-ai', !isAI);
      }
    });

    document.getElementById('btn-add-player').addEventListener('click', () => {
      if (playerCount >= 6) return;
      playerCount++;
      const row = document.createElement('div');
      row.className = 'player-input-row';
      row.innerHTML = `
        <input type="text" placeholder="玩家 ${playerCount} 名字" value="AI-${playerCount - 1}" class="player-name-input" />
        <button class="ai-toggle is-ai" data-ai="true">AI</button>
      `;
      inputsEl.appendChild(row);
    });

    document.getElementById('btn-remove-player').addEventListener('click', () => {
      if (playerCount <= 2) return;
      inputsEl.removeChild(inputsEl.lastChild);
      playerCount--;
    });

    document.getElementById('btn-start-game').addEventListener('click', () => {
      const rows = inputsEl.querySelectorAll('.player-input-row');
      const players = Array.from(rows).map((row, i) => {
        const name = row.querySelector('.player-name-input').value.trim() || `玩家${i + 1}`;
        const isAI = row.querySelector('.ai-toggle').dataset.ai === 'true';
        return { name, isAI };
      });
      this.hide();
      this.onStartLocal?.(players);
    });

    document.getElementById('btn-back-setup').addEventListener('click', () => {
      this._restoreMenu();
    });
  }

  _restoreMenu() {
    let menuButtons = this.container.querySelector('.menu-buttons');
    if (!menuButtons) {
      menuButtons = document.createElement('div');
      menuButtons.className = 'menu-buttons';
      this.container.appendChild(menuButtons);
    }
    menuButtons.innerHTML = `
      <button id="btn-local">本地游戏</button>
      <button id="btn-online">在线对战</button>
    `;
    this._setupButtons();
  }

  show() {
    this.container.classList.remove('hidden');
    this._restoreMenu();
  }

  hide() {
    this.container.classList.add('hidden');
  }
}
