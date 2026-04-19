import { TerrainGenerator } from './render/terrain-gen.js';
import { CanvasRenderer } from './render/canvas-renderer.js';
import { mapNodes } from './engine/map-data.js';
import { GameState } from './engine/game-state.js';
import { TurnManager } from './engine/turn-manager.js';
import { Menu } from './ui/menu.js';
import { HUD } from './ui/hud.js';
import { DiceUI } from './ui/dice-ui.js';
import { CardPopup } from './ui/card-popup.js';
import { ForkChoice } from './ui/fork-choice.js';
import { GameLog } from './ui/game-log.js';
import { ResultScreen } from './ui/result-screen.js';
import { Lobby } from './ui/lobby.js';

let terrainGen, canvasRenderer;
let gameState, turnManager;
let menu, hud, diceUI, cardPopup, forkChoice, gameLog, resultScreen, lobby;

export function init() {
  const canvas = document.getElementById('game-canvas');

  // 2D 渲染初始化
  terrainGen = new TerrainGenerator(42);
  canvasRenderer = new CanvasRenderer(canvas);
  canvasRenderer.init(terrainGen, mapNodes);

  // UI 初始化
  gameLog = new GameLog();
  hud = new HUD();

  resultScreen = new ResultScreen(() => {
    resetGame();
    menu.show();
  });

  // 在线大厅
  lobby = new Lobby(() => menu.show());
  lobby.onGameStart = (roomClient, state) => {
    startOnlineGame(roomClient, state);
  };

  // 菜单
  menu = new Menu(
    (playerDataList) => startLocalGame(playerDataList),
    () => {
      menu.hide();
      lobby.show();
    }
  );

  // 显示主菜单
  menu.show();

  // 主循环
  function animate() {
    requestAnimationFrame(animate);
    canvasRenderer.render();
  }
  animate();
}

function startLocalGame(playerDataList) {
  gameState = new GameState();
  gameState.mode = 'local';

  for (const pd of playerDataList) {
    gameState.addPlayer(pd.name, pd.isAI);
  }

  // 创建棋子
  for (const player of gameState.players) {
    canvasRenderer.createPiece(player.id, player.colorIndex, 0, player.name);
  }

  diceUI = new DiceUI(() => turnManager.handleRoll());
  diceUI.hide();

  cardPopup = new CardPopup();
  forkChoice = new ForkChoice((nodeId) => turnManager.handleForkChoice(nodeId));

  // 2D 渲染器适配层（模拟3D接口）
  const playerRendererAdapter = {
    pieces: new Map(),
    group: { remove() {} },
    animations: [],
    createPiece() {},
    // 三参数回调模式（兼容 TurnManager）
    movePiece(playerId, path, onComplete) {
      canvasRenderer.movePiece(playerId, path).then(() => {
        if (onComplete) onComplete();
      });
    },
    getPiecePosition() { return null; },
    setEliminated() {},
    update() {},
  };

  const pathRendererAdapter = {
    highlightNodes(ids) { canvasRenderer.highlightNodes(ids); },
    getNodeWorldPosition(id) { return canvasRenderer.getNodeWorldPosition(id); },
  };

  const cameraControllerAdapter = {
    focusOnPosition() {},
    focusOnNode() {},
    flyTo() {},
  };

  turnManager = new TurnManager(
    gameState,
    { playerRenderer: playerRendererAdapter, pathRenderer: pathRendererAdapter, cameraController: cameraControllerAdapter },
    { hud, diceUI, cardPopup, forkChoice, gameLog, resultScreen }
  );

  hud.init(gameState.players);
  gameState.startGame();
}

function resetGame() {
  if (canvasRenderer) {
    canvasRenderer.players = [];
    canvasRenderer.playerAnims = {};
  }

  gameState = null;
  turnManager = null;
  gameLog.clear();
  hud.hide();

  if (diceUI) diceUI.hide();
  if (forkChoice) forkChoice.hide();
}

function startOnlineGame(roomClient, state) {
  gameState = new GameState();
  gameState.mode = 'online';

  for (const pData of state.players) {
    const player = gameState.addPlayer(pData.name);
    canvasRenderer.createPiece(player.id, pData.colorIndex, 0, player.name);
  }

  diceUI = new DiceUI(() => {
    roomClient.getNetworkClient().send('roll_dice', {});
  });
  diceUI.hide();

  cardPopup = new CardPopup();
  forkChoice = new ForkChoice((nodeId) => {
    roomClient.getNetworkClient().send('choose_fork', { targetNodeId: nodeId });
  });

  const playerRendererAdapter = {
    pieces: new Map(),
    group: { remove() {} },
    animations: [],
    createPiece() {},
    movePiece(playerId, path, onComplete) {
      canvasRenderer.movePiece(playerId, path).then(() => {
        if (onComplete) onComplete();
      });
    },
    getPiecePosition() { return null; },
    setEliminated() {},
    update() {},
  };

  const pathRendererAdapter = {
    highlightNodes(ids) { canvasRenderer.highlightNodes(ids); },
    getNodeWorldPosition(id) { return canvasRenderer.getNodeWorldPosition(id); },
  };

  const cameraControllerAdapter = {
    focusOnPosition() {},
    focusOnNode() {},
    flyTo() {},
  };

  turnManager = new TurnManager(
    gameState,
    { playerRenderer: playerRendererAdapter, pathRenderer: pathRendererAdapter, cameraController: cameraControllerAdapter },
    { hud, diceUI, cardPopup, forkChoice, gameLog, resultScreen }
  );

  hud.init(gameState.players);
  gameState.startGame();
}

window.geoDisaster = {
  getGameState: () => gameState,
};
