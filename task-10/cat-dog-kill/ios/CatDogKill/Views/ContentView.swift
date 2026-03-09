//
//  ContentView.swift
//  CatDogKill
//
//  主界面
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var gameState: GameStateManager
    @State private var showingLogin = true
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainNavigationView()
            } else {
                AuthView()
            }
        }
        .onAppear {
            gameState.connect()
        }
        .onDisappear {
            gameState.disconnect()
        }
    }
}

// MARK: - Main Navigation

struct MainNavigationView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("首页", systemImage: "house")
                }
                .tag(0)
            
            RoomListView()
                .tabItem {
                    Label("房间", systemImage: "door.left.hand.open")
                }
                .tag(1)
            
            LeaderboardView()
                .tabItem {
                    Label("排行", systemImage: "trophy")
                }
                .tag(2)
            
            AchievementsView()
                .tabItem {
                    Label("成就", systemImage: "star")
                }
                .tag(3)
            
            ProfileView()
                .tabItem {
                    Label("我的", systemImage: "person")
                }
                .tag(4)
        }
    }
}

// MARK: - Home View

struct HomeView: View {
    @EnvironmentObject var gameState: GameStateManager
    @State private var showingCreateRoom = false
    @State private var showingJoinRoom = false
    @State private var roomCode = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Game Logo
                VStack(spacing: 10) {
                    Text("🐱🐶")
                        .font(.system(size: 80))
                    Text("猫狗杀")
                        .font(.title)
                        .fontWeight(.bold)
                    Text("多人联机社交推理游戏")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)
                
                Spacer()
                
                // Action Buttons
                VStack(spacing: 20) {
                    Button(action: { showingCreateRoom = true }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                            Text("创建房间")
                        }
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                    }
                    
                    Button(action: { showingJoinRoom = true }) {
                        HStack {
                            Image(systemName: "door.left.hand.open")
                            Text("加入房间")
                        }
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(12)
                    }
                    
                    Button(action: { }) {
                        HStack {
                            Image(systemName: "bolt.fill")
                            Text("快速匹配")
                        }
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 30)
                
                Spacer()
                
                // Connection Status
                HStack {
                    Circle()
                        .fill(gameState.isConnected ? Color.green : Color.red)
                        .frame(width: 10, height: 10)
                    Text(gameState.isConnected ? "已连接" : "未连接")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 20)
            }
            .navigationTitle("猫狗杀")
            .sheet(isPresented: $showingCreateRoom) {
                CreateRoomView()
            }
            .sheet(isPresented: $showingJoinRoom) {
                JoinRoomView(roomCode: $roomCode)
            }
        }
    }
}

// MARK: - Create Room View

struct CreateRoomView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var gameState: GameStateManager
    
    @State private var playerCount = 4
    @State private var dogCount = 1
    @State private var foxCount = 0
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("房间设置")) {
                    Stepper("玩家人数：\(playerCount)", value: $playerCount, in: 4...10)
                    Stepper("狗狗数量：\(dogCount)", value: $dogCount, in: 1...3)
                    Stepper("狐狸数量：\(foxCount)", value: $foxCount, in: 0...2)
                }
                
                Section {
                    Text("任务数量：10")
                    Text("投票时间：30 秒")
                    Text("讨论时间：60 秒")
                }
                
                Section {
                    Button(action: {
                        let settings: [String: Any] = [
                            "playerCount": playerCount,
                            "dogCount": dogCount,
                            "foxCount": foxCount,
                            "taskCount": 10,
                            "votingTime": 30000,
                            "discussionTime": 60000
                        ]
                        gameState.createRoom(username: "Player", settings: settings)
                        dismiss()
                    }) {
                        Text("创建房间")
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationTitle("创建房间")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("取消") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Join Room View

struct JoinRoomView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var gameState: GameStateManager
    @Binding var roomCode: String
    
    @State private var username = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("房间号")) {
                    TextField("6 位房间号", text: $roomCode)
                        .keyboardType(.alphabet)
                        .textInputAutocapitalization(.characters)
                        .maxLength(6)
                }
                
                Section(header: Text("昵称")) {
                    TextField("你的昵称", text: $username)
                }
                
                Section {
                    Button(action: {
                        if !roomCode.isEmpty && !username.isEmpty {
                            gameState.joinRoom(roomCode: roomCode.uppercased(), username: username)
                            dismiss()
                        }
                    }) {
                        Text("加入房间")
                            .frame(maxWidth: .infinity)
                    }
                    .disabled(roomCode.count < 6 || username.isEmpty)
                }
            }
            .navigationTitle("加入房间")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("取消") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Room List View

struct RoomListView: View {
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("活跃房间")) {
                    ForEach(1..<4) { _ in
                        RoomRowView()
                    }
                }
            }
            .navigationTitle("房间列表")
            .refreshable {
                // Refresh room list
            }
        }
    }
}

struct RoomRowView: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("房间 ABC123")
                    .font(.headline)
                Text("3/4 玩家 • 等待中")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Button("加入") {
                // Join room action
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Profile View

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var achievementManager = AchievementManager.shared
    
    var body: some View {
        NavigationView {
            List {
                if let user = authManager.currentUser {
                    Section {
                        HStack {
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 60, height: 60)
                                .overlay(
                                    Text(user.username.prefix(1).uppercased())
                                        .font(.title)
                                        .foregroundColor(.white)
                                )
                            VStack(alignment: .leading) {
                                Text(user.username)
                                    .font(.headline)
                                Text("Lv.\(user.level)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                    
                    // 成就概览
                    Section(header: Text("成就")) {
                        if let userAchievements = achievementManager.userAchievements {
                            HStack {
                                StatBox(label: "成就点数", value: "\(userAchievements.totalPoints)", icon: "⭐")
                                StatBox(label: "解锁成就", value: "\(userAchievements.unlockedCount)", icon: "🏆")
                                StatBox(label: "完成率", value: "\(userAchievements.completionRate)%", icon: "📊")
                            }
                            .padding(.vertical, 8)
                        } else {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                            .onAppear {
                                Task {
                                    await achievementManager.fetchUserAchievements()
                                }
                            }
                        }
                    }
                    
                    Section(header: Text("统计")) {
                        StatRow(label: "游戏场次", value: "\(user.gamesPlayed)")
                        StatRow(label: "胜利", value: "\(user.wins)")
                        StatRow(label: "失败", value: "\(user.losses)")
                        StatRow(label: "胜率", value: "\(Int(Double(user.wins) / Double(max(user.gamesPlayed, 1)) * 100))%")
                    }
                    
                    Section {
                        Button(action: { authManager.logout() }) {
                            HStack {
                                Spacer()
                                Text("退出登录")
                                    .foregroundColor(.red)
                                Spacer()
                            }
                        }
                    }
                }
                
                Section(header: Text("设置")) {
                    NavigationLink("音效设置") { EmptyView() }
                    NavigationLink("通知设置") { EmptyView() }
                    NavigationLink("关于我们") { EmptyView() }
                }
            }
            .navigationTitle("我的")
            .onAppear {
                Task {
                    await achievementManager.fetchUserAchievements()
                }
            }
        }
    }
}

struct StatBox: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(icon)
                .font(.title2)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct StatRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(GameStateManager())
        .environmentObject(AuthManager())
}
