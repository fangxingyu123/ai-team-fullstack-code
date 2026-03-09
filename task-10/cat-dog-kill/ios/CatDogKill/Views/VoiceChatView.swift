//
// 语音聊天 UI 组件
// 显示参与者列表和语音状态
//

import SwiftUI

/// 语音聊天视图
struct VoiceChatView: View {
    @StateObject private var viewModel: VoiceChatViewModel
    @Binding var isPresented: Bool
    
    init(viewModel: VoiceChatViewModel, isPresented: Binding<Bool>) {
        _viewModel = StateObject(wrappedValue: viewModel)
        _isPresented = isPresented
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // 标题栏
            headerView
            
            Divider()
            
            // 参与者列表
            participantsView
            
            Divider()
            
            // 控制按钮
            controlsView
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    // MARK: - Header
    
    private var headerView: some View {
        HStack {
            Text("语音聊天")
                .font(.headline)
                .foregroundColor(.primary)
            
            Spacer()
            
            // 连接状态指示器
            HStack(spacing: 4) {
                Circle()
                    .fill(viewModel.isConnected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                
                Text(viewModel.isConnected ? "已连接" : "未连接")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Button(action: {
                isPresented = false
            }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
    }
    
    // MARK: - Participants List
    
    private var participantsView: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(viewModel.participants) { participant in
                    ParticipantRowView(participant: participant, isMe: participant.userId == viewModel.userId)
                }
            }
            .padding()
        }
    }
    
    // MARK: - Controls
    
    private var controlsView: some View {
        HStack(spacing: 20) {
            // 静音按钮
            Button(action: {
                viewModel.toggleMute()
            }) {
                VStack {
                    Image(systemName: viewModel.isMuted ? "mic.slash.fill" : "mic.fill")
                        .font(.title2)
                    Text(viewModel.isMuted ? "取消静音" : "静音")
                        .font(.caption)
                }
                .frame(width: 60)
                .foregroundColor(.primary)
            }
            
            // 离开按钮
            Button(action: {
                viewModel.leaveRoom()
                isPresented = false
            }) {
                VStack {
                    Image(systemName: "phone.down.fill")
                        .font(.title2)
                    Text("离开")
                        .font(.caption)
                }
                .frame(width: 60)
                .foregroundColor(.red)
            }
        }
        .padding()
    }
}

// MARK: - Participant Row View

struct ParticipantRowView: View {
    let participant: VoiceParticipant
    let isMe: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // 头像
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.2))
                    .frame(width: 44, height: 44)
                
                // 说话指示器
                if participant.isSpeaking && !participant.isMuted {
                    Circle()
                        .stroke(Color.green, lineWidth: 3)
                        .frame(width: 44, height: 44)
                }
                
                // 头像图标
                Image(systemName: isMe ? "person.fill" : "person")
                    .font(.system(size: 20))
                    .foregroundColor(.blue)
            }
            
            // 用户名和状态
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(participant.username)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if isMe {
                        Text("(我)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                HStack(spacing: 8) {
                    // 静音状态
                    if participant.isMuted {
                        Label("静音", systemImage: "mic.slash.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                    
                    // 说话状态
                    if participant.isSpeaking && !participant.isMuted {
                        Label("说话中", systemImage: "waveform")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

// MARK: - View Model

class VoiceChatViewModel: ObservableObject {
    @Published var participants: [VoiceParticipant] = []
    @Published var isConnected = false
    @Published var isMuted = false
    @Published var error: String?
    
    let userId: String
    let username: String
    private var voiceChatManager: VoiceChatManager?
    
    init(userId: String, username: String, serverURL: String = "ws://localhost:3000") {
        self.userId = userId
        self.username = username
        
        super.init()
        
        voiceChatManager = VoiceChatManager(
            userId: userId,
            username: username,
            serverURL: serverURL
        )
        
        setupCallbacks()
    }
    
    private func setupCallbacks() {
        voiceChatManager?.onParticipantsUpdate = { [weak self] participants in
            DispatchQueue.main.async {
                self?.participants = participants
            }
        }
        
        voiceChatManager?.onConnectionStateChange = { [weak self] connected in
            DispatchQueue.main.async {
                self?.isConnected = connected
            }
        }
        
        voiceChatManager?.onError = { [weak self] error in
            DispatchQueue.main.async {
                self?.error = error
            }
        }
    }
    
    func connect() {
        voiceChatManager?.connect()
    }
    
    func joinRoom(roomId: String) {
        voiceChatManager?.joinRoom(roomId: roomId)
    }
    
    func leaveRoom() {
        voiceChatManager?.leaveRoom()
        participants.removeAll()
        isConnected = false
    }
    
    func disconnect() {
        voiceChatManager?.disconnect()
    }
    
    func toggleMute() {
        isMuted.toggle()
        voiceChatManager?.setMuted(isMuted)
    }
    
    func setMuted(_ muted: Bool) {
        isMuted = muted
        voiceChatManager?.setMuted(muted)
    }
}

// MARK: - Preview

struct VoiceChatView_Previews: PreviewProvider {
    static var previews: some View {
        VoiceChatView(
            viewModel: VoiceChatViewModel(userId: "user1", username: "TestUser"),
            isPresented: .constant(true)
        )
    }
}
