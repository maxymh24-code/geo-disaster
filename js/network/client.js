/**
 * WebSocket 客户端
 */
export class NetworkClient {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.roomCode = null;
    this.handlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connected = false;
  }

  /**
   * 连接到服务器
   */
  connect(url) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(err);
      };

      this.ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        this._handleMessage(msg);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this._tryReconnect(url);
      };
    });
  }

  /**
   * 发送消息
   */
  send(type, data = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, ...data }));
  }

  /**
   * 注册消息处理器
   */
  on(type, handler) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(handler);
  }

  off(type, handler) {
    if (!this.handlers[type]) return;
    this.handlers[type] = this.handlers[type].filter(h => h !== handler);
  }

  _handleMessage(msg) {
    const handlers = this.handlers[msg.type];
    if (handlers) {
      for (const h of handlers) h(msg);
    }

    // 存储身份信息
    if (msg.type === 'room_created' || msg.type === 'room_joined') {
      this.playerId = msg.playerId;
      this.roomCode = msg.roomCode;
    }
  }

  _tryReconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    if (!this.roomCode) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    setTimeout(() => {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        this.ws = ws;
        this.connected = true;
        this.reconnectAttempts = 0;
        // 发送重连消息
        this.send('reconnect', {
          roomCode: this.roomCode,
          playerId: this.playerId,
        });
        ws.onmessage = this.ws.onmessage;
        ws.onclose = () => {
          this.connected = false;
          this._tryReconnect(url);
        };
      };
      ws.onerror = () => {
        this._tryReconnect(url);
      };
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}
