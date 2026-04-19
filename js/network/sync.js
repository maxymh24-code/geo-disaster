/**
 * 在线模式下的游戏状态同步
 * 接收服务端消息并驱动客户端渲染和 UI 更新
 */
export class GameSync {
  constructor(networkClient, renderers, ui) {
    this.net = networkClient;
    this.renderers = renderers;
    this.ui = ui;
    this.localPlayerId = networkClient.playerId;

    this._bindHandlers();
  }

  _bindHandlers() {
    this.net.on('turn_start', (msg) => {
      this.ui.hud?.setActivePlayer(msg.playerId);
      if (msg.playerId === this.localPlayerId) {
        this.ui.diceUI?.show();
      }
    });

    this.net.on('dice_result', (msg) => {
      this.ui.diceUI?.showResult(msg.result);
    });

    this.net.on('player_moved', (msg) => {
      this.renderers.playerRenderer.movePiece(msg.playerId, msg.path, () => {});
    });

    this.net.on('fork_choice', (msg) => {
      if (msg.playerId === this.localPlayerId) {
        this.ui.forkChoice?.show(msg.choices);
      }
    });

    this.net.on('card_drawn', (msg) => {
      this.ui.cardPopup?.show(msg.card, msg.logs);
    });

    this.net.on('fixed_disaster', (msg) => {
      this.ui.cardPopup?.showDisaster(msg.disaster, msg.logs);
    });

    this.net.on('safe_node', (msg) => {
      this.ui.cardPopup?.showSafe(msg.logs);
    });

    this.net.on('player_eliminated', (msg) => {
      this.renderers.playerRenderer.setEliminated(msg.playerId);
      this.ui.hud?.setEliminated(msg.playerId);
    });

    this.net.on('game_ended', (msg) => {
      this.ui.resultScreen?.show(msg.rankings);
    });

    this.net.on('state_sync', (msg) => {
      // 全量状态同步（重连后）
      if (msg.state) {
        this._applySyncState(msg.state);
      }
    });

    this.net.on('log', (msg) => {
      this.ui.gameLog?.addEntry(msg.text);
    });
  }

  /**
   * 发送掷骰子意图
   */
  sendRoll() {
    this.net.send('roll_dice');
  }

  /**
   * 发送分叉选择
   */
  sendForkChoice(targetNodeId) {
    this.net.send('choose_fork', { targetNodeId });
  }

  _applySyncState(state) {
    // 更新 HUD
    if (state.players) {
      this.ui.hud?.init(state.players);
    }
  }
}
