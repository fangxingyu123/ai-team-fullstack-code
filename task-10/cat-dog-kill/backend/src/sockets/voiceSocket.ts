//
// 语音聊天 Socket.IO 处理
//

import { Server, Socket } from 'socket.io';
import { VoiceService } from '../services/voiceService';
import {
  VoiceEventType,
  WebRTCOffer,
  WebRTCAnswer,
  WebRTCICECandidate,
  VoiceStatusUpdate,
} from '../types/voice';

interface JoinVoiceRoomData {
  roomId: string;
  userId: string;
  username: string;
}

interface LeaveVoiceRoomData {
  roomId: string;
}

export function initializeVoiceSocket(io: Server, voiceService: VoiceService): void {
  // 加入语音房间
  io.on('connection', (socket: Socket) => {
    console.log(`🎙️ Voice socket connected: ${socket.id}`);

    // 加入语音房间
    socket.on(
      VoiceEventType.JOIN_VOICE_ROOM,
      async (data: JoinVoiceRoomData) => {
        try {
          const { roomId, userId, username } = data;

          const result = voiceService.joinVoiceRoom(
            roomId,
            userId,
            username,
            socket.id
          );

          if (!result.success) {
            socket.emit(VoiceEventType.VOICE_ERROR, {
              message: result.error || 'Failed to join voice room',
            });
            return;
          }

          // 加入 Socket.IO 房间
          socket.join(roomId);

          // 通知房间内的其他人
          socket.to(roomId).emit(VoiceEventType.USER_JOINED_VOICE, {
            userId,
            username,
          });

          // 发送房间内现有用户列表给新加入者
          const participants = voiceService.getAllParticipants(roomId);
          socket.emit('voice_room_participants', {
            participants: participants.map((p) => ({
              userId: p.userId,
              username: p.username,
              isMuted: p.isMuted,
            })),
          });

          // 发送 WebRTC 配置
          socket.emit('webrtc_config', {
            config: voiceService.getWebRTCConfig(),
          });

          console.log(
            `🎙️ ${username} joined voice room ${roomId} (${participants.length} participants)`
          );
        } catch (error) {
          console.error('Failed to join voice room:', error);
          socket.emit(VoiceEventType.VOICE_ERROR, {
            message: 'Failed to join voice room',
          });
        }
      }
    );

    // 离开语音房间
    socket.on(
      VoiceEventType.LEAVE_VOICE_ROOM,
      async (data: LeaveVoiceRoomData) => {
        try {
          const { roomId } = data;
          const room = voiceService.leaveVoiceRoom(socket.data.userId);

          if (room) {
            socket.leave(roomId);

            // 通知房间内的其他人
            socket.to(roomId).emit(VoiceEventType.USER_LEFT_VOICE, {
              userId: socket.data.userId,
            });

            console.log(`🎙️ ${socket.data.userId} left voice room ${roomId}`);
          }
        } catch (error) {
          console.error('Failed to leave voice room:', error);
        }
      }
    );

    // 转发 WebRTC Offer
    socket.on(VoiceEventType.WEBRTC_OFFER, async (data: WebRTCOffer) => {
      try {
        const { roomId, targetUserId, offer } = data;

        // 验证用户是否在房间中
        const userRoomId = voiceService.getUserVoiceRoom(socket.data.userId);
        if (userRoomId !== roomId) {
          socket.emit(VoiceEventType.VOICE_ERROR, {
            message: 'Not in this voice room',
          });
          return;
        }

        // 找到目标用户的 socket
        const room = voiceService.getVoiceRoom(roomId);
        if (!room) {
          socket.emit(VoiceEventType.VOICE_ERROR, {
            message: 'Room not found',
          });
          return;
        }

        const targetParticipant = room.participants.get(targetUserId);
        if (!targetParticipant) {
          socket.emit(VoiceEventType.VOICE_ERROR, {
            message: 'Target user not found',
          });
          return;
        }

        // 转发 Offer 给目标用户
        const targetSocket = io.sockets.sockets.get(targetParticipant.socketId);
        if (targetSocket) {
          targetSocket.emit(VoiceEventType.WEBRTC_OFFER_RECEIVED, {
            fromUserId: socket.data.userId,
            fromUsername: socket.data.username,
            offer,
          });

          console.log(
            `🎙️ Forwarded WebRTC offer from ${socket.data.userId} to ${targetUserId}`
          );
        }
      } catch (error) {
        console.error('Failed to forward WebRTC offer:', error);
        socket.emit(VoiceEventType.VOICE_ERROR, {
          message: 'Failed to forward WebRTC offer',
        });
      }
    });

    // 转发 WebRTC Answer
    socket.on(VoiceEventType.WEBRTC_ANSWER, async (data: WebRTCAnswer) => {
      try {
        const { roomId, targetUserId, answer } = data;

        const room = voiceService.getVoiceRoom(roomId);
        if (!room) {
          socket.emit(VoiceEventType.VOICE_ERROR, {
            message: 'Room not found',
          });
          return;
        }

        const targetParticipant = room.participants.get(targetUserId);
        if (!targetParticipant) {
          socket.emit(VoiceEventType.VOICE_ERROR, {
            message: 'Target user not found',
          });
          return;
        }

        const targetSocket = io.sockets.sockets.get(targetParticipant.socketId);
        if (targetSocket) {
          targetSocket.emit(VoiceEventType.WEBRTC_ANSWER_RECEIVED, {
            fromUserId: socket.data.userId,
            answer,
          });

          console.log(
            `🎙️ Forwarded WebRTC answer from ${socket.data.userId} to ${targetUserId}`
          );
        }
      } catch (error) {
        console.error('Failed to forward WebRTC answer:', error);
        socket.emit(VoiceEventType.VOICE_ERROR, {
          message: 'Failed to forward WebRTC answer',
        });
      }
    });

    // 转发 ICE Candidate
    socket.on(
      VoiceEventType.WEBRTC_ICE_CANDIDATE,
      async (data: WebRTCICECandidate) => {
        try {
          const { roomId, targetUserId, candidate } = data;

          const room = voiceService.getVoiceRoom(roomId);
          if (!room) {
            socket.emit(VoiceEventType.VOICE_ERROR, {
              message: 'Room not found',
            });
            return;
          }

          const targetParticipant = room.participants.get(targetUserId);
          if (!targetParticipant) {
            socket.emit(VoiceEventType.VOICE_ERROR, {
              message: 'Target user not found',
            });
            return;
          }

          const targetSocket = io.sockets.sockets.get(targetParticipant.socketId);
          if (targetSocket) {
            targetSocket.emit(VoiceEventType.WEBRTC_ICE_CANDIDATE_RECEIVED, {
              fromUserId: socket.data.userId,
              candidate,
            });
          }
        } catch (error) {
          console.error('Failed to forward ICE candidate:', error);
        }
      }
    );

    // 更新语音状态（静音/取消静音）
    socket.on(
      VoiceEventType.VOICE_STATUS_UPDATE,
      async (data: VoiceStatusUpdate) => {
        try {
          const result = voiceService.updateVoiceStatus(socket.data.userId, data);

          if (result.success && result.room) {
            // 广播语音状态更新给房间内所有人
            io.to(result.room.id).emit(VoiceEventType.USER_VOICE_STATUS, {
              userId: socket.data.userId,
              username: socket.data.username,
              muted: data.muted,
            });

            console.log(
              `🎙️ ${socket.data.username} ${data.muted ? 'muted' : 'unmuted'}`
            );
          }
        } catch (error) {
          console.error('Failed to update voice status:', error);
        }
      }
    );

    // 更新说话状态（用于 UI 显示）
    socket.on('speaking_status_update', async (data: { isSpeaking: boolean }) => {
      try {
        const result = voiceService.updateSpeakingStatus(
          socket.data.userId,
          data.isSpeaking
        );

        if (result.success && result.room) {
          // 广播说话状态更新给房间内所有人
          io.to(result.room.id).emit('user_speaking_status', {
            userId: socket.data.userId,
            username: socket.data.username,
            isSpeaking: data.isSpeaking,
          });
        }
      } catch (error) {
        console.error('Failed to update speaking status:', error);
      }
    });

    // 断开连接
    socket.on('disconnect', async () => {
      console.log(`🎙️ Voice socket disconnected: ${socket.id}`);
      
      const affectedRooms = voiceService.cleanupDisconnectedUser(socket.id);
      
      // 通知每个受影响的房间
      for (const room of affectedRooms) {
        io.to(room.id).emit(VoiceEventType.USER_LEFT_VOICE, {
          userId: socket.data.userId,
        });
      }
    });

    // 保存用户信息到 socket 数据
    socket.on('set_user_info', (data: { userId: string; username: string }) => {
      socket.data.userId = data.userId;
      socket.data.username = data.username;
      console.log(`🎙️ User info set: ${data.username} (${data.userId})`);
    });
  });
}
