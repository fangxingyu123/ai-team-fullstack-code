//
// 语音聊天服务
// 管理语音房间和 WebRTC 信令
//

import { v4 as uuidv4 } from 'uuid';
import {
  VoiceRoom,
  VoiceParticipant,
  VoiceStatusUpdate,
  WebRTCConfig,
  DEFAULT_WEBRTC_CONFIG,
  VoiceErrorType,
} from '../types/voice';

export class VoiceService {
  private voiceRooms: Map<string, VoiceRoom> = new Map();
  private userVoiceRooms: Map<string, string> = new Map(); // userId -> roomId
  private webrtcConfig: WebRTCConfig;

  constructor(config?: WebRTCConfig) {
    this.webrtcConfig = config || DEFAULT_WEBRTC_CONFIG;
    
    // 如果配置了 TURN 服务器，添加到 ICE servers
    const turnServer = process.env.TURN_SERVER;
    const turnUsername = process.env.TURN_USERNAME;
    const turnPassword = process.env.TURN_PASSWORD;
    
    if (turnServer && turnUsername && turnPassword) {
      this.webrtcConfig.iceServers.push({
        urls: turnServer,
        username: turnUsername,
        credential: turnPassword,
      });
    }
  }

  /**
   * 获取 WebRTC 配置
   */
  getWebRTCConfig(): WebRTCConfig {
    return this.webrtcConfig;
  }

  /**
   * 创建语音房间
   */
  createVoiceRoom(gameId: string, roomCode: string): VoiceRoom {
    const roomId = uuidv4();
    const voiceRoom: VoiceRoom = {
      id: roomId,
      gameId,
      roomCode,
      participants: new Map(),
      createdAt: Date.now(),
    };
    
    this.voiceRooms.set(roomId, voiceRoom);
    console.log(`🎙️ Voice room created: ${roomId} for game ${gameId}`);
    
    return voiceRoom;
  }

  /**
   * 获取语音房间
   */
  getVoiceRoom(roomId: string): VoiceRoom | undefined {
    return this.voiceRooms.get(roomId);
  }

  /**
   * 根据游戏 ID 获取语音房间
   */
  getVoiceRoomByGameId(gameId: string): VoiceRoom | undefined {
    for (const room of this.voiceRooms.values()) {
      if (room.gameId === gameId) {
        return room;
      }
    }
    return undefined;
  }

  /**
   * 删除语音房间
   */
  deleteVoiceRoom(roomId: string): boolean {
    const room = this.voiceRooms.get(roomId);
    if (!room) {
      return false;
    }

    // 清理所有用户的房间映射
    for (const participant of room.participants.values()) {
      this.userVoiceRooms.delete(participant.userId);
    }

    this.voiceRooms.delete(roomId);
    console.log(`🎙️ Voice room deleted: ${roomId}`);
    
    return true;
  }

  /**
   * 加入语音房间
   */
  joinVoiceRoom(
    roomId: string,
    userId: string,
    username: string,
    socketId: string
  ): { success: boolean; room?: VoiceRoom; error?: string } {
    const room = this.voiceRooms.get(roomId);
    if (!room) {
      return {
        success: false,
        error: VoiceErrorType.ROOM_NOT_FOUND,
      };
    }

    // 检查用户是否已在其他房间
    const existingRoomId = this.userVoiceRooms.get(userId);
    if (existingRoomId && existingRoomId !== roomId) {
      // 先离开旧房间
      this.leaveVoiceRoom(userId);
    }

    // 检查用户是否已在该房间
    if (room.participants.has(userId)) {
      return {
        success: false,
        error: VoiceErrorType.ALREADY_IN_ROOM,
      };
    }

    const participant: VoiceParticipant = {
      userId,
      username,
      socketId,
      isMuted: false,
      isSpeaking: false,
      joinedAt: Date.now(),
      peerConnections: new Map(),
    };

    room.participants.set(userId, participant);
    this.userVoiceRooms.set(userId, roomId);

    console.log(`🎙️ ${username} joined voice room ${roomId}`);
    
    return {
      success: true,
      room,
    };
  }

