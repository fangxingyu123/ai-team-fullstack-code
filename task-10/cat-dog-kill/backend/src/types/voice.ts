//
// 语音聊天类型定义
//

/**
 * 语音房间信息
 */
export interface VoiceRoom {
  id: string;
  gameId: string;
  roomCode: string;
  participants: Map<string, VoiceParticipant>;
  createdAt: number;
}

/**
 * 语音参与者
 */
export interface VoiceParticipant {
  userId: string;
  username: string;
  socketId: string;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: number;
  // WebRTC 连接状态
  peerConnections: Map<string, RTCPeerConnectionState>;
}

/**
 * WebRTC Offer 数据
 */
export interface WebRTCOffer {
  roomId: string;
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
}

/**
 * WebRTC Answer 数据
 */
export interface WebRTCAnswer {
  roomId: string;
  targetUserId: string;
  answer: RTCSessionDescriptionInit;
}

/**
 * ICE Candidate 数据
 */
export interface WebRTCICECandidate {
  roomId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

/**
 * 语音状态更新
 */
export interface VoiceStatusUpdate {
  muted: boolean;
}

/**
 * WebRTC 配置
 */
export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
  bundledPolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

/**
 * 默认 WebRTC 配置
 */
export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * 语音事件类型
 */
export enum VoiceEventType {
  // 客户端 → 服务器
  JOIN_VOICE_ROOM = 'join_voice_room',
  LEAVE_VOICE_ROOM = 'leave_voice_room',
  WEBRTC_OFFER = 'webrtc_offer',
  WEBRTC_ANSWER = 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE = 'webrtc_ice_candidate',
  VOICE_STATUS_UPDATE = 'voice_status_update',
  
  // 服务器 → 客户端
  USER_JOINED_VOICE = 'user_joined_voice',
  USER_LEFT_VOICE = 'user_left_voice',
  WEBRTC_OFFER_RECEIVED = 'webrtc_offer_received',
  WEBRTC_ANSWER_RECEIVED = 'webrtc_answer_received',
  WEBRTC_ICE_CANDIDATE_RECEIVED = 'webrtc_ice_candidate_received',
  USER_VOICE_STATUS = 'user_voice_status',
  VOICE_ERROR = 'voice_error',
}

/**
 * 语音错误类型
 */
export enum VoiceErrorType {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ALREADY_IN_ROOM = 'ALREADY_IN_ROOM',
  NOT_IN_ROOM = 'NOT_IN_ROOM',
  INVALID_TARGET = 'INVALID_TARGET',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}
