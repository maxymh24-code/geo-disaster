/**
 * 回合流程控制器
 * 连接 GameState 引擎层与 UI/渲染层
 * AI 玩家自动掷骰和选择
 */
export class TurnManager {
  constructor(gameState, renderers, ui) {
    this.gs = gameState;
    this.renderers = renderers;
    this.ui = ui;

    this._bindCallbacks();
  }

  _bindCallbacks() {
    const gs = this.gs;

    gs.onStateChange = () => this._updateUI();

    gs.onTurnStart = (playerId) => {
      const player = gs.getPlayer(playerId);
      this.ui.hud?.setActivePlayer(playerId);

      // 相机飞到当前玩家
      const pos = this.renderers.playerRenderer.getPiecePosition(playerId);
      if (pos) {
        this.renderers.cameraController.flyTo(pos.x, pos.y, pos.z);
      }

      if (player?.isAI) {
        // AI: 不显示骰子UI，延迟后自动掷骰
        this.ui.diceUI?.hide();
        setTimeout(() => this.handleRoll(), 800);
      } else {
        // 人类: 显示掷骰按钮
        this.ui.diceUI?.show();
      }
    };

    gs.onDiceRolled = (playerId, result) => {
      // 只给人类玩家显示骰子结果
      const player = gs.getPlayer(playerId);
      if (!player?.isAI) {
        this.ui.diceUI?.showResult(result);
      }
    };

    gs.onPlayerMove = (playerId, path) => {
      return new Promise(resolve => {
        this.renderers.playerRenderer.movePiece(playerId, path, resolve);
      });
    };

    gs.onForkChoice = (choices) => {
      const player = gs.getCurrentPlayer();
      if (player?.isAI) {
        setTimeout(() => {
          const pick = choices[Math.floor(Math.random() * choices.length)];
          this.handleForkChoice(pick);
        }, 500);
      } else {
        this.ui.forkChoice?.show(choices);
        this.renderers.pathRenderer.highlightNodes(choices);
      }
    };

    gs.onCardDrawn = (card, logs) => {
      const player = gs.getCurrentPlayer();
      if (player?.isAI) {
        return new Promise(resolve => setTimeout(resolve, 1000));
      }
      return this.ui.cardPopup?.show(card, logs);
    };

    gs.onFixedDisaster = (disaster, logs) => {
      const player = gs.getCurrentPlayer();
      if (player?.isAI) {
        return new Promise(resolve => setTimeout(resolve, 1000));
      }
      return this.ui.cardPopup?.showDisaster(disaster, logs);
    };

    gs.onSafeNode = (logs) => {
      const player = gs.getCurrentPlayer();
      if (player?.isAI) {
        return new Promise(resolve => setTimeout(resolve, 600));
      }
      return this.ui.cardPopup?.showSafe(logs);
    };

    gs.onPlayerEliminated = (playerId) => {
      this.renderers.playerRenderer.setEliminated(playerId);
      this.ui.hud?.setEliminated(playerId);
    };

    gs.onGameEnd = (rankings) => {
      this.ui.diceUI?.hide();
      this.ui.resultScreen?.show(rankings);
    };

    gs.onLog = (entry) => {
      this.ui.gameLog?.addEntry(entry.text);
    };
  }

  _updateUI() {
    this.ui.hud?.update(this.gs);
  }

  handleRoll() {
    this.gs.doRoll();
  }

  handleForkChoice(targetNodeId) {
    this.ui.forkChoice?.hide();
    this.renderers.pathRenderer.highlightNodes([]);
    this.gs.chooseFork(targetNodeId);
  }
}
