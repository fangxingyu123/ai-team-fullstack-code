//
//  GameView.swift
//  CatDogKill
//
//  游戏主界面
//

import SwiftUI

struct GameView: View {
    @EnvironmentObject var gameState: GameStateManager
    @Environment(\.dismiss) var dismiss
    
    @State private var showingTasks = false
    @State private var showingMeeting = false
    @State private var chatMessage = ""
    @State private var joystickPosition = CGPoint(x: 0, y: 0)
    
    var body: some View {
        ZStack {
            // Game Map Background
            GameMapView()
                .ignoresSafeArea()
            
            // Players Overlay
            PlayersOverlay()
            
            // Bottom Controls
            VStack {
                Spacer()
                
                // Chat Preview
                if gameState.currentGame?.phase == .meeting {
                    ChatPreviewView(message: $chatMessage)
                }
                
                // Control Panel
                ControlPanelView(
                    showingTasks: $showingTasks,
                    showingMeeting: $showingMeeting
                )
                .padding()
            }
            
            // Task Progress (Top Left)
            VStack {
                HStack {
                    TaskProgressView()
                    Spacer()
                }
                .padding()
                Spacer()
            }
            
            // Role Indicator (Top Right)
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    RoleBadgeView(role: gameState.myRole)
                }
                .padding()
            }
        }
        .fullScreenCover(isPresented: $showingTasks) {
            TaskListView()
        }
        .fullScreenCover(isPresented: $showingMeeting) {
            MeetingView()
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("离开") {
                    gameState.leaveRoom()
                    dismiss()
                }
            }
        }
        .navigationTitle("游戏进行中")
    }
}

// MARK: - Game Map View

struct GameMapView: View {
    var body: some View {
        ZStack {
            // Floor
            Color.green.opacity(0.3)
                .ignoresSafeArea()
            
            // Grid pattern
            GeometryReader { geometry in
                let gridSize: CGFloat = 50
                ForEach(0..<Int(geometry.size.width / gridSize), id: \.self) { x in
                    ForEach(0..<Int(geometry.size.height / gridSize), id: \.self) { y in
                        Rectangle()
                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            .frame(width: gridSize, height: gridSize)
                            .position(x: CGFloat(x) * gridSize + gridSize/2, y: CGFloat(y) * gridSize + gridSize/2)
                    }
                }
            }
            
            // Task Locations
            ForEach(0..<5) { i in
                TaskMarkerView(index: i)
            }
        }
    }
}

struct TaskMarkerView: View {
    let index: Int
    
    var body: some View {
        Circle()
            .fill(Color.yellow.opacity(0.5))
            .frame(width: 30, height: 30)
            .overlay(
                Image(systemName: "star.fill")
                    .foregroundColor(.yellow)
            )
            .position(x: 100 + CGFloat(index * 60), y: 150)
    }
}

// MARK: - Players Overlay

struct PlayersOverlay: View {
    @EnvironmentObject var gameState: GameStateManager
    
    var body: some View {
        GeometryReader { geometry in
            ForEach(gameState.currentGame?.players ?? []) { player in
                PlayerTokenView(player: player)
                    .position(
                        x: geometry.size.width * player.position.x / 100,
                        y: geometry.size.height * player.position.y / 100
                    )
            }
        }
    }
}

struct PlayerTokenView: View {
    let player: Player
    
    var body: some View {
        VStack(spacing: 2) {
            Circle()
                .fill(player.role == .dog ? Color.red : Color.blue)
                .frame(width: 40, height: 40)
                .overlay(
                    Text(player.isAlive ? "🐱" : "💀")
                        .font(.title2)
                )
                .overlay(
                    Circle()
                        .stroke(Color.white, lineWidth: 2)
                )
            
            Text(player.username)
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .padding(.horizontal, 4)
                .background(Color.black.opacity(0.5))
                .cornerRadius(4)
        }
    }
}

// MARK: - Control Panel

struct ControlPanelView: View {
    @EnvironmentObject var gameState: GameStateManager
    @Binding var showingTasks: Bool
    @Binding var showingMeeting: Bool
    
    var body: some View {
        VStack(spacing: 15) {
            // Virtual Joystick
            VirtualJoystickView(position: .constant(CGPoint(x: 0, y: 0)))
                .frame(width: 120, height: 120)
            
            // Action Buttons
            HStack(spacing: 20) {
                if gameState.myRole == .cat {
                    // Task Button (Cats only)
                    ActionButton(icon: "checkmark.circle.fill", label: "任务", color: .green) {
                        showingTasks = true
                    }
                }
                
                if gameState.myRole == .dog {
                    // Sabotage Button (Dogs only)
                    ActionButton(icon: "bolt.fill", label: "破坏", color: .red) {
                        gameState.performSabotage(type: "lock_doors")
                    }
                }
                
                // Emergency Meeting Button
                ActionButton(icon: "exclamationmark.triangle.fill", label: "会议", color: .orange) {
                    gameState.emergencyMeeting()
                }
                
                // Report Button
                ActionButton(icon: "megaphone.fill", label: "报告", color: .blue) {
                    // Report dead body
                }
            }
        }
        .padding()
        .background(Color.black.opacity(0.3))
        .cornerRadius(20)
    }
}

struct ActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title2)
                Text(label)
                    .font(.caption2)
            }
            .foregroundColor(.white)
            .frame(width: 60, height: 60)
            .background(color)
            .cornerRadius(12)
        }
    }
}

