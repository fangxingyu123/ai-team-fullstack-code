// Map definitions for Cat Dog Kill game

export interface MapZone {
  id: string;
  name: string;
  type: 'spawn' | 'task' | 'meeting' | 'vent' | 'common';
  position: { x: number; y: number };
  size: { width: number; height: number };
  description?: string;
}

export interface MapTaskLocation {
  taskId: string;
  zoneId: string;
  position: { x: number; y: number };
}

export interface MapVent {
  id: string;
  position: { x: number; y: number };
  connections: string[]; // Connected vent IDs
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  size: { width: number; height: number };
  zones: MapZone[];
  taskLocations: MapTaskLocation[];
  vents: MapVent[];
  spawnPoints: { x: number; y: number }[];
  meetingPoint: { x: number; y: number };
  obstacles: { x: number; y: number; width: number; height: number }[];
}

// Map templates
export const MAPS: Record<string, GameMap> = {
  'map1': {
    id: 'map1',
    name: '🏠 温馨小屋',
    description: '基础地图 - 适合新手教学',
    size: { width: 100, height: 100 },
    zones: [
      { id: 'living_room', name: '客厅', type: 'common', position: { x: 50, y: 50 }, size: { width: 30, height: 30 } },
      { id: 'kitchen', name: '厨房', type: 'task', position: { x: 20, y: 30 }, size: { width: 20, height: 20 } },
      { id: 'bedroom', name: '卧室', type: 'task', position: { x: 80, y: 30 }, size: { width: 20, height: 20 } },
      { id: 'bathroom', name: '浴室', type: 'task', position: { x: 20, y: 70 }, size: { width: 15, height: 15 } },
      { id: 'garden', name: '花园', type: 'task', position: { x: 80, y: 70 }, size: { width: 20, height: 20 } },
      { id: 'meeting_point', name: '会议桌', type: 'meeting', position: { x: 50, y: 50 }, size: { width: 10, height: 10 } },
      { id: 'spawn_1', name: '出生点 1', type: 'spawn', position: { x: 30, y: 50 }, size: { width: 5, height: 5 } },
      { id: 'spawn_2', name: '出生点 2', type: 'spawn', position: { x: 70, y: 50 }, size: { width: 5, height: 5 } },
    ],
    taskLocations: [
      { taskId: 'feed_pets', zoneId: 'kitchen', position: { x: 25, y: 35 } },
      { taskId: 'clean_litter', zoneId: 'bathroom', position: { x: 25, y: 75 } },
      { taskId: 'groom_pets', zoneId: 'bedroom', position: { x: 85, y: 35 } },
      { taskId: 'water_plants', zoneId: 'garden', position: { x: 85, y: 75 } },
      { taskId: 'clean_floor', zoneId: 'living_room', position: { x: 50, y: 60 } },
    ],
    vents: [],
    spawnPoints: [
      { x: 30, y: 50 },
      { x: 70, y: 50 },
      { x: 50, y: 30 },
      { x: 50, y: 70 },
    ],
    meetingPoint: { x: 50, y: 50 },
    obstacles: [
      { x: 40, y: 40, width: 20, height: 20 }, // Central furniture
    ]
  },
  
  'map2': {
    id: 'map2',
    name: '🏢 宠物医院',
    description: '中型地图 - 多个房间和走廊',
    size: { width: 120, height: 100 },
    zones: [
      { id: 'reception', name: '接待处', type: 'common', position: { x: 60, y: 50 }, size: { width: 25, height: 20 } },
      { id: 'exam_room_1', name: '诊室 1', type: 'task', position: { x: 20, y: 30 }, size: { width: 20, height: 20 } },
      { id: 'exam_room_2', name: '诊室 2', type: 'task', position: { x: 100, y: 30 }, size: { width: 20, height: 20 } },
      { id: 'surgery', name: '手术室', type: 'task', position: { x: 60, y: 20 }, size: { width: 20, height: 15 } },
      { id: 'pharmacy', name: '药房', type: 'task', position: { x: 20, y: 70 }, size: { width: 15, height: 15 } },
      { id: 'ward', name: '住院部', type: 'task', position: { x: 100, y: 70 }, size: { width: 20, height: 20 } },
      { id: 'meeting_room', name: '会议室', type: 'meeting', position: { x: 60, y: 50 }, size: { width: 12, height: 10 } },
      { id: 'spawn_1', name: '入口', type: 'spawn', position: { x: 60, y: 80 }, size: { width: 5, height: 5 } },
      { id: 'spawn_2', name: '后门', type: 'spawn', position: { x: 60, y: 20 }, size: { width: 5, height: 5 } },
    ],
    taskLocations: [
      { taskId: 'organize_meds', zoneId: 'pharmacy', position: { x: 25, y: 75 } },
      { taskId: 'clean_cages', zoneId: 'ward', position: { x: 105, y: 75 } },
      { taskId: 'sterilize_tools', zoneId: 'surgery', position: { x: 65, y: 25 } },
      { taskId: 'check_patients', zoneId: 'exam_room_1', position: { x: 25, y: 35 } },
      { taskId: 'update_records', zoneId: 'reception', position: { x: 60, y: 55 } },
      { taskId: 'feed_animals', zoneId: 'ward', position: { x: 110, y: 80 } },
    ],
    vents: [
      { id: 'vent_1', position: { x: 40, y: 50 }, connections: ['vent_2'] },
      { id: 'vent_2', position: { x: 80, y: 50 }, connections: ['vent_1', 'vent_3'] },
      { id: 'vent_3', position: { x: 60, y: 40 }, connections: ['vent_2'] },
    ],
    spawnPoints: [
      { x: 60, y: 80 },
      { x: 60, y: 20 },
      { x: 20, y: 50 },
      { x: 100, y: 50 },
    ],
    meetingPoint: { x: 60, y: 50 },
    obstacles: [
      { x: 45, y: 45, width: 30, height: 10 }, // Reception desk
      { x: 55, y: 35, width: 10, height: 10 }, // Pillar
    ]
  },
  
  'map3': {
    id: 'map3',
    name: '🏰 猫咪城堡',
    description: '大型地图 - 多层结构，复杂路线',
    size: { width: 150, height: 120 },
    zones: [
      { id: 'throne_room', name: '王座厅', type: 'common', position: { x: 75, y: 60 }, size: { width: 30, height: 25 } },
      { id: 'kitchen', name: '御膳房', type: 'task', position: { x: 30, y: 40 }, size: { width: 25, height: 20 } },
      { id: 'library', name: '图书馆', type: 'task', position: { x: 120, y: 40 }, size: { width: 25, height: 20 } },
      { id: 'treasury', name: '宝库', type: 'task', position: { x: 30, y: 80 }, size: { width: 20, height: 20 } },
      { id: 'garden', name: '空中花园', type: 'task', position: { x: 120, y: 80 }, size: { width: 25, height: 25 } },
      { id: 'tower', name: '瞭望塔', type: 'task', position: { x: 75, y: 20 }, size: { width: 15, height: 15 } },
      { id: 'dungeon', name: '地牢', type: 'task', position: { x: 75, y: 100 }, size: { width: 20, height: 15 } },
      { id: 'council_chamber', name: '议事厅', type: 'meeting', position: { x: 75, y: 60 }, size: { width: 15, height: 12 } },
      { id: 'spawn_1', name: '正门', type: 'spawn', position: { x: 75, y: 110 }, size: { width: 5, height: 5 } },
      { id: 'spawn_2', name: '侧门', type: 'spawn', position: { x: 20, y: 60 }, size: { width: 5, height: 5 } },
      { id: 'spawn_3', name: '密道', type: 'spawn', position: { x: 130, y: 60 }, size: { width: 5, height: 5 } },
    ],
    taskLocations: [
      { taskId: 'polish_crown', zoneId: 'throne_room', position: { x: 75, y: 65 } },
      { taskId: 'cook_feast', zoneId: 'kitchen', position: { x: 35, y: 45 } },
      { taskId: 'organize_books', zoneId: 'library', position: { x: 125, y: 45 } },
      { taskId: 'count_treasure', zoneId: 'treasury', position: { x: 35, y: 85 } },
      { taskId: 'trim_hedges', zoneId: 'garden', position: { x: 125, y: 85 } },
      { taskId: 'light_torches', zoneId: 'tower', position: { x: 75, y: 25 } },
      { taskId: 'clean_cells', zoneId: 'dungeon', position: { x: 75, y: 105 } },
      { taskId: 'hang_tapestries', zoneId: 'throne_room', position: { x: 65, y: 55 } },
    ],
    vents: [
      { id: 'vent_1', position: { x: 50, y: 60 }, connections: ['vent_2', 'vent_4'] },
      { id: 'vent_2', position: { x: 100, y: 60 }, connections: ['vent_1', 'vent_3'] },
      { id: 'vent_3', position: { x: 75, y: 40 }, connections: ['vent_2', 'vent_5'] },
      { id: 'vent_4', position: { x: 50, y: 80 }, connections: ['vent_1', 'vent_5'] },
      { id: 'vent_5', position: { x: 100, y: 80 }, connections: ['vent_3', 'vent_4'] },
    ],
    spawnPoints: [
      { x: 75, y: 110 },
      { x: 20, y: 60 },
      { x: 130, y: 60 },
      { x: 75, y: 20 },
      { x: 30, y: 40 },
      { x: 120, y: 40 },
    ],
    meetingPoint: { x: 75, y: 60 },
    obstacles: [
      { x: 65, y: 55, width: 20, height: 10 }, // Throne
      { x: 40, y: 50, width: 10, height: 20 }, // Pillar
      { x: 100, y: 50, width: 10, height: 20 }, // Pillar
      { x: 65, y: 35, width: 20, height: 10 }, // Balcony
    ]
  },
  
  'map4': {
    id: 'map4',
    name: '🚀 太空站',
    description: '科幻地图 - 密闭空间，紧张刺激',
    size: { width: 140, height: 100 },
    zones: [
      { id: 'bridge', name: '舰桥', type: 'common', position: { x: 70, y: 50 }, size: { width: 25, height: 20 } },
      { id: 'engine_room', name: '引擎室', type: 'task', position: { x: 30, y: 50 }, size: { width: 20, height: 25 } },
      { id: 'lab', name: '实验室', type: 'task', position: { x: 110, y: 50 }, size: { width: 25, height: 20 } },
      { id: 'cargo', name: '货舱', type: 'task', position: { x: 70, y: 25 }, size: { width: 20, height: 20 } },
      { id: 'medbay', name: '医疗湾', type: 'task', position: { x: 30, y: 25 }, size: { width: 15, height: 15 } },
      { id: 'comms', name: '通讯室', type: 'task', position: { x: 110, y: 25 }, size: { width: 15, height: 15 } },
      { id: 'reactor', name: '反应堆', type: 'task', position: { x: 70, y: 75 }, size: { width: 20, height: 20 } },
      { id: 'airlock', name: '气闸舱', type: 'task', position: { x: 20, y: 75 }, size: { width: 15, height: 15 } },
      { id: 'conference', name: '会议室', type: 'meeting', position: { x: 70, y: 50 }, size: { width: 12, height: 10 } },
      { id: 'spawn_1', name: ' docking 口', type: 'spawn', position: { x: 70, y: 90 }, size: { width: 5, height: 5 } },
    ],
    taskLocations: [
      { taskId: 'fix_engine', zoneId: 'engine_room', position: { x: 35, y: 55 } },
      { taskId: 'analyze_samples', zoneId: 'lab', position: { x: 115, y: 55 } },
      { taskId: 'organize_cargo', zoneId: 'cargo', position: { x: 75, y: 30 } },
      { taskId: 'treat_patients', zoneId: 'medbay', position: { x: 35, y: 30 } },
      { taskId: 'repair_antenna', zoneId: 'comms', position: { x: 115, y: 30 } },
      { taskId: 'calibrate_reactor', zoneId: 'reactor', position: { x: 75, y: 80 } },
      { taskId: 'seal_airlock', zoneId: 'airlock', position: { x: 25, y: 80 } },
      { taskId: 'navigate', zoneId: 'bridge', position: { x: 75, y: 55 } },
    ],
    vents: [
      { id: 'vent_1', position: { x: 50, y: 40 }, connections: ['vent_2', 'vent_3'] },
      { id: 'vent_2', position: { x: 90, y: 40 }, connections: ['vent_1', 'vent_4'] },
      { id: 'vent_3', position: { x: 50, y: 60 }, connections: ['vent_1', 'vent_5'] },
      { id: 'vent_4', position: { x: 90, y: 60 }, connections: ['vent_2', 'vent_5'] },
      { id: 'vent_5', position: { x: 70, y: 70 }, connections: ['vent_3', 'vent_4'] },
    ],
    spawnPoints: [
      { x: 70, y: 90 },
      { x: 30, y: 50 },
      { x: 110, y: 50 },
      { x: 70, y: 25 },
    ],
    meetingPoint: { x: 70, y: 50 },
    obstacles: [
      { x: 60, y: 45, width: 20, height: 10 }, // Command console
      { x: 55, y: 60, width: 10, height: 15 }, // Support beam
      { x: 75, y: 60, width: 10, height: 15 }, // Support beam
    ]
  },
  
  'map5': {
    id: 'map5',
    name: '🎪 游乐园',
    description: '欢乐地图 - 开阔场地，多隐藏点',
    size: { width: 160, height: 120 },
    zones: [
      { id: 'entrance', name: '入口广场', type: 'common', position: { x: 80, y: 100 }, size: { width: 30, height: 20 } },
      { id: 'roller_coaster', name: '过山车', type: 'task', position: { x: 40, y: 40 }, size: { width: 30, height: 30 } },
      { id: 'carousel', name: '旋转木马', type: 'task', position: { x: 120, y: 40 }, size: { width: 25, height: 25 } },
      { id: 'food_court', name: '美食街', type: 'task', position: { x: 40, y: 80 }, size: { width: 25, height: 20 } },
      { id: 'arcade', name: '游戏厅', type: 'task', position: { x: 120, y: 80 }, size: { width: 25, height: 20 } },
      { id: 'haunted_house', name: '鬼屋', type: 'task', position: { x: 80, y: 30 }, size: { width: 20, height: 20 } },
      { id: 'ferris_wheel', name: '摩天轮', type: 'task', position: { x: 80, y: 60 }, size: { width: 20, height: 20 } },
      { id: 'stage', name: '表演舞台', type: 'meeting', position: { x: 80, y: 100 }, size: { width: 20, height: 15 } },
      { id: 'spawn_1', name: '北门', type: 'spawn', position: { x: 80, y: 10 }, size: { width: 5, height: 5 } },
      { id: 'spawn_2', name: '东门', type: 'spawn', position: { x: 150, y: 60 }, size: { width: 5, height: 5 } },
      { id: 'spawn_3', name: '西门', type: 'spawn', position: { x: 10, y: 60 }, size: { width: 5, height: 5 } },
    ],
    taskLocations: [
      { taskId: 'check_coaster', zoneId: 'roller_coaster', position: { x: 45, y: 45 } },
      { taskId: 'clean_horses', zoneId: 'carousel', position: { x: 125, y: 45 } },
      { taskId: 'prepare_food', zoneId: 'food_court', position: { x: 45, y: 85 } },
      { taskId: 'fix_machines', zoneId: 'arcade', position: { x: 125, y: 85 } },
      { taskId: 'clean_ghosts', zoneId: 'haunted_house', position: { x: 85, y: 35 } },
      { taskId: 'inspect_wheel', zoneId: 'ferris_wheel', position: { x: 85, y: 65 } },
      { taskId: 'decorate_park', zoneId: 'entrance', position: { x: 85, y: 105 } },
      { taskId: 'test_games', zoneId: 'arcade', position: { x: 135, y: 90 } },
    ],
    vents: [
      { id: 'vent_1', position: { x: 60, y: 50 }, connections: ['vent_2'] },
      { id: 'vent_2', position: { x: 100, y: 50 }, connections: ['vent_1', 'vent_3'] },
      { id: 'vent_3', position: { x: 80, y: 70 }, connections: ['vent_2', 'vent_4'] },
      { id: 'vent_4', position: { x: 60, y: 90 }, connections: ['vent_3'] },
    ],
    spawnPoints: [
      { x: 80, y: 10 },
      { x: 150, y: 60 },
      { x: 10, y: 60 },
      { x: 40, y: 40 },
      { x: 120, y: 40 },
      { x: 80, y: 30 },
    ],
    meetingPoint: { x: 80, y: 100 },
    obstacles: [
      { x: 35, y: 35, width: 10, height: 10 }, // Coaster support
      { x: 115, y: 35, width: 10, height: 10 }, // Carousel center
      { x: 75, y: 25, width: 10, height: 10 }, // Haunted house entrance
      { x: 75, y: 55, width: 10, height: 10 }, // Ferris wheel base
    ]
  }
};

// Helper function to get map by ID
export function getMap(mapId: string): GameMap | null {
  return MAPS[mapId] || null;
}

// Helper function to get all available maps
export function getAvailableMaps(): Array<{ id: string; name: string; description: string }> {
  return Object.values(MAPS).map(map => ({
    id: map.id,
    name: map.name,
    description: map.description
  }));
}
