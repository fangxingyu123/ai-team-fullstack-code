import { RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, Role, GamePhase, Task, GameSettings, Sabotage, Vote, ROLE_CONFIGS } from '../types/game';
import { generateMapTasks, getMap, MAPS } from '../types/maps';

const DEFAULT_SETTINGS: GameSettings = {
  mapId: 'map1',
  playerCount: 4,
  dogCount: 1,
  foxCount: 0,
  detectiveCount: 0,
  hunterCount: 0,
  taskCount: 10,
  votingTime: 30000,
  discussionTime: 60000
};

export class GameService {
  private redis: RedisClientType;
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map(); // socketId -> gameId
  private gameToVoiceRoom: Map<string, string> = new Map(); // gameId -> voiceRoomId

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * 获取游戏关联的语音房间 ID
   */
  getVoiceRoomId(gameId: string): string | undefined {
    return this.gameToVoiceRoom.get(gameId);
  }

  /**
   * 设置游戏关联的语音房间 ID
   */
  setVoiceRoomId(gameId: string, voiceRoomId: string): void {
    this.gameToVoiceRoom.set(gameId, voiceRoomId);
  }

  /**
   * 清理游戏的语音房间关联
   */
  clearVoiceRoomId(gameId: string): void {
    this.gameToVoiceRoom.delete(gameId);
  }

  // Generate a 6-character room code
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new game room
  async createRoom(hostSocketId: string, hostUserId: string, hostUsername: string, settings: Partial<GameSettings> = {}): Promise<GameState> {
    const gameId = uuidv4();
    const roomCode = this.generateRoomCode();
    
    const gameSettings: GameSettings = {
      ...DEFAULT_SETTINGS,
      ...settings
    };

    const hostPlayer: Player = {
      id: uuidv4(),
      userId: hostUserId,
      username: hostUsername,
      socketId: hostSocketId,
      role: Role.CAT, // Will be reassigned when game starts
      isAlive: true,
      position: { x: 0, y: 0 },
      tasksCompleted: 0,
      isHost: true
    };

    const game: GameState = {
      id: gameId,
      code: roomCode,
      hostId: hostSocketId,
      phase: GamePhase.LOBBY,
      settings: gameSettings,
      players: new Map([[hostPlayer.id, hostPlayer]]),
      tasks: [],
      sabotages: [],
      votes: [],
      createdAt: Date.now()
    };

    this.games.set(gameId, game);
    this.playerToGame.set(hostSocketId, gameId);

    // Store in Redis for persistence
    await this.saveGameToRedis(game);

    return game;
  }

  // Join an existing room
  async joinRoom(socketId: string, userId: string, username: string, roomCode: string): Promise<{ game: GameState; player: Player } | null> {
    const game = await this.findGameByCode(roomCode);
    if (!game) return null;

    if (game.phase !== GamePhase.LOBBY) {
      return null; // Game already started
    }

    if (game.players.size >= game.settings.playerCount) {
      return null; // Room full
    }

    const player: Player = {
      id: uuidv4(),
      userId,
      username,
      socketId,
      role: Role.CAT,
      isAlive: true,
      position: { x: 0, y: 0 },
      tasksCompleted: 0,
      isHost: false
    };

    game.players.set(player.id, player);
    this.playerToGame.set(socketId, game.id);

    await this.saveGameToRedis(game);

    return { game, player };
  }

  // Leave a room
  async leaveRoom(socketId: string): Promise<GameState | null> {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return null;

    const game = this.games.get(gameId);
    if (!game) return null;

    // Find and remove player
    let playerToRemove: Player | undefined;
    for (const [playerId, player] of game.players) {
      if (player.socketId === socketId) {
        playerToRemove = player;
        game.players.delete(playerId);
        break;
      }
    }

    this.playerToGame.delete(socketId);

    // If host left, transfer host or end game
    if (playerToRemove?.isHost && game.players.size > 0) {
      const newHost = game.players.values().next().value;
      if (newHost) newHost.isHost = true;
      game.hostId = newHost?.socketId || '';
    }

    // If no players left, delete the game
    if (game.players.size === 0) {
      this.games.delete(gameId);
      await this.deleteGameFromRedis(gameId);
      return null;
    }

    await this.saveGameToRedis(game);
    return game;
  }

  // Start the game
  async startGame(gameId: string): Promise<GameState | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    const minPlayers = Math.max(4, game.settings.dogCount + game.settings.foxCount + 2);
    if (game.players.size < minPlayers) {
      return null; // Not enough players
    }

    game.phase = GamePhase.STARTING;
    
    // Assign roles
    this.assignRoles(game);
    
    // Generate tasks
    this.generateTasks(game);

    game.phase = GamePhase.PLAYING;
    game.startedAt = Date.now();

