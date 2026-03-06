// Player roles in the game
export enum Role {
  CAT = 'cat',      // Good guy - completes tasks
  DOG = 'dog',      // Bad guy - sabotages
  FOX = 'fox'       // Neutral - special win condition
}

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
  'error': (data: { message: string }) => void;
}
