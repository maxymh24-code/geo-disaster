/**
 * 网络消息协议定义
 * 客户端和服务端共用
 */

// 客户端 → 服务端
export const CLIENT_MSG = {
  CREATE_ROOM:  'create_room',
  JOIN_ROOM:    'join_room',
  LEAVE_ROOM:   'leave_room',
  START_GAME:   'start_game',
  ROLL_DICE:    'roll_dice',
  CHOOSE_FORK:  'choose_fork',
  RECONNECT:    'reconnect',
};

// 服务端 → 客户端
export const SERVER_MSG = {
  ROOM_CREATED:   'room_created',
  ROOM_JOINED:    'room_joined',
  ROOM_LEFT:      'room_left',
  PLAYER_JOINED:  'player_joined',
  PLAYER_LEFT:    'player_left',
  GAME_STARTED:   'game_started',
  TURN_START:     'turn_start',
  DICE_RESULT:    'dice_result',
  PLAYER_MOVED:   'player_moved',
  FORK_CHOICE:    'fork_choice',
  CARD_DRAWN:     'card_drawn',
  FIXED_DISASTER: 'fixed_disaster',
  SAFE_NODE:      'safe_node',
  PLAYER_ELIMINATED: 'player_eliminated',
  GAME_ENDED:     'game_ended',
  STATE_SYNC:     'state_sync',
  ERROR:          'error',
  LOG:            'log',
};

/**
 * 创建消息
 */
export function createMessage(type, data = {}) {
  return JSON.stringify({ type, ...data });
}

/**
 * 解析消息
 */
export function parseMessage(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 生成随机房间码
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
