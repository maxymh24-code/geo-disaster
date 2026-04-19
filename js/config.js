// 全局配置常量

export const GAME_CONFIG = {
  maxPlayers: 6,
  minPlayers: 2,
  defaultHp: 50,
  maxRounds: 30,
  diceMin: 1,
  diceMax: 6,
};

export const MAP_CONFIG = {
  // 地形网格
  terrainSize: 200,        // 地形边长
  terrainSegments: 256,    // 细分段数
  heightScale: 30,         // 高度缩放
  seaLevel: 0.3,           // 海平面高度比例

  // 噪声参数
  noise: {
    continentScale: 0.008,   // 大陆形状
    detailScale: 0.03,       // 细节
    mountainScale: 0.015,    // 山脉
    ridgeScale: 0.02,        // 山脊
  },

  // 地形颜色 (写实风格)
  colors: {
    deepWater:   [0.05, 0.15, 0.40],
    shallowWater:[0.10, 0.30, 0.55],
    sand:        [0.76, 0.70, 0.50],
    grass:       [0.30, 0.50, 0.15],
    forest:      [0.15, 0.35, 0.10],
    rock:        [0.45, 0.42, 0.38],
    snow:        [0.90, 0.92, 0.95],
    volcanic:    [0.25, 0.12, 0.08],
    lava:        [0.85, 0.20, 0.05],
  },

  // 节点标记大小
  nodeMarkerRadius: 0.8,
  nodeMarkerHeight: 0.5,
  pathWidth: 0.4,
};

export const RENDER_CONFIG = {
  shadowMapSize: 2048,
  fogNear: 80,
  fogFar: 250,
  ambientIntensity: 0.4,
  sunIntensity: 1.2,
  sunPosition: [60, 80, 40],
};

export const CAMERA_CONFIG = {
  fov: 50,
  near: 0.1,
  far: 500,
  initialDistance: 120,
  minDistance: 30,
  maxDistance: 250,
  initialPolarAngle: Math.PI / 4,    // 45度俯视
  minPolarAngle: 0.1,
  maxPolarAngle: Math.PI / 2.2,
  panSpeed: 0.3,
  rotateSpeed: 0.005,
  zoomSpeed: 0.1,
  lookAt: [0, 0, 0],
};

// 灾害类型枚举
export const DISASTER_TYPES = {
  EARTHQUAKE: 'earthquake',
  VOLCANO: 'volcano',
  TSUNAMI: 'tsunami',
  BLIZZARD: 'blizzard',
  LANDSLIDE: 'landslide',
  SINKHOLE: 'sinkhole',
  WILDFIRE: 'wildfire',
  FLOOD: 'flood',
};

// 地形类型枚举
export const TERRAIN_TYPES = {
  OCEAN: 'ocean',
  VOLCANO: 'volcano',
  GLACIER: 'glacier',
  PLATEAU: 'plateau',
  FOREST: 'forest',
  DESERT: 'desert',
  PLAINS: 'plains',
};

// 节点类型枚举
export const NODE_TYPES = {
  NORMAL: 'normal',
  DISASTER_FIXED: 'disaster_fixed',
  DISASTER_RANDOM: 'disaster_random',
  SAFE: 'safe',
  START: 'start',
};