  /**
   * 离开语音房间
   */
  leaveVoiceRoom(userId: string): VoiceRoom | undefined {
    const roomId = this.userVoiceRooms.get(userId);
    if (!roomId) {
      return undefined;
    }

    const room = this.voiceRooms.get(roomId);
    if (!room) {
      this.userVoiceRooms.delete(userId);
      return undefined;
    }

    room.participants.delete(userId);
    this.userVoiceRooms.delete(userId);

    console.log(`🎙️ ${userId} left voice room ${roomId}`);
    
    // 如果房间为空，删除房间
    if (room.participants.size === 0) {
      this.voiceRooms.delete(roomId);
      console.log(`🎙️ Voice room ${roomId} is empty, deleted`);
    }

    return room;
  }

  /**
   * 获取用户的语音房间 ID
   */
  getUserVoiceRoom(userId: string): string | undefined {
    return this.userVoiceRooms.get(userId);
  }

  /**
   * 更新用户语音状态
   */
  updateVoiceStatus(
    userId: string,
    status: VoiceStatusUpdate
  ): { success: boolean; room?: VoiceRoom; participant?: VoiceParticipant } {
    const roomId = this.userVoiceRooms.get(userId);
    if (!roomId) {
      return { success: false };
    }

    const room = this.voiceRooms.get(roomId);
    if (!room) {
      return { success: false };
    }

    const participant = room.participants.get(userId);
    if (!participant) {
      return { success: false };
    }

    participant.isMuted = status.muted;

    return {
      success: true,
      room,
      participant,
    };
  }

  /**
   * 更新用户说话状态
   */
  updateSpeakingStatus(
    userId: string,
    isSpeaking: boolean
  ): { success: boolean; room?: VoiceRoom; participant?: VoiceParticipant } {
    const roomId = this.userVoiceRooms.get(userId);
    if (!roomId) {
      return { success: false };
    }

    const room = this.voiceRooms.get(roomId);
    if (!room) {
      return { success: false };
    }

    const participant = room.participants.get(userId);
    if (!participant) {
      return { success: false };
    }

    participant.isSpeaking = isSpeaking;

    return {
      success: true,
      room,
      participant,
    };
  }

  /**
   * 获取房间中的其他参与者（用于 P2P 连接）
   */
  getOtherParticipants(roomId: string, userId: string): VoiceParticipant[] {
    const room = this.voiceRooms.get(roomId);
    if (!room) {
      return [];
    }

    return Array.from(room.participants.values()).filter(
      (p) => p.userId !== userId
    );
  }

  /**
   * 获取房间中的所有参与者
   */
  getAllParticipants(roomId: string): VoiceParticipant[] {
    const room = this.voiceRooms.get(roomId);
    if (!room) {
      return [];
    }

    return Array.from(room.participants.values());
  }

  /**
   * 更新 Peer Connection 状态
   */
  updatePeerConnectionState(
    userId: string,
    targetUserId: string,
    state: RTCPeerConnectionState
  ): boolean {
    const roomId = this.userVoiceRooms.get(userId);
    if (!roomId) {
      return false;
    }

    const room = this.voiceRooms.get(roomId);
    if (!room) {
      return false;
    }

    const participant = room.participants.get(userId);
    if (!participant) {
      return false;
    }

    participant.peerConnections.set(targetUserId, state);
    return true;
  }

  /**
   * 清理断线用户的语音连接
   */
  cleanupDisconnectedUser(socketId: string): VoiceRoom[] {
    const affectedRooms: VoiceRoom[] = [];

    for (const [roomId, room] of this.voiceRooms.entries()) {
      const participant = Array.from(room.participants.values()).find(
        (p) => p.socketId === socketId
      );

      if (participant) {
        this.leaveVoiceRoom(participant.userId);
        affectedRooms.push(room);
      }
    }

    return affectedRooms;
  }

  /**
   * 获取语音房间统计信息
   */
  getStats(): {
    totalRooms: number;
    totalParticipants: number;
    rooms: Array<{ roomId: string; participantCount: number }>;
  } {
    const rooms = Array.from(this.voiceRooms.values()).map((room) => ({
      roomId: room.id,
      participantCount: room.participants.size,
    }));

    return {
      totalRooms: this.voiceRooms.size,
      totalParticipants: this.userVoiceRooms.size,
      rooms,
    };
  }
}
