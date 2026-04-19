import { SceneManager } from './render/scene-manager.js';
import { TerrainGenerator } from './render/terrain-gen.js';
import { MapRenderer } from './render/map-renderer.js';
import { CameraController } from './render/camera-controller.js';
import { PathRenderer } from './render/path-renderer.js';
import { PlayerRenderer } from './render/player-renderer.js';
import { DecorationRenderer } from './render/decoration-renderer.js';
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

let sceneManager, terrainGen, mapRenderer, cameraController;
let pathRenderer, playerRenderer, decorationRenderer;
let gameState, turnManager;
let menu, hud, diceUI, cardPopup, forkChoice, gameLog, resultScreen, lobby;

export function init() {
  const canvas = document.getElementById('game-canvas');

  // 渲染层初始化
  sceneManager = new SceneManager(canvas);
  terrainGen = new TerrainGenerator(42);

  mapRenderer = new MapRenderer(sceneManager.scene, terrainGen);
  mapRenderer.generate();

  pathRenderer = new PathRenderer(sceneManager.scene, terrainGen, mapNodes);
  pathRenderer.generate();

  decorationRenderer = new DecorationRenderer(sceneManager.scene, terrainGen);
  decorationRenderer.generate();

  playerRenderer = new PlayerRenderer(sceneManager.scene, terrainGen, mapNodes);
  cameraController = new CameraController(sceneManager.camera, canvas);

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
  const startTime = performance.now();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (performance.now() - startTime) / 1000;
    mapRenderer.update(elapsed);
    playerRenderer.update(elapsed);
    sceneManager.render();
  }
  animate();
}

function startLocalGame(playerDataList) {
  gameState = new GameState();
  gameState.mode = 'local';

  for (const pd of playerDataList) {
    gameState.addPlayer(pd.name, pd.isAI);
  }

  for (const player of gameState.players) {
    playerRenderer.createPiece(player.id, player.colorIndex, 0);
  }

  diceUI = new DiceUI(() => turnManager.handleRoll());
  diceUI.hide();

  cardPopup = new CardPopup();
  forkChoice = new ForkChoice((nodeId) => turnManager.handleForkChoice(nodeId));

  turnManager = new TurnManager(
    gameState,
    { playerRenderer, pathRenderer, cameraController },
    { hud, diceUI, cardPopup, forkChoice, gameLog, resultScreen }
  );

  hud.init(gameState.players);
  gameState.startGame();
}

function resetGame() {
  if (playerRenderer) {
    for (const [, piece] of playerRenderer.pieces) {
      playerRenderer.group.remove(piece.group);
    }
    playerRenderer.pieces.clear();
    playerRenderer.animations = [];
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
    playerRenderer.createPiece(player.id, pData.colorIndex, 0);
  }

  diceUI = new DiceUI(() => {
    roomClient.getNetworkClient().send('roll_dice', {});
  });
  diceUI.hide();

  cardPopup = new CardPopup();
  forkChoice = new ForkChoice((nodeId) => {
    roomClient.getNetworkClient().send('choose_fork', { targetNodeId: nodeId });
  });

  turnManager = new TurnManager(
    gameState,
    { playerRenderer, pathRenderer, cameraController },
    { hud, diceUI, cardPopup, forkChoice, gameLog, resultScreen }
  );

  hud.init(gameState.players);
  gameState.startGame();
}

window.geoDisaster = {
  getGameState: () => gameState,
  getSceneManager: () => sceneManager,
};
