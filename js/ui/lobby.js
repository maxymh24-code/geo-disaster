/**
 * 在线大厅 UI
 */
export class Lobby {
  constructor(onBack) {
    this.container = null;
    this.onBack = onBack;
    this.onGameStart = null;
    this.roomClient = null;
    this._createContainer();
  }

  _createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'lobby-screen';
    this.container.className = 'hidden';
    this.container.style.cssText = `
      position: fixed; inset: 0; z-index: 100;
      background: rgba(10,15,26,0.9); backdrop-filter: blur(10px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #e0e0e0; font-family: inherit;
    `;
    document.body.appendChild(this.container);
  }

  showJoinCreate() {
    this.container.innerHTML = `
      <h2 style="color: #ff6b35; margin-bottom: 30px;">在线对战</h2>
      <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
        <input type="text" id="lobby-name" placeholder="你的名字" value="玩家"
          style="width: 200px; padding: 10px; font-size: 15px; background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; outline: none;" />
        <button id="lobby-create" style="width: 200px; padding: 12px; font-size: 16px;
          border: 2px solid rgba(255,107,53,0.4); border-radius: 8px; background: rgba(255,107,53,0.15);
          color: #ff9a5c; cursor: pointer;">创建房间</button>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="lobby-code" placeholder="房间码" maxlength="4"
            style="width: 100px; padding: 10px; font-size: 16px; text-align: center; text-transform: uppercase;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px; color: #fff; outline: none; letter-spacing: 4px;" />
          <button id="lobby-join" style="padding: 10px 20px; font-size: 15px;
            border: 2px solid rgba(255,107,53,0.4); border-radius: 8px; background: rgba(255,107,53,0.1);
            color: #ff9a5c; cursor: pointer;">加入</button>
        </div>
        <button id="lobby-back" style="margin-top: 20px; padding: 10px 30px; font-size: 14px;
          border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; background: rgba(255,255,255,0.05);
          color: #888; cursor: pointer;">返回</button>
        <p id="lobby-error" style="color: #ff4444; font-size: 13px; margin-top: 8px;"></p>
      </div>
    `;

    this.container.classList.remove('hidden');

    document.getElementById('lobby-create').addEventListener('click', () => {
      const name = document.getElementById('lobby-name').value.trim() || '玩家';
      this._createRoom(name);
    });

    document.getElementById('lobby-join').addEventListener('click', () => {
      const name = document.getElementById('lobby-name').value.trim() || '玩家';
      const code = document.getElementById('lobby-code').value.trim().toUpperCase();
      if (code.length !== 4) {
        document.getElementById('lobby-error').textContent = '请输入4位房间码';
        return;
      }
      this._joinRoom(code, name);
    });

    document.getElementById('lobby-back').addEventListener('click', () => {
      this.hide();
      this.onBack?.();
    });
  }

  async _createRoom(name) {
    try {
      const { RoomClient } = await import('../network/room-client.js');
      this.roomClient = new RoomClient();
      await this.roomClient.connect();

      this.roomClient.onRoomCreated = (msg) => {
        this._showWaitingRoom(msg.roomCode, msg.players, true);
      };
      this.roomClient.onError = (message) => {
        document.getElementById('lobby-error').textContent = message;
      };

      this.roomClient.createRoom(name);
    } catch (e) {
      document.getElementById('lobby-error').textContent = '连接服务器失败';
    }
  }

  async _joinRoom(code, name) {
    try {
      const { RoomClient } = await import('../network/room-client.js');
      this.roomClient = new RoomClient();
      await this.roomClient.connect();

      this.roomClient.onRoomJoined = (msg) => {
        this._showWaitingRoom(msg.roomCode, msg.players, false);
      };
      this.roomClient.onError = (message) => {
        document.getElementById('lobby-error').textContent = message;
      };

      this.roomClient.joinRoom(code, name);
    } catch (e) {
      document.getElementById('lobby-error').textContent = '连接服务器失败';
    }
  }

  _showWaitingRoom(roomCode, players, isHost) {
    this.container.innerHTML = `
      <h2 style="color: #ff6b35; margin-bottom: 10px;">等待玩家</h2>
      <p style="font-size: 32px; letter-spacing: 8px; color: #fff; margin-bottom: 20px;
        font-weight: 700; background: rgba(255,255,255,0.08); padding: 12px 24px;
        border-radius: 8px;">${roomCode}</p>
      <p style="font-size: 13px; color: #888; margin-bottom: 20px;">将房间码分享给朋友</p>
      <div id="lobby-player-list" style="margin-bottom: 20px; text-align: center;"></div>
      ${isHost ? `<button id="lobby-start" style="padding: 12px 40px; font-size: 16px;
        border: 2px solid rgba(255,107,53,0.4); border-radius: 8px; background: rgba(255,107,53,0.2);
        color: #ff9a5c; cursor: pointer; margin-bottom: 12px;">开始游戏</button>` : ''}
      <button id="lobby-leave" style="padding: 10px 30px; font-size: 14px;
        border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; background: rgba(255,255,255,0.05);
        color: #888; cursor: pointer;">离开房间</button>
    `;

    this._updatePlayerList(players);

    this.roomClient.onPlayerJoined = (msg) => {
      this._updatePlayerList(msg.players);
    };

    this.roomClient.onPlayerLeft = (msg) => {
      const list = document.getElementById('lobby-player-list');
      if (list) list.innerHTML += `<p style="color:#888; font-size:12px;">有玩家离开</p>`;
    };

    this.roomClient.onGameStarted = (msg) => {
      this.hide();
      this.onGameStart?.(this.roomClient, msg.state);
    };

    if (isHost) {
      document.getElementById('lobby-start').addEventListener('click', () => {
        this.roomClient.startGame();
      });
    }

    document.getElementById('lobby-leave').addEventListener('click', () => {
      this.roomClient.leaveRoom();
      this.showJoinCreate();
    });
  }

  _updatePlayerList(players) {
    const listEl = document.getElementById('lobby-player-list');
    if (!listEl) return;

    listEl.innerHTML = players.map(p =>
      `<div style="padding: 6px 16px; margin: 4px 0; background: rgba(255,255,255,0.05);
        border-radius: 4px; font-size: 15px;">${p.name}</div>`
    ).join('');
  }

  show() {
    this.showJoinCreate();
  }

  hide() {
    this.container.classList.add('hidden');
    if (this.roomClient) {
      this.roomClient = null;
    }
  }
}
