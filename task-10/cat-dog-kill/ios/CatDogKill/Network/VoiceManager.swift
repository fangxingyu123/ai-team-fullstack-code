//
// 语音聊天管理器 - WebRTC 信令
// 处理与语音服务器的 Socket.IO 通信
//

import Foundation
import Starscream

/// 语音聊天管理器
class VoiceManager: NSObject {
    private var socket: WebSocket?
    private let serverURL: String
    private var userId: String = ""
    private var username: String = ""
    private var currentRoomId: String?
    private var webrtcConfig: WebRTCConfig?
    
    // 状态
    var state: VoiceChatState = .disconnected {
        didSet {
            onStateChange?(state)
        }
    }
    
    // 回调
    var onStateChange: ((VoiceChatState) -> Void)?
    var onUserJoined: ((String, String) -> Void)?  // userId, username
    var onUserLeft: ((String) -> Void)?            // userId
    var onParticipantsUpdate: (([VoiceParticipant]) -> Void)?
    var onUserMuted: ((String, Bool) -> Void)?     // userId, isMuted
    var onUserSpeaking: ((String, Bool) -> Void)?  // userId, isSpeaking
    var onWebRTCOffer: ((String, [String: Any]) -> Void)?    // fromUserId, offer
    var onWebRTCAnswer: ((String, [String: Any]) -> Void)?   // fromUserId, answer
    var onICECandidate: ((String, [String: Any]) -> Void)?   // fromUserId, candidate
    var onError: ((VoiceChatError) -> Void)?
    
    init(serverURL: String = "ws://localhost:3000") {
        self.serverURL = serverURL
        super.init()
    }
    
    // MARK: - Connection
    
    func connect(userId: String, username: String) {
        self.userId = userId
        self.username = username
        
        var request = URLRequest(url: URL(string: serverURL)!)
        request.timeoutInterval = 5
        
        socket = WebSocket(request: request)
        socket?.delegate = self
        socket?.connect()
        
        state = .connecting
        print("🎙️ VoiceManager: Connecting to \(serverURL)")
    }
    
    func disconnect() {
        if let roomId = currentRoomId {
            leaveVoiceRoom(roomId: roomId)
        }
        socket?.disconnect()
        socket = nil
        currentRoomId = nil
        state = .disconnected
        print("🎙️ VoiceManager: Disconnected")
    }
    
    // MARK: - Voice Room Operations
    
    func joinVoiceRoom(roomId: String) {
        guard let socket = socket, socket.isConnected else {
            onError?(.notConnected)
            return
        }
        
        sendEvent("join_voice_room", data: [
            "roomId": roomId,
            "userId": userId,
            "username": username
        ])
        
        print("🎙️ VoiceManager: Joining voice room \(roomId)")
    }
    
    func leaveVoiceRoom(roomId: String) {
        sendEvent("leave_voice_room", data: [
            "roomId": roomId
        ])
        
        currentRoomId = nil
        print("🎙️ VoiceManager: Leaving voice room \(roomId)")
    }
    
    func setMuted(_ muted: Bool) {
        sendEvent("voice_status_update", data: [
            "muted": muted
        ])
        
        print("🎙️ VoiceManager: Set muted = \(muted)")
    }
    
    func setSpeaking(_ speaking: Bool) {
        sendEvent("speaking_status_update", data: [
            "isSpeaking": speaking
        ])
    }
    
    // MARK: - WebRTC Signaling
    
    func sendOffer(to userId: String, offer: [String: Any]) {
        guard let roomId = currentRoomId else { return }
        
        sendEvent("webrtc_offer", data: [
            "roomId": roomId,
            "targetUserId": userId,
            "offer": offer
        ])
        
        print("🎙️ VoiceManager: Sent offer to \(userId)")
    }
    
    func sendAnswer(to userId: String, answer: [String: Any]) {
        guard let roomId = currentRoomId else { return }
        
        sendEvent("webrtc_answer", data: [
            "roomId": roomId,
            "targetUserId": userId,
            "answer": answer
        ])
        
        print("🎙️ VoiceManager: Sent answer to \(userId)")
    }
    
    func sendICECandidate(to userId: String, candidate: [String: Any]) {
        guard let roomId = currentRoomId else { return }
        
        sendEvent("webrtc_ice_candidate", data: [
            "roomId": roomId,
            "targetUserId": userId,
            "candidate": candidate
        ])
    }
    
    // MARK: - Private Methods
    
