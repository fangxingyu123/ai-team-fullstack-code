/**
 * 地图配置和类型定义
 * 支持多张游戏地图
 */

// 地图主题
export enum MapTheme {
  PARK = 'park',           // 公园
  MANSION = 'mansion',     // 豪宅
  HOSPITAL = 'hospital',   // 医院
  FOREST = 'forest',       // 森林
  SPACE = 'space'          // 太空
}

// 任务类型
export enum TaskType {
  SHORT = 'short',   // 短任务 (5-10 秒)
  LONG = 'long',     // 长任务 (15-30 秒)
  COMMON = 'common'  // 公共任务 (多人协作)
}

// 地图区域
export interface MapZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  taskCount: number;
  taskType?: TaskType;
}

// 任务位置
export interface TaskLocation {
  id: string;
  zoneId: string;
  x: number;
  y: number;
  name: string;
  description: string;
  type: TaskType;
  duration: number; // 秒
}

// 障碍物
export interface Obstacle {
  id: string;
  type: 'wall' | 'door' | 'decoration';
  x: number;
  y: number;
  width: number;
  height: number;
  interactable?: boolean;
}

// 破坏点
export interface SabotagePoint {
  id: string;
  name: string;
  x: number;
  y: number;
  sabotageType: 'lock_door' | 'lights' | 'comms' | 'power';
  zoneId?: string;
}

// 游戏地图配置
export interface GameMap {
  id: string;
  name: string;
  description: string;
  theme: MapTheme;
  size: { width: number; height: number };
  zones: MapZone[];
  tasks: TaskLocation[];
  obstacles: Obstacle[];
  sabotagePoints: SabotagePoint[];
  meetingPoint: { x: number; y: number };
  backgroundColor: string;
  gridColor: string;
  recommendedPlayers: { min: number; max: number };
  difficulty: 1 | 2 | 3; // 1=简单，2=中等，3=困难
}