    await this.saveGameToRedis(game);
    return game;
  }

  /**
   * 获取游戏的语音房间 ID（如果存在）
   */
  getGameVoiceRoomId(gameId: string): string | undefined {
    return this.gameToVoiceRoom.get(gameId);
  }

  /**
   * 设置游戏的语音房间 ID
   */
  setGameVoiceRoomId(gameId: string, voiceRoomId: string): void {
    this.gameToVoiceRoom.set(gameId, voiceRoomId);
  }

  /**
   * 清理游戏的语音房间关联
   */
  cleanupGameVoiceRoom(gameId: string): void {
    this.gameToVoiceRoom.delete(gameId);
  }

  // Assign roles to players
  private assignRoles(game: GameState): void {
    const players = Array.from(game.players.values());
    const shuffled = players.sort(() => Math.random() - 0.5);

    let index = 0;

    // Assign dogs (bad guys)
    for (let i = 0; i < game.settings.dogCount; i++) {
      shuffled[index].role = Role.DOG;
      index++;
    }

    // Assign foxes (neutral)
    for (let i = 0; i < game.settings.foxCount; i++) {
      shuffled[index].role = Role.FOX;
      index++;
    }

    // Assign detectives (good with ability)
    for (let i = 0; i < game.settings.detectiveCount; i++) {
      if (index < shuffled.length) {
        shuffled[index].role = Role.DETECTIVE;
        shuffled[index].investigationsRemaining = 3; // 3 investigations per game
        index++;
      }
    }

    // Assign hunters (good with ability)
    for (let i = 0; i < game.settings.hunterCount; i++) {
      if (index < shuffled.length) {
        shuffled[index].role = Role.HUNTER;
        shuffled[index].hasUsedHunterAbility = false;
        index++;
      }
    }

    // Rest are cats (basic good guys)
    while (index < shuffled.length) {
      shuffled[index].role = Role.CAT;
      index++;
    }
  }

  // Generate tasks for the map
  private generateTasks(game: GameState): void {
    // Use the new map-based task generation
    const mapTasks = generateMapTasks(game.settings.mapId, game.settings.taskCount);
    
    // Convert map tasks to game tasks
    game.tasks = mapTasks.map(mapTask => ({
      id: mapTask.id,
      name: mapTask.name,
      description: mapTask.description,
      type: mapTask.type,
      location: { x: mapTask.x, y: mapTask.y },
      isCompleted: false,
      completedBy: []
    }));
  }

  // Move player
  async movePlayer(socketId: string, x: number, y: number): Promise<Player | null> {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return null;

    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.PLAYING) return null;

    for (const player of game.players.values()) {
      if (player.socketId === socketId && player.isAlive) {
        player.position = { x, y };
        return player;
      }
    }

    return null;
  }

  // Complete a task
  async completeTask(socketId: string, taskId: string): Promise<{ success: boolean; task?: Task }> {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return { success: false };

    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.PLAYING) return { success: false };

    const player = Array.from(game.players.values()).find(p => p.socketId === socketId);
    if (!player || !player.isAlive || player.role === Role.DOG) {
      return { success: false }; // Only cats can complete tasks
    }

    const task = game.tasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return { success: false };

    task.isCompleted = true;
    task.completedBy = [...(task.completedBy || []), player.id];
    player.tasksCompleted++;

    await this.saveGameToRedis(game);
    return { success: true, task };
  }

  // Check win conditions
  checkWinCondition(game: GameState): Role | 'cats' | 'dogs' | 'fox' | null {
    const players = Array.from(game.players.values());
    const alivePlayers = players.filter(p => p.isAlive);
    
    const cats = alivePlayers.filter(p => p.role === Role.CAT);
    const dogs = alivePlayers.filter(p => p.role === Role.DOG);
    const foxes = alivePlayers.filter(p => p.role === Role.FOX);
    const detectives = alivePlayers.filter(p => p.role === Role.DETECTIVE);
    const hunters = alivePlayers.filter(p => p.role === Role.HUNTER);
    
    // Good team includes cats, detectives, and hunters
    const goodTeam = [...cats, ...detectives, ...hunters];

    // All dogs eliminated - Good team wins
    if (dogs.length === 0) {
      // Check if fox is still alive (fox wins alone if survives to end)
      if (foxes.length > 0 && goodTeam.length === 0) {
        return 'fox';
      }
      return 'cats'; // Good team wins
    }

    // Dogs equal or outnumber good team - Dogs win
    if (dogs.length >= goodTeam.length) {
      return 'dogs';
    }

    // All tasks completed - Good team wins
    const allTasksCompleted = game.tasks.every(t => t.isCompleted);
    if (allTasksCompleted) {
      // Check if fox is still alive
      if (foxes.length > 0 && goodTeam.length === 0) {
        return 'fox';
      }
      return 'cats';
    }

    // Fox special win condition: survives when only fox and dogs remain
    if (foxes.length > 0 && goodTeam.length === 0 && dogs.length > 0) {
      return 'fox';
    }

    // Fox survives when only fox remains (last one standing)
    if (foxes.length === 1 && goodTeam.length === 0 && dogs.length === 0) {
      return 'fox';
    }

    return null;
  }

  // End game
  async endGame(gameId: string, winner: Role | 'cats' | 'dogs' | 'fox'): Promise<GameState | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.phase = GamePhase.ENDED;
    game.winner = winner;
    game.endedAt = Date.now();

    await this.saveGameToRedis(game);
    return game;
  }

  // Get game by code
  async findGameByCode(code: string): Promise<GameState | null> {
    for (const game of this.games.values()) {
      if (game.code === code) return game;
    }
    return null;
  }

  // Get game by ID
  getGame(gameId: string): GameState | null {
    return this.games.get(gameId) || null;
  }

  // Get player's game
  getPlayerGame(socketId: string): GameState | null {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return null;
    return this.games.get(gameId) || null;
  }

  // Save game to Redis
  private async saveGameToRedis(game: GameState): Promise<void> {
    const gameData = {
      ...game,
      players: Array.from(game.players.entries())
    };
    await this.redis.set(`game:${game.id}`, JSON.stringify(gameData), { EX: 3600 }); // 1 hour expiry
    await this.redis.set(`game:code:${game.code}`, game.id, { EX: 3600 });
  }

  // Delete game from Redis
  private async deleteGameFromRedis(gameId: string): Promise<void> {
    await this.redis.del(`game:${gameId}`);
  }

  // Load game from Redis
  async loadGameFromRedis(gameId: string): Promise<GameState | null> {
    const data = await this.redis.get(`game:${gameId}`);
    if (!data) return null;

    const parsed = JSON.parse(data);
    const game: GameState = {
      ...parsed,
      players: new Map(parsed.players)
    };
    
    this.games.set(gameId, game);
    return game;
  }

  // Detective investigation ability
  async investigate(socketId: string, targetId: string): Promise<{ success: boolean; result?: { targetId: string; role: Role; team: 'good' | 'bad' | 'neutral' } }> {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return { success: false };

    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.PLAYING) return { success: false };

    const investigator = Array.from(game.players.values()).find(p => p.socketId === socketId);
    if (!investigator || !investigator.isAlive || investigator.role !== Role.DETECTIVE) {
      return { success: false }; // Only detective can investigate
    }

    if (!investigator.investigationsRemaining || investigator.investigationsRemaining <= 0) {
      return { success: false }; // No investigations left
    }

    const target = game.players.get(targetId);
    if (!target || !target.isAlive) {
      return { success: false }; // Invalid target
    }

    // Perform investigation
    investigator.investigationsRemaining--;
    if (!target.investigatedBy) {
      target.investigatedBy = [];
    }
    target.investigatedBy.push(investigator.id);

    const roleConfig = ROLE_CONFIGS[target.role];
    const result = {
      targetId: target.id,
      role: target.role,
      team: roleConfig.team
    };

    return { success: true, result };
  }

  // Hunter elimination ability (when dying)
  async hunterEliminate(socketId: string, targetId: string): Promise<{ success: boolean; eliminatedPlayer?: Player }> {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return { success: false };

    const game = this.games.get(gameId);
    if (!game) return { success: false };

    const hunter = Array.from(game.players.values()).find(p => p.socketId === socketId);
    if (!hunter || hunter.role !== Role.HUNTER) {
      return { success: false }; // Only hunter can use this ability
    }

    if (hunter.hasUsedHunterAbility) {
      return { success: false }; // Already used
    }

    const target = game.players.get(targetId);
    if (!target || !target.isAlive) {
      return { success: false }; // Invalid target
    }

    // Eliminate target
    target.isAlive = false;
    hunter.hasUsedHunterAbility = true;

    await this.saveGameToRedis(game);
    return { success: true, eliminatedPlayer: target };
  }

  // Handle player death (trigger hunter ability if applicable)
  async handlePlayerDeath(gameId: string, playerId: string): Promise<{ hunterElimination?: Player }> {
    const game = this.games.get(gameId);
    if (!game) return {};

    const player = game.players.get(playerId);
    if (!player) return {};

    // Check if player is hunter and hasn't used ability
    if (player.role === Role.HUNTER && !player.hasUsedHunterAbility) {
      // Hunter can eliminate someone when dying
      // This is handled separately via hunter_eliminate socket event
      // Return hunter info so client knows to trigger ability
      return { hunterElimination: player };
    }

    return {};
  }
}
