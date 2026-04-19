import { NetworkClient } from './client.js';

/**
 * 房间管理客户端
 * 封装创建/加入/离开房间的高层接口
 */
export class RoomClient {
  constructor() {
    this.network = new NetworkClient();
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGameStarted = null;
    this.onError = null;
    this.isHost = false;
  }

  async connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}`;
    await this.network.connect(url);

    this.network.on('room_created', (msg) => {
      this.isHost = true;
      this.onRoomCreated?.(msg);
    });

    this.network.on('room_joined', (msg) => {
      this.onRoomJoined?.(msg);
    });

    this.network.on('player_joined', (msg) => {
      this.onPlayerJoined?.(msg);
    });

    this.network.on('player_left', (msg) => {
      this.onPlayerLeft?.(msg);
    });

    this.network.on('game_started', (msg) => {
      this.onGameStarted?.(msg);
    });

    this.network.on('error', (msg) => {
      this.onError?.(msg.message);
    });
  }

  createRoom(name) {
    this.network.send('create_room', { name });
  }

  joinRoom(roomCode, name) {
    this.network.send('join_room', { roomCode: roomCode.toUpperCase(), name });
  }

  startGame() {
    if (this.isHost) {
      this.network.send('start_game');
    }
  }

  leaveRoom() {
    this.network.send('leave_room');
    this.network.disconnect();
  }

  /**
   * 获取底层 network client（用于游戏中消息收发）
   */
  getNetworkClient() {
    return this.network;
  }
}
