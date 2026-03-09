// Player roles in the game
export enum Role {
  CAT = 'cat',          // Good guy - completes tasks
  DOG = 'dog',          // Bad guy - sabotages
  FOX = 'fox',          // Neutral - survives to end
  DETECTIVE = 'detective',  // Good guy - can investigate roles
  HUNTER = 'hunter'     // Good guy - can eliminate one player when dying
}

// Role abilities and configuration
export interface RoleConfig {
  name: string;
  description: string;
  team: 'good' | 'bad' | 'neutral';
  icon: string;
  color: string;
  hasSpecialAbility: boolean;
  abilityDescription?: string;
}

// Role configurations
export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  [Role.CAT]: {
    name: '猫咪',
    description: '完成任务，找出卧底',
    team: 'good',
    icon: '🐱',
    color: '#4A90E2',
    hasSpecialAbility: false
  },
  [Role.DOG]: {
    name: '狗狗',
    description: '搞破坏，淘汰猫咪',
    team: 'bad',
    icon: '🐶',
    color: '#E74C3C',
    hasSpecialAbility: true,
    abilityDescription: '可以发动破坏'
  },
  [Role.FOX]: {
    name: '狐狸',
    description: '存活到最后',
    team: 'neutral',
    icon: '🦊',
    color: '#F39C12',
    hasSpecialAbility: true,
    abilityDescription: '单独胜利条件'
  },
  [Role.DETECTIVE]: {
    name: '侦探',
    description: '可以调查其他玩家的身份',
    team: 'good',
    icon: '🕵️',
    color: '#9B59B6',
    hasSpecialAbility: true,
    abilityDescription: '每轮会议可调查一人身份'
  },
  [Role.HUNTER]: {
    name: '猎人',
    description: '被淘汰时可以带走一人',
    team: 'good',
    icon: '🎯',
    color: '#2ECC71',
    hasSpecialAbility: true,
    abilityDescription: '死亡时可淘汰一名玩家'
  }
};

// Game phase
export enum GamePhase {
  LOBBY = 'lobby',           // Waiting for players
  STARTING = 'starting',     // Counting down to start
  PLAYING = 'playing',       // Main game phase
  MEETING = 'meeting',       // Emergency meeting/voting
  ENDED = 'ended'           // Game over
}

// Player state
export interface Player {
  id: string;
  userId?: string;
  username: string;
  socketId: string;
  role: Role;
  isAlive: boolean;
  position: { x: number; y: number };
  tasksCompleted: number;
  votes?: string; // Player ID they voted for
  isHost: boolean;
  // Special abilities
  investigationsRemaining?: number; // For Detective
  hasUsedHunterAbility?: boolean;   // For Hunter
  investigatedBy?: string[];        // Players who investigated this player
}

// Task definition
export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'short' | 'long' | 'common';
  location: { x: number; y: number };
  isCompleted: boolean;
  completedBy?: string[]; // Player IDs
}

// Sabotage types
export enum SabotageType {
  LOCK_DOORS = 'lock_doors',
  DISABLE_LIGHTS = 'disable_lights',
  DISABLE_COMMS = 'disable_comms',
  SPEED_BOOST = 'speed_boost'
}

// Active sabotage
export interface Sabotage {
  type: SabotageType;
  activatedBy: string;
  activatedAt: number;
  duration: number;
}

// Vote record
export interface Vote {
  voterId: string;
  targetId: string | null; // null for skip vote
  timestamp: number;
}

// Game settings
export interface GameSettings {
  mapId: string;
  playerCount: number;
  dogCount: number;
  foxCount: number;
  detectiveCount: number;
  hunterCount: number;
  taskCount: number;
  votingTime: number;
  discussionTime: number;
}

// Game state
export interface GameState {
  id: string;
  code: string; // Room code for joining
  hostId: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Map<string, Player>;
  tasks: Task[];
  sabotages: Sabotage[];
  votes: Vote[];
  meetingStartTime?: number;
  winner?: Role | 'cats' | 'dogs' | 'fox';
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
}

// Investigation result
export interface InvestigationResult {
  targetPlayerId: string;
  targetRole: Role;
  targetTeam: 'good' | 'bad' | 'neutral';
  investigatorId: string;
  timestamp: number;
}

// Hunter elimination
export interface HunterElimination {
  hunterId: string;
  targetId: string;
  timestamp: number;
}

// Socket event types
export interface SocketEvents {
  // Client -> Server
  'join_room': (data: { roomCode: string }) => void;
  'create_room': (data: { settings: Partial<GameSettings> }) => void;
  'leave_room': () => void;
  'start_game': () => void;
  'move_player': (data: { x: number; y: number }) => void;
  'complete_task': (data: { taskId: string }) => void;
  'report_body': (data: { playerId: string }) => void;
  'emergency_meeting': () => void;
  'cast_vote': (data: { targetId: string | null }) => void;
  'chat_message': (data: { message: string }) => void;
  'sabotage': (data: { type: SabotageType }) => void;
  'investigate': (data: { targetId: string }) => void;  // Detective ability
  'hunter_eliminate': (data: { targetId: string }) => void;  // Hunter ability
  
  // Server -> Client
  'room_created': (data: { roomCode: string; gameId: string }) => void;
  'room_joined': (data: { game: GameState; player: Player }) => void;
  'player_joined': (data: { player: Player }) => void;
  'player_left': (data: { playerId: string }) => void;
  'game_started': (data: { role: Role; players: Player[] }) => void;
  'game_state_update': (data: GameState) => void;
  'meeting_started': (data: { deadPlayer?: Player }) => void;
  'voting_result': (data: { ejectedPlayer?: Player; skipped: boolean }) => void;
  'game_ended': (data: { winner: Role | 'cats' | 'dogs' | 'fox' }) => void;
  'investigation_result': (data: InvestigationResult) => void;
  'hunter_elimination': (data: HunterElimination) => void;
  'error': (data: { message: string }) => void;
}