// 所有地图配置
export const MAPS: Record<string, GameMap> = {
  map1: {
    id: 'map1',
    name: '宠物乐园',
    description: '一个阳光明媚的宠物主题公园，适合新手教学',
    theme: MapTheme.PARK,
    size: { width: 100, height: 100 },
    backgroundColor: '#4CAF50',
    gridColor: '#8BC34A',
    recommendedPlayers: { min: 4, max: 6 },
    difficulty: 1,
    meetingPoint: { x: 50, y: 40 },
    zones: [
      { id: 'zone1', name: '喂食区', x: 15, y: 20, width: 20, height: 15, taskCount: 2 },
      { id: 'zone2', name: '医疗室', x: 85, y: 20, width: 15, height: 15, taskCount: 1 },
      { id: 'zone3', name: '休息区', x: 15, y: 50, width: 15, height: 15, taskCount: 1 },
      { id: 'zone4', name: '游戏区', x: 85, y: 50, width: 15, height: 15, taskCount: 2 },
      { id: 'zone5', name: '美容室', x: 15, y: 80, width: 20, height: 15, taskCount: 2 },
      { id: 'zone6', name: '储藏室', x: 85, y: 80, width: 15, height: 15, taskCount: 2 }
    ],
    tasks: [], // 将在游戏初始化时生成
    obstacles: [
      { id: 'obs1', type: 'decoration', x: 50, y: 30, width: 10, height: 10 } // 喷泉
    ],
    sabotagePoints: [
      { id: 'sab1', name: '大门', x: 50, y: 5, sabotageType: 'lock_door' },
      { id: 'sab2', name: '路灯', x: 30, y: 10, sabotageType: 'lights' },
      { id: 'sab3', name: '广播室', x: 70, y: 10, sabotageType: 'comms' }
    ]
  },

  map2: {
    id: 'map2',
    name: '喵喵别墅',
    description: '豪华的室内豪宅，有多个房间和走廊',
    theme: MapTheme.MANSION,
    size: { width: 100, height: 100 },
    backgroundColor: '#FF9800',
    gridColor: '#D7CCC8',
    recommendedPlayers: { min: 5, max: 8 },
    difficulty: 2,
    meetingPoint: { x: 50, y: 50 },
    zones: [
      { id: 'zone1', name: '卧室 A', x: 15, y: 15, width: 20, height: 15, taskCount: 1 },
      { id: 'zone2', name: '卧室 B', x: 85, y: 15, width: 20, height: 15, taskCount: 1 },
      { id: 'zone3', name: '厨房', x: 15, y: 50, width: 20, height: 20, taskCount: 2 },
      { id: 'zone4', name: '客厅', x: 50, y: 40, width: 30, height: 20, taskCount: 0 },
      { id: 'zone5', name: '书房', x: 85, y: 50, width: 15, height: 20, taskCount: 2 },
      { id: 'zone6', name: '洗衣房', x: 15, y: 85, width: 20, height: 15, taskCount: 2 },
      { id: 'zone7', name: '餐厅', x: 50, y: 85, width: 20, height: 15, taskCount: 1 },
      { id: 'zone8', name: '车库', x: 85, y: 85, width: 15, height: 15, taskCount: 1 }
    ],
    tasks: [],
    obstacles: [
      { id: 'obs1', type: 'wall', x: 40, y: 15, width: 20, height: 5 },
      { id: 'obs2', type: 'wall', x: 40, y: 80, width: 20, height: 5 }
    ],
    sabotagePoints: [
      { id: 'sab1', name: '前门', x: 50, y: 5, sabotageType: 'lock_door' },
      { id: 'sab2', name: '电闸', x: 20, y: 30, sabotageType: 'lights' },
      { id: 'sab3', name: '路由器', x: 80, y: 30, sabotageType: 'comms' }
    ]
  },

  map3: {
    id: 'map3',
    name: '动物医院',
    description: '专业的动物医疗设施，纵向布局',
    theme: MapTheme.HOSPITAL,
    size: { width: 100, height: 120 },
    backgroundColor: '#2196F3',
    gridColor: '#E3F2FD',
    recommendedPlayers: { min: 6, max: 10 },
    difficulty: 3,
    meetingPoint: { x: 50, y: 15 },
    zones: [
      { id: 'zone1', name: '急诊室', x: 15, y: 15, width: 20, height: 15, taskCount: 2 },
      { id: 'zone2', name: '大厅', x: 50, y: 10, width: 30, height: 15, taskCount: 0 },
      { id: 'zone3', name: '药房', x: 85, y: 15, width: 15, height: 15, taskCount: 1 },
      { id: 'zone4', name: '手术室', x: 15, y: 50, width: 20, height: 15, taskCount: 2 },
      { id: 'zone5', name: '检验科', x: 50, y: 50, width: 20, height: 15, taskCount: 2 },
      { id: 'zone6', name: '住院部 A', x: 85, y: 50, width: 15, height: 15, taskCount: 1 },
      { id: 'zone7', name: 'X 光室', x: 15, y: 80, width: 15, height: 15, taskCount: 1 },
      { id: 'zone8', name: '护士站', x: 50, y: 80, width: 20, height: 15, taskCount: 1 },
      { id: 'zone9', name: '住院部 B', x: 85, y: 80, width: 15, height: 15, taskCount: 2 },
      { id: 'zone10', name: '隔离室', x: 15, y: 105, width: 20, height: 15, taskCount: 2 },
      { id: 'zone11', name: '太平间', x: 50, y: 105, width: 15, height: 15, taskCount: 1 },
      { id: 'zone12', name: '员工休息', x: 85, y: 105, width: 15, height: 15, taskCount: 1 }
    ],
    tasks: [],
    obstacles: [
      { id: 'obs1', type: 'wall', x: 5, y: 35, width: 90, height: 5 },
      { id: 'obs2', type: 'wall', x: 5, y: 70, width: 90, height: 5 }
    ],
    sabotagePoints: [
      { id: 'sab1', name: '隔离门', x: 50, y: 35, sabotageType: 'lock_door' },
      { id: 'sab2', name: '主灯', x: 50, y: 60, sabotageType: 'lights' },
      { id: 'sab3', name: '呼叫系统', x: 50, y: 90, sabotageType: 'comms' }
    ]
  },

  map4: {
    id: 'map4',
    name: '森林营地',
    description: '自然环境中的露营基地，有小溪和篝火',
    theme: MapTheme.FOREST,
    size: { width: 120, height: 100 },
    backgroundColor: '#8BC34A',
    gridColor: '#AED581',
    recommendedPlayers: { min: 5, max: 8 },
    difficulty: 2,
    meetingPoint: { x: 55, y: 25 },
    zones: [
      { id: 'zone1', name: '帐篷区 A', x: 20, y: 25, width: 20, height: 15, taskCount: 1 },
      { id: 'zone2', name: '帐篷区 B', x: 90, y: 25, width: 20, height: 15, taskCount: 1 },
      { id: 'zone3', name: '钓鱼台', x: 90, y: 50, width: 20, height: 15, taskCount: 2 },
      { id: 'zone4', name: '储物棚', x: 20, y: 50, width: 20, height: 15, taskCount: 2 },
      { id: 'zone5', name: '观景台', x: 90, y: 75, width: 20, height: 15, taskCount: 2 },
      { id: 'zone6', name: '厨房区', x: 20, y: 75, width: 20, height: 15, taskCount: 2 },
      { id: 'zone7', name: '厕所', x: 90, y: 75, width: 15, height: 15, taskCount: 1 }
    ],
    tasks: [],
    obstacles: [
      { id: 'obs1', type: 'decoration', x: 55, y: 25, width: 10, height: 10 }, // 篝火
      { id: 'obs2', type: 'wall', x: 0, y: 45, width: 40, height: 10 }, // 小溪
      { id: 'obs3', type: 'wall', x: 70, y: 45, width: 50, height: 10 } // 小溪
    ],
    sabotagePoints: [
      { id: 'sab1', name: '营地入口', x: 55, y: 5, sabotageType: 'lock_door' },
      { id: 'sab2', name: '篝火', x: 55, y: 25, sabotageType: 'lights' },
      { id: 'sab3', name: '信号塔', x: 100, y: 10, sabotageType: 'comms' }
    ]
  },

  map5: {
    id: 'map5',
    name: '太空站',
    description: '高科技太空设施，科幻主题',
    theme: MapTheme.SPACE,
    size: { width: 100, height: 100 },
    backgroundColor: '#9C27B0',
    gridColor: '#424242',
    recommendedPlayers: { min: 6, max: 10 },
    difficulty: 3,
    meetingPoint: { x: 50, y: 40 },
    zones: [
      { id: 'zone1', name: '驾驶舱', x: 15, y: 15, width: 20, height: 15, taskCount: 2 },
      { id: 'zone2', name: '通讯室', x: 85, y: 15, width: 15, height: 15, taskCount: 1 },
      { id: 'zone3', name: '引擎室 A', x: 15, y: 40, width: 20, height: 15, taskCount: 2 },
      { id: 'zone4', name: '中央核心', x: 50, y: 35, width: 30, height: 15, taskCount: 0 },
      { id: 'zone5', name: '引擎室 B', x: 85, y: 40, width: 15, height: 15, taskCount: 2 },
      { id: 'zone6', name: '生命维持', x: 15, y: 65, width: 20, height: 15, taskCount: 1 },
      { id: 'zone7', name: '实验室', x: 85, y: 65, width: 15, height: 15, taskCount: 2 },
      { id: 'zone8', name: '货舱 A', x: 15, y: 90, width: 15, height: 10, taskCount: 1 },
      { id: 'zone9', name: '气闸', x: 50, y: 90, width: 20, height: 10, taskCount: 1 },
      { id: 'zone10', name: '货舱 B', x: 85, y: 90, width: 15, height: 10, taskCount: 1 }
    ],
    tasks: [],
    obstacles: [
      { id: 'obs1', type: 'wall', x: 40, y: 30, width: 20, height: 5 },
      { id: 'obs2', type: 'wall', x: 40, y: 60, width: 20, height: 5 }
    ],
    sabotagePoints: [
      { id: 'sab1', name: '气闸门', x: 50, y: 90, sabotageType: 'lock_door' },
      { id: 'sab2', name: '主电源', x: 50, y: 50, sabotageType: 'lights' },
      { id: 'sab3', name: '通讯阵列', x: 85, y: 20, sabotageType: 'comms' }
    ]
  }
};