// MARK: - Virtual Joystick

struct VirtualJoystickView: View {
    @Binding var position: CGPoint
    @State private var dragOffset = CGSize.zero
    
    var body: some View {
        ZStack {
            // Base
            Circle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 100, height: 100)
            
            // Stick
            Circle()
                .fill(Color.white.opacity(0.8))
                .frame(width: 40, height: 40)
                .offset(
                    x: min(max(dragOffset.width, -30), 30),
                    y: min(max(dragOffset.height, -30), 30)
                )
        }
        .gesture(
            DragGesture()
                .onChanged { value in
                    dragOffset = value.translation
                }
                .onEnded { _ in
                    withAnimation {
                        dragOffset = .zero
                    }
                }
        )
    }
}

// MARK: - Task Progress

struct TaskProgressView: View {
    @EnvironmentObject var gameState: GameStateManager
    
    var totalTasks: Int {
        gameState.currentGame?.tasks.count ?? 0
    }
    
    var completedTasks: Int {
        gameState.currentGame?.tasks.filter { $0.isCompleted }.count ?? 0
    }
    
    var progress: Double {
        totalTasks > 0 ? Double(completedTasks) / Double(totalTasks) : 0
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("任务进度")
                .font(.caption)
                .foregroundColor(.white)
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.5))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: geometry.size.width * progress, height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(width: 150, height: 8)
            
            Text("\(completedTasks)/\(totalTasks)")
                .font(.caption2)
                .foregroundColor(.white)
        }
        .padding()
        .background(Color.black.opacity(0.5))
        .cornerRadius(8)
    }
}

// MARK: - Role Badge

struct RoleBadgeView: View {
    let role: PlayerRole?
    
    var body: some View {
        HStack(spacing: 4) {
            switch role {
            case .cat:
                Text("🐱")
                Text("猫咪")
            case .dog:
                Text("🐶")
                Text("狗狗")
            case .fox:
                Text("🦊")
                Text("狐狸")
            case nil:
                Text("❓")
                Text("未知")
            }
        }
        .font(.caption)
        .fontWeight(.semibold)
        .foregroundColor(.white)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(roleBackgroundColor.opacity(0.9))
        .cornerRadius(16)
    }
    
    var roleBackgroundColor: Color {
        switch role {
        case .cat: return .blue
        case .dog: return .red
        case .fox: return .purple
        case nil: return .gray
        }
    }
}

// MARK: - Task List View

struct TaskListView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var gameState: GameStateManager
    
    var body: some View {
        NavigationView {
            List {
                ForEach(gameState.currentGame?.tasks ?? []) { task in
                    TaskRowView(task: task)
                }
            }
            .navigationTitle("任务列表")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完成") { dismiss() }
                }
            }
        }
    }
}

struct TaskRowView: View {
    let task: Task
    
    var body: some View {
        HStack {
            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundColor(task.isCompleted ? .green : .gray)
            
            VStack(alignment: .leading) {
                Text(task.name)
                    .font(.headline)
                Text(task.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if !task.isCompleted {
                Button("执行") {
                    // Execute task
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }
}

// MARK: - Meeting View

struct MeetingView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var gameState: GameStateManager
    @State private var selectedPlayer: String?
    @State private var chatMessages: [(String, String, String)] = []
    
    var body: some View {
        NavigationView {
            VStack {
                // Player List
                List {
                    Section(header: Text("在座玩家")) {
                        ForEach(gameState.currentGame?.players.filter { $0.isAlive } ?? []) { player in
                            PlayerVoteRow(player: player, isSelected: selectedPlayer == player.id) {
                                selectedPlayer = player.id
                            }
                        }
                    }
                    
                    Section {
                        Button(action: { selectedPlayer = nil }) {
                            HStack {
                                Text("跳过投票")
                                Spacer()
                                if selectedPlayer == nil {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                }
                
                // Chat Area
                ChatAreaView(messages: chatMessages)
                
                // Vote Button
                Button(action: {
                    gameState.castVote(targetId: selectedPlayer)
                    dismiss()
                }) {
                    Text("投票")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                }
                .padding()
            }
            .navigationTitle("紧急会议")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("关闭") { dismiss() }
                }
            }
        }
    }
}

struct PlayerVoteRow: View {
    let player: Player
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        HStack {
            Text(player.isAlive ? "🐱" : "💀")
                .font(.title2)
            
            VStack(alignment: .leading) {
                Text(player.username)
                    .font(.headline)
                Text(player.role != nil ? "已揭示" : "身份未知")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.blue)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onSelect)
    }
}

struct ChatAreaView: View {
    let messages: [(String, String, String)]
    
    var body: some View {
        VStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(messages, id: \.0) { playerId, username, message in
                        HStack {
                            Text(username)
                                .fontWeight(.semibold)
                            Text(": \(message)")
                        }
                        .font(.caption)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding()
            
            HStack {
                TextField("输入消息...", text: .constant(""))
                    .textFieldStyle(.roundedBorder)
                
                Button(action: {}) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.blue)
                }
            }
            .padding()
        }
        .background(Color.gray.opacity(0.2))
    }
}

// MARK: - Chat Preview

struct ChatPreviewView: View {
    @Binding var message: String
    
    var body: some View {
        HStack {
            TextField("聊天...", text: $message)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal)
            
            Button(action: {}) {
                Image(systemName: "paperplane.fill")
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color.white.opacity(0.9))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

#Preview {
    GameView()
        .environmentObject(GameStateManager())
}
