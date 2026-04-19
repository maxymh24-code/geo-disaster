import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// MIME 类型
const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// === HTTP 静态文件服务 ===
const httpServer = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // 安全检查
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// === WebSocket 房间管理 ===
const wss = new WebSocketServer({ server: httpServer });

// 房间存储
const rooms = new Map();  // roomCode -> Room

class Room {
  constructor(code, hostWs) {
    this.code = code;
    this.host = hostWs;
    this.clients = new Map();  // playerId -> { ws, name, ready }
    this.gameState = null;
    this.playerIdCounter = 0;
    this.started = false;
  }

  addPlayer(ws, name) {
    const id = `p${this.playerIdCounter++}`;
    this.clients.set(id, { ws, name, ready: false });
    ws._playerId = id;
    ws._roomCode = this.code;
    return id;
  }

  removePlayer(playerId) {
    this.clients.delete(playerId);
  }

  broadcast(msg, excludeId = null) {
    for (const [id, client] of this.clients) {
      if (id !== excludeId && client.ws.readyState === 1) {
        client.ws.send(msg);
      }
    }
  }

  getPlayerList() {
    const list = [];
    for (const [id, client] of this.clients) {
      list.push({ id, name: client.name });
    }
    return list;
  }
}

// 简化的服务端游戏引擎
// （真正的实现应该复用 engine/ 中的代码，此处简化）
class ServerGame {
  constructor(room) {
    this.room = room;
    this.players = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.roundNumber = 1;
    this.phase = 'playing';
  }

  init(playerList) {
    this.players = playerList.map((p, i) => ({
      id: p.id, name: p.name, colorIndex: i,
      hp: 100, maxHp: 100, currentNodeId: 0,
      isAlive: true, statusEffects: [],
    }));

    this.turnOrder = this.players.map(p => p.id);
    // 随机化顺序
    for (let i = this.turnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.turnOrder[i], this.turnOrder[j]] = [this.turnOrder[j], this.turnOrder[i]];
    }

    this.currentTurnIndex = 0;
  }

  getCurrentPlayerId() {
    return this.turnOrder[this.currentTurnIndex];
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  getPlayer(id) {
    return this.players.find(p => p.id === id);
  }

  nextTurn() {
    let tries = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
      tries++;
      if (this.currentTurnIndex === 0) {
        this.roundNumber++;
      }
    } while (!this.getPlayer(this.getCurrentPlayerId()).isAlive && tries < this.turnOrder.length);

    // 检查结束
    const alive = this.players.filter(p => p.isAlive);
    if (alive.length <= 1 || this.roundNumber > 30) {
      this.phase = 'ended';
    }
  }

  getState() {
    return {
      players: this.players,
      turnOrder: this.turnOrder,
      currentTurnIndex: this.currentTurnIndex,
      roundNumber: this.roundNumber,
      phase: this.phase,
    };
  }
}

// === WebSocket 消息处理 ===
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'create_room': {
        // 生成唯一房间码
        let code;
        do {
          code = randomRoomCode();
        } while (rooms.has(code));

        const room = new Room(code, ws);
        const playerId = room.addPlayer(ws, msg.name || '房主');
        rooms.set(code, room);

        ws.send(JSON.stringify({
          type: 'room_created',
          roomCode: code,
          playerId,
          players: room.getPlayerList(),
        }));

        console.log(`Room ${code} created by ${msg.name}`);
        break;
      }

      case 'join_room': {
        const room = rooms.get(msg.roomCode);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }
        if (room.started) {
          ws.send(JSON.stringify({ type: 'error', message: '游戏已开始' }));
          return;
        }
        if (room.clients.size >= 6) {
          ws.send(JSON.stringify({ type: 'error', message: '房间已满' }));
          return;
        }

        const playerId = room.addPlayer(ws, msg.name || '玩家');

        ws.send(JSON.stringify({
          type: 'room_joined',
          roomCode: msg.roomCode,
          playerId,
          players: room.getPlayerList(),
        }));

        room.broadcast(JSON.stringify({
          type: 'player_joined',
          playerId,
          name: msg.name,
          players: room.getPlayerList(),
        }), playerId);

        console.log(`${msg.name} joined room ${msg.roomCode}`);
        break;
      }

      case 'start_game': {
        const room = rooms.get(ws._roomCode);
        if (!room || ws !== room.host) return;
        if (room.clients.size < 2) {
          ws.send(JSON.stringify({ type: 'error', message: '至少需要2人' }));
          return;
        }

        room.started = true;
        const game = new ServerGame(room);
        game.init(room.getPlayerList());
        room.gameState = game;

        room.broadcast(JSON.stringify({
          type: 'game_started',
          state: game.getState(),
        }));
        break;
      }

      case 'roll_dice': {
        const room = rooms.get(ws._roomCode);
        if (!room || !room.gameState) return;
        const game = room.gameState;

        if (game.getCurrentPlayerId() !== ws._playerId) return;

        const result = game.rollDice();
        room.broadcast(JSON.stringify({
          type: 'dice_result',
          playerId: ws._playerId,
          result,
        }));
        break;
      }

      case 'choose_fork': {
        const room = rooms.get(ws._roomCode);
        if (!room || !room.gameState) return;

        room.broadcast(JSON.stringify({
          type: 'fork_chosen',
          playerId: ws._playerId,
          targetNodeId: msg.targetNodeId,
        }));
        break;
      }

      case 'reconnect': {
        const room = rooms.get(msg.roomCode);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }

        const client = room.clients.get(msg.playerId);
        if (client) {
          client.ws = ws;
          ws._playerId = msg.playerId;
          ws._roomCode = msg.roomCode;

          ws.send(JSON.stringify({
            type: 'state_sync',
            state: room.gameState?.getState(),
            players: room.getPlayerList(),
          }));
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    const roomCode = ws._roomCode;
    const playerId = ws._playerId;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    room.broadcast(JSON.stringify({
      type: 'player_left',
      playerId,
    }), playerId);

    room.removePlayer(playerId);

    // 房间空了则删除
    if (room.clients.size === 0) {
      rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted (empty)`);
    }

    console.log(`Player ${playerId} left room ${roomCode}`);
  });
});

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

httpServer.listen(PORT, () => {
  console.log(`Geo-Disaster server running at http://localhost:${PORT}`);
});