// 任务模板库
export const TASK_TEMPLATES: Record<TaskType, Array<{ name: string; description: string; duration: number }>> = {
  [TaskType.SHORT]: [
    { name: '喂食', description: '给所有宠物喂食', duration: 5 },
    { name: '梳理毛发', description: '梳理宠物毛发', duration: 6 },
    { name: '更换水碗', description: '更换干净的水', duration: 5 },
    { name: '整理玩具', description: '整理散落的玩具', duration: 7 },
    { name: '记录数据', description: '记录宠物行为数据', duration: 8 },
    { name: '准备零食', description: '准备训练零食', duration: 6 },
    { name: '检查设备', description: '检查设备状态', duration: 7 },
    { name: '清洁地面', description: '清扫地面', duration: 8 }
  ],
  [TaskType.LONG]: [
    { name: '清理猫砂盆', description: '清理所有猫砂盆', duration: 15 },
    { name: '健康检查', description: '全面健康检查', duration: 20 },
    { name: '打扫房间', description: '深度清洁房间', duration: 18 },
    { name: '消毒用品', description: '消毒所有用品', duration: 15 },
    { name: '维修设备', description: '维修故障设备', duration: 20 },
    { name: '准备手术', description: '准备手术器械', duration: 25 },
    { name: '填写病历', description: '填写完整病历', duration: 15 }
  ],
  [TaskType.COMMON]: [
    { name: '搬运重物', description: '需要 2 人协作搬运', duration: 10 },
    { name: '启动装置', description: '需要 3 人同时操作', duration: 15 },
    { name: '开启大门', description: '需要 2 人同时按下按钮', duration: 8 }
  ]
};

