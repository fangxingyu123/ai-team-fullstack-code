import { Server, Socket } from 'socket.io';
import { GameService } from '../services/gameService';
import { GamePhase, Role, SabotageType } from '../types/game';

interface JoinRoomData {
  roomCode: string;
  userId?: string;
  username: string;
}

interface CreateRoomData {
  userId?: string;
  username: string;
  settings?: any;
}

interface MoveData {
  x: number;
  y: number;
}

interface TaskData {
  taskId: string;
}

interface VoteData {
  targetId: string | null;
}

interface ChatData {
  message: string;
}

interface SabotageData {
  type: SabotageType;
}

export function initializeSocket(io: Server, gameService: GameService): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Player connected: ${socket.id}`);

    // Create a new room
    socket.on('create_room', async (data: CreateRoomData) => {
      try {
        const game = await gameService.createRoom(
          socket.id,
          data.userId || '',
          data.username,
          data.settings
        );

        socket.join(game.id);
        
        socket.emit('room_created', {
          roomCode: game.code,
          gameId: game.id
        });

        io.to(game.id).emit('room_joined', {
          game: serializeGame(game),
          player: game.players.get(game.players.keys().next().value!)
        });

        console.log(`🏠 Room created: ${game.code} by ${data.username}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // Join an existing room
    socket.on('join_room', async (data: JoinRoomData) => {
      try {
        const result = await gameService.joinRoom(
          socket.id,
          data.userId || '',
          data.username,
          data.roomCode
        );

        if (!result) {
          socket.emit('error', { message: 'Invalid room code or game already started' });
          return;
        }

        const { game, player } = result;
        socket.join(game.id);

        socket.emit('room_joined', {
          game: serializeGame(game),
          player
        });

        // Notify other players
        socket.to(game.id).emit('player_joined', { player });

        console.log(`👤 ${data.username} joined room ${game.code}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave_room', async () => {
      const game = gameService.getPlayerGame(socket.id);
      if (!game) return;

      await gameService.leaveRoom(socket.id);
      socket.leave(game.id);

      // Notify other players
      socket.to(game.id).emit('player_left', { playerId: socket.id });

      console.log(`👋 Player left room ${game.code}`);
    });

    // Start game (host only)
    socket.on('start_game', async () => {
      const game = gameService.getPlayerGame(socket.id);
      if (!game) return;

      const player = Array.from(game.players.values()).find(p => p.socketId === socket.id);
      if (!player?.isHost) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }

      const updatedGame = await gameService.startGame(game.id);
      if (!updatedGame) {
        socket.emit('error', { message: 'Not enough players to start' });
        return;
      }

      // Send role to each player privately
      for (const p of updatedGame.players.values()) {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket) {
          playerSocket.emit('game_started', {
            role: p.role,
            players: Array.from(updatedGame.players.values()).map(pl => ({
              id: pl.id,
              username: pl.username,
              isAlive: pl.isAlive
            }))
          });
        }
      }

      io.to(game.id).emit('game_state_update', serializeGame(updatedGame));
      console.log(`🎮 Game started in room ${game.code}`);
    });

    // Move player
    socket.on('move_player', async (data: MoveData) => {
      const player = await gameService.movePlayer(socket.id, data.x, data.y);
      if (!player) return;

      const game = gameService.getPlayerGame(socket.id);
      if (!game) return;

      io.to(game.id).emit('game_state_update', serializeGame(game));
    });

    // Complete task
    socket.on('complete_task', async (data: TaskData) => {
      const result = await gameService.completeTask(socket.id, data.taskId);
      if (!result.success) return;

      const game = gameService.getPlayerGame(socket.id);
      if (!game) return;

      io.to(game.id).emit('game_state_update', serializeGame(game));

      // Check win condition
      const winner = gameService.checkWinCondition(game);
      if (winner) {
        await gameService.endGame(game.id, winner);
        io.to(game.id).emit('game_ended', { winner });
      }
    });

    // Emergency meeting
    socket.on('emergency_meeting', async () => {
      const game = gameService.getPlayerGame(socket.id);
      if (!game || game.phase !== GamePhase.PLAYING) return;

      game.phase = GamePhase.MEETING;
      game.meetingStartTime = Date.now();
      game.votes = [];

      // Clear votes from all players
      for (const player of game.players.values()) {
        player.votes = undefined;
      }

      io.to(game.id).emit('meeting_started', {});
      io.to(game.id).emit('game_state_update', serializeGame(game));

      console.log(`🚨 Emergency meeting in room ${game.code}`);
    });

    // Cast vote
    socket.on('cast_vote', async (data: VoteData) => {
      const game = gameService.getPlayerGame(socket.id);
      if (!game || game.phase !== GamePhase.MEETING) return;

      const player = Array.from(game.players.values()).find(p => p.socketId === socket.id);
      if (!player || !player.isAlive) return;

      player.votes = data.targetId || undefined;
      
      // Check if all alive players have voted
      const alivePlayers = Array.from(game.players.values()).filter(p => p.isAlive);
      const allVoted = alivePlayers.every(p => p.votes !== undefined);

      if (allVoted) {
        // Count votes
        const voteCounts = new Map<string, number>();
        for (const p of alivePlayers) {
          if (p.votes) {
            voteCounts.set(p.votes, (voteCounts.get(p.votes) || 0) + 1);
          }
        }

        // Find player with most votes
        let maxVotes = 0;
        let ejectedPlayerId: string | null = null;
        let tie = false;

        for (const [playerId, count] of voteCounts.entries()) {
          if (count > maxVotes) {
            maxVotes = count;
            ejectedPlayerId = playerId;
            tie = false;
          } else if (count === maxVotes) {
            tie = true;
          }
        }

        // Eject player if clear winner
        let ejectedPlayer = null;
        if (ejectedPlayerId && !tie) {
          const ejected = game.players.get(ejectedPlayerId);
          if (ejected) {
            ejected.isAlive = false;
            ejectedPlayer = { id: ejected.id, username: ejected.username, role: ejected.role };
          }
        }

        // Check win condition
        const winner = gameService.checkWinCondition(game);
        if (winner) {
          await gameService.endGame(game.id, winner);
          io.to(game.id).emit('voting_result', { ejectedPlayer, skipped: !ejectedPlayer });
          io.to(game.id).emit('game_ended', { winner });
        } else {
          game.phase = GamePhase.PLAYING;
          io.to(game.id).emit('voting_result', { ejectedPlayer, skipped: !ejectedPlayer });
          io.to(game.id).emit('game_state_update', serializeGame(game));
        }
      }
    });

    // Chat message (during meeting)
    socket.on('chat_message', async (data: ChatData) => {
      const game = gameService.getPlayerGame(socket.id);
      if (!game || game.phase !== GamePhase.MEETING) return;

      const player = Array.from(game.players.values()).find(p => p.socketId === socket.id);
      if (!player) return;

      io.to(game.id).emit('chat_message', {
        playerId: player.id,
        username: player.username,
        message: data.message,
        timestamp: Date.now()
      });
    });

    // Sabotage (dogs only)
    socket.on('sabotage', async (data: SabotageData) => {
      const game = gameService.getPlayerGame(socket.id);
      if (!game || game.phase !== GamePhase.PLAYING) return;

      const player = Array.from(game.players.values()).find(p => p.socketId === socket.id);
      if (!player || player.role !== Role.DOG || !player.isAlive) return;

      // Add sabotage
      game.sabotages.push({
        type: data.type,
        activatedBy: player.id,
        activatedAt: Date.now(),
        duration: 30000 // 30 seconds
      });

      io.to(game.id).emit('game_state_update', serializeGame(game));
      console.log(`💣 Sabotage ${data.type} by ${player.username}`);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Player disconnected: ${socket.id}`);
      await gameService.leaveRoom(socket.id);
      
      const game = gameService.getPlayerGame(socket.id);
      if (game) {
        socket.to(game.id).emit('player_left', { playerId: socket.id });
      }
    });
  });
}

// Serialize game state for sending to clients (convert Map to object)
function serializeGame(game: any) {
  return {
    ...game,
    players: Array.from(game.players.values()).map(p => ({
      id: p.id,
      username: p.username,
      role: p.role,
      isAlive: p.isAlive,
      position: p.position,
      tasksCompleted: p.tasksCompleted,
      isHost: p.isHost
    }))
  };
}