    private func sendEvent(_ event: String, data: [String: Any]) {
        guard let socket = socket, socket.isConnected else {
            return
        }
        
        let payload: [String: Any] = [
            "event": event,
            "data": data
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: payload)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                socket.write(string: jsonString)
            }
        } catch {
            print("🎙️ VoiceManager: Failed to send event: \(error)")
        }
    }
    
    private func handleEvent(_ event: String, data: [String: Any]) {
        switch event {
        case "voice_room_participants":
            if let participantsArray = data["participants"] as? [[String: Any]] {
                let participants = participantsArray.compactMap { parseParticipant($0) }
                onParticipantsUpdate?(participants)
                state = .inRoom
            }
            
        case "webrtc_config":
            if let configDict = data["config"] as? [String: Any] {
                webrtcConfig = parseWebRTCConfig(configDict)
            }
            
        case "user_joined_voice":
            if let userId = data["userId"] as? String,
               let username = data["username"] as? String {
                onUserJoined?(userId, username)
            }
            
        case "user_left_voice":
            if let userId = data["userId"] as? String {
                onUserLeft?(userId)
            }
            
        case "user_voice_status":
            if let userId = data["userId"] as? String,
               let muted = data["muted"] as? Bool {
                onUserMuted?(userId, muted)
            }
            
        case "user_speaking_status":
            if let userId = data["userId"] as? String,
               let isSpeaking = data["isSpeaking"] as? Bool {
                onUserSpeaking?(userId, isSpeaking)
            }
            
        case "webrtc_offer_received":
            if let fromUserId = data["fromUserId"] as? String,
               let offer = data["offer"] as? [String: Any] {
                onWebRTCOffer?(fromUserId, offer)
            }
            
        case "webrtc_answer_received":
            if let fromUserId = data["fromUserId"] as? String,
               let answer = data["answer"] as? [String: Any] {
                onWebRTCAnswer?(fromUserId, answer)
            }
            
        case "webrtc_ice_candidate_received":
            if let fromUserId = data["fromUserId"] as? String,
               let candidate = data["candidate"] as? [String: Any] {
                onICECandidate?(fromUserId, candidate)
            }
            
        case "voice_error":
            if let message = data["message"] as? String {
                onError?(.unknown(message))
                state = .error(.unknown(message))
            }
            
        default:
            print("🎙️ VoiceManager: Unhandled event: \(event)")
        }
    }
    
    private func parseParticipant(_ dict: [String: Any]) -> VoiceParticipant? {
        guard let userId = dict["userId"] as? String,
              let username = dict["username"] as? String,
              let isMuted = dict["isMuted"] as? Bool else {
            return nil
        }
        
        let isSpeaking = dict["isSpeaking"] as? Bool ?? false
        
        return VoiceParticipant(
            userId: userId,
            username: username,
            isMuted: isMuted,
            isSpeaking: isSpeaking
        )
    }
    
    private func parseWebRTCConfig(_ dict: [String: Any]) -> WebRTCConfig? {
        guard let iceServersArray = dict["iceServers"] as? [[String: Any]] else {
            return nil
        }
        
        let iceServers = iceServersArray.compactMap { serverDict -> WebRTCConfig.IceServer? in
            guard let urls = serverDict["urls"] as? [String] else {
                return nil
            }
            
            return WebRTCConfig.IceServer(
                urls: urls,
                username: serverDict["username"] as? String,
                credential: serverDict["credential"] as? String
            )
        }
        
        return WebRTCConfig(
            iceServers: iceServers,
            iceCandidatePoolSize: dict["iceCandidatePoolSize"] as? Int
        )
    }
}

// MARK: - WebSocketDelegate

extension VoiceManager: WebSocketDelegate {
    func didReceive(event: Starscream.WebSocketEvent, client: Starscream.WebSocketClient) {
        switch event {
        case .connected(_):
            print("🎙️ VoiceManager: WebSocket connected")
            state = .connected
            
            // 设置用户信息
            sendEvent("set_user_info", data: [
                "userId": userId,
                "username": username
            ])
            
        case .disconnected(_, _):
            print("🎙️ VoiceManager: WebSocket disconnected")
            state = .disconnected
            
        case .text(let text):
            handleTextMessage(text)
            
        case .binary(_):
            break
            
        case .ping(_):
            break
            
        case .pong(_):
            break
            
        case .viabilityChanged(_):
            break
            
        case .reconnectSuggested(_):
            break
            
        case .cancelled:
            print("🎙️ VoiceManager: WebSocket cancelled")
            state = .disconnected
            
        case .error(let error):
            print("🎙️ VoiceManager: WebSocket error: \(error?.localizedDescription ?? "Unknown")")
            state = .error(.connectionFailed)
            
        @unknown default:
            break
        }
    }
    
    private func handleTextMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        
        do {
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let event = json["event"] as? String,
               let eventData = json["data"] as? [String: Any] {
                handleEvent(event, eventData)
            }
        } catch {
            print("🎙️ VoiceManager: Failed to parse message: \(error)")
        }
    }
}
