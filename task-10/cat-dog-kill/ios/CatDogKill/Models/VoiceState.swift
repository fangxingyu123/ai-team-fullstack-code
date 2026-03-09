//
// 语音状态模型
//

import Foundation

/// 语音参与者状态
struct VoiceParticipant: Codable, Identifiable {
    let userId: String
    let username: String
    var isMuted: Bool
    var isSpeaking: Bool
    
    var id: String { userId }
}

/// 语音房间信息
struct VoiceRoom: Codable {
    let id: String
    let gameId: String
    let roomCode: String
    var participants: [VoiceParticipant]
    let createdAt: TimeInterval
}

/// WebRTC 配置
struct WebRTCConfig: Codable {
    let iceServers: [IceServer]
    let iceCandidatePoolSize: Int?
    
    struct IceServer: Codable {
        let urls: [String]
        let username: String?
        let credential: String?
    }
}

/// 语音聊天错误类型
enum VoiceChatError: LocalizedError {
    case notConnected
    case roomNotFound
    case alreadyInRoom
    case permissionDenied
    case connectionFailed
    case unknown(String)
    
    var errorDescription: String? {
        switch self {
        case .notConnected:
            return "未连接到语音服务器"
        case .roomNotFound:
            return "语音房间不存在"
        case .alreadyInRoom:
            return "已在语音房间中"
        case .permissionDenied:
            return "麦克风权限被拒绝"
        case .connectionFailed:
            return "语音连接失败"
        case .unknown(let message):
            return message
        }
    }
}

/// 语音聊天状态
enum VoiceChatState {
    case disconnected
    case connecting
    case connected
    case inRoom
    case error(VoiceChatError)
}
