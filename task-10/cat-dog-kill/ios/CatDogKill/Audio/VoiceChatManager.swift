//
// WebRTC 语音聊天核心
// 封装 WebRTC 连接和音频流处理
//

import Foundation
import AVFoundation

/// WebRTC 语音聊天管理器
class VoiceChatManager: NSObject {
    private var voiceManager: VoiceManager
    private var userId: String
    private var username: String
    
    // 音频会话配置
    private var audioEngine: AVAudioEngine?
    private var isAudioSetup = false
    
    // 状态
    private var isMuted = false
    private var isConnected = false
    private var currentRoomId: String?
    
    // 参与者
    private var participants: [VoiceParticipant] = []
    
    // 回调
    var onParticipantsUpdate: (([VoiceParticipant]) -> Void)?
    var onConnectionStateChange: ((Bool) -> Void)?
    var onError: ((String) -> Void)?
    
    init(userId: String, username: String, serverURL: String = "ws://localhost:3000") {
        self.userId = userId
        self.username = username
        self.voiceManager = VoiceManager(serverURL: serverURL)
        super.init()
        
        setupVoiceManagerCallbacks()
    }
    
    // MARK: - Public Methods
    
    /// 连接到语音服务
    func connect() {
        print("🎙️ VoiceChatManager: Connecting...")
        voiceManager.connect(userId: userId, username: username)
    }
    
    /// 断开连接
    func disconnect() {
        print("🎙️ VoiceChatManager: Disconnecting...")
        teardownAudio()
        voiceManager.disconnect()
        isConnected = false
        currentRoomId = nil
        onConnectionStateChange?(false)
    }
    
    /// 加入语音房间
    func joinRoom(roomId: String) {
        guard !isConnected else {
            print("🎙️ VoiceChatManager: Already connected to a room")
            return
        }
        
        currentRoomId = roomId
        voiceManager.joinVoiceRoom(roomId: roomId)
        setupAudio()
    }
    
    /// 离开语音房间
    func leaveRoom() {
        guard let roomId = currentRoomId else { return }
        
        voiceManager.leaveVoiceRoom(roomId: roomId)
        teardownAudio()
        currentRoomId = nil
        isConnected = false
        participants.removeAll()
        onParticipantsUpdate?(participants)
        onConnectionStateChange?(false)
    }
    
    /// 设置静音状态
    func setMuted(_ muted: Bool) {
        isMuted = muted
        voiceManager.setMuted(muted)
        
        // 实际静音音频输入
        if let audioEngine = audioEngine {
            if muted {
                audioEngine.inputNode.muteOutput()
            } else {
                audioEngine.inputNode.unmuteOutput()
            }
        }
        
        print("🎙️ VoiceChatManager: Muted = \(muted)")
    }
    
    /// 获取当前静音状态
    func isMuted() -> Bool {
        return isMuted
    }
    
    /// 获取当前参与者列表
    func getParticipants() -> [VoiceParticipant] {
        return participants
    }
    
    /// 检测说话状态（通过音频电平）
    func detectSpeaking(_ audioLevel: Float) {
        let threshold: Float = 0.01 // 说话检测阈值
        let isSpeaking = audioLevel > threshold && !isMuted
        voiceManager.setSpeaking(isSpeaking)
    }
    
    // MARK: - Private Methods
    