// 获取地图配置
export function getMap(mapId: string): GameMap | null {
  return MAPS[mapId] || null;
}

// 获取所有地图列表
export function getAllMaps(): Array<{ id: string; name: string; description: string; difficulty: number; recommendedPlayers: { min: number; max: number } }> {
  return Object.values(MAPS).map(map => ({
    id: map.id,
    name: map.name,
    description: map.description,
    difficulty: map.difficulty,
    recommendedPlayers: map.recommendedPlayers
  }));
}

// 根据玩家数推荐地图
export function recommendMap(playerCount: number): string {
  if (playerCount <= 5) return 'map1'; // 宠物乐园
  if (playerCount <= 7) return 'map2'; // 喵喵别墅或森林营地
  return 'map3'; // 动物医院或太空站
}

// 生成地图任务
export function generateMapTasks(mapId: string, taskCount: number): TaskLocation[] {
  const map = MAPS[mapId];
  if (!map) return [];

  const tasks: TaskLocation[] = [];
  const zonesWithTasks = map.zones.filter(z => z.taskCount > 0);

  let taskId = 0;
  while (tasks.length < taskCount && taskId < 1000) {
    // 随机选择一个区域
    const zone = zonesWithTasks[Math.floor(Math.random() * zonesWithTasks.length)];
    
    // 随机选择任务类型
    const taskType = Math.random() < 0.7 ? TaskType.SHORT : TaskType.LONG;
    const templates = TASK_TEMPLATES[taskType];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // 生成任务位置 (在区域内随机)
    const taskX = zone.x + Math.random() * (zone.width - 10);
    const taskY = zone.y + Math.random() * (zone.height - 10);

    tasks.push({
      id: `task-${taskId}`,
      zoneId: zone.id,
      x: taskX,
      y: taskY,
      name: template.name,
      description: template.description,
      type: taskType,
      duration: template.duration
    });

    taskId++;
  }

  return tasks;
}