    private func setupVoiceManagerCallbacks() {
        voiceManager.onStateChange = { [weak self] state in
            guard let self = self else { return }
            
            switch state {
            case .connected:
                print("🎙️ VoiceChatManager: Connected to voice server")
                
            case .inRoom:
                self.isConnected = true
                self.onConnectionStateChange?(true)
                print("🎙️ VoiceChatManager: In voice room")
                
            case .disconnected:
                self.isConnected = false
                self.onConnectionStateChange?(false)
                print("🎙️ VoiceChatManager: Disconnected")
                
            case .connecting:
                print("🎙️ VoiceChatManager: Connecting...")
                
            case .error(let error):
                self.onError?(error.errorDescription ?? "Unknown error")
                print("🎙️ VoiceChatManager: Error - \(error)")
            }
        }
        
        voiceManager.onParticipantsUpdate = { [weak self] participants in
            guard let self = self else { return }
            self.participants = participants
            self.onParticipantsUpdate?(participants)
            print("🎙️ VoiceChatManager: Participants updated (\(participants.count))")
        }
        
        voiceManager.onUserJoined = { [weak self] userId, username in
            guard let self = self else { return }
            print("🎙️ VoiceChatManager: User joined - \(username)")
            // 可以触发 WebRTC 连接到新用户
        }
        
        voiceManager.onUserLeft = { [weak self] userId in
            guard let self = self else { return }
            self.participants.removeAll { $0.userId == userId }
            self.onParticipantsUpdate?(self.participants)
            print("🎙️ VoiceChatManager: User left - \(userId)")
            // 清理 WebRTC 连接
        }
        
        voiceManager.onUserMuted = { [weak self] userId, isMuted in
            guard let self = self else { return }
            if let index = self.participants.firstIndex(where: { $0.userId == userId }) {
                self.participants[index].isMuted = isMuted
                self.onParticipantsUpdate?(self.participants)
            }
            print("🎙️ VoiceChatManager: User \(userId) muted = \(isMuted)")
        }
        
        voiceManager.onUserSpeaking = { [weak self] userId, isSpeaking in
            guard let self = self else { return }
            if let index = self.participants.firstIndex(where: { $0.userId == userId }) {
                self.participants[index].isSpeaking = isSpeaking
                self.onParticipantsUpdate?(self.participants)
            }
        }
        
        voiceManager.onWebRTCOffer = { [weak self] fromUserId, offer in
            guard let self = self else { return }
            print("🎙️ VoiceChatManager: Received WebRTC offer from \(fromUserId)")
            // TODO: 处理 WebRTC Offer，创建 Answer
        }
        
        voiceManager.onWebRTCAnswer = { [weak self] fromUserId, answer in
            guard let self = self else { return }
            print("🎙️ VoiceChatManager: Received WebRTC answer from \(fromUserId)")
            // TODO: 处理 WebRTC Answer
        }
        
        voiceManager.onICECandidate = { [weak self] fromUserId, candidate in
            guard let self = self else { return }
            print("🎙️ VoiceChatManager: Received ICE candidate from \(fromUserId)")
            // TODO: 处理 ICE Candidate
        }
        
        voiceManager.onError = { [weak self] error in
            guard let self = self else { return }
            self.onError?(error.errorDescription ?? "Unknown error")
            print("🎙️ VoiceChatManager: Error - \(error)")
        }
    }
    
    private func setupAudio() {
        guard !isAudioSetup else { return }
        
        // 配置音频会话
        let audioSession = AVAudioSession.sharedInstance()
        
        do {
            // 设置音频类别为播放和录制
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [
                .allowBluetooth,
                .allowBluetoothA2DP,
                .allowAirPlay,
                .defaultToSpeaker
            ])
            
            // 设置采样率
            try audioSession.setPreferredSampleRate(48000)
            
            // 设置 I/O 缓冲区时长
            try audioSession.setPreferredIOBufferDuration(0.005) // 5ms
            
            // 激活音频会话
            try audioSession.setActive(true)
            
            print("🎙️ VoiceChatManager: Audio session configured")
            isAudioSetup = true
            
            // 设置音频引擎
            setupAudioEngine()
            
        } catch {
            print("🎙️ VoiceChatManager: Failed to setup audio - \(error)")
            onError?("音频设置失败：\(error.localizedDescription)")
        }
    }
    
    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        
        guard let audioEngine = audioEngine else { return }
        
        let inputNode = audioEngine.inputNode
        let inputFormat = inputNode.inputFormat(forBus: 0)
        
        // 安装音频输入 tap 用于检测说话状态
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] buffer, time in
            guard let self = self else { return }
            
            // 计算音频电平
            let audioLevel = self.calculateAudioLevel(from: buffer)
            self.detectSpeaking(audioLevel)
        }
        
        do {
            try audioEngine.start()
            print("🎙️ VoiceChatManager: Audio engine started")
        } catch {
            print("🎙️ VoiceChatManager: Failed to start audio engine - \(error)")
        }
    }
    
    private func teardownAudio() {
        if let audioEngine = audioEngine {
            audioEngine.stop()
            audioEngine.reset()
            audioEngine.inputNode.removeTap(onBus: 0)
            self.audioEngine = nil
        }
        
        let audioSession = AVAudioSession.sharedInstance()
        try? audioSession.setActive(false, options: .notifyOthersOnDeactivation)
        
        isAudioSetup = false
        print("🎙️ VoiceChatManager: Audio torn down")
    }
    
    private func calculateAudioLevel(from buffer: AVAudioPCMBuffer) -> Float {
        guard let channelData = buffer.floatChannelData else { return 0 }
        
        let channelDataValue = channelData.pointee
        let channelDataArray = stride(from: 0,
                                       to: Int(buffer.frameLength),
                                       by: buffer.stride).map { channelDataValue[$0] }
        
        // 计算 RMS (均方根)
        let rms = sqrt(channelDataArray.map { $0 * $0 }.reduce(0, +) / Float(buffer.frameLength))
        
        return rms
    }
}

// MARK: - 语音检测委托

extension VoiceChatManager {
    /// 语音检测委托方法
    func voiceActivityDelegate(_ isSpeaking: Bool) {
        voiceManager.setSpeaking(isSpeaking)
    }
}
