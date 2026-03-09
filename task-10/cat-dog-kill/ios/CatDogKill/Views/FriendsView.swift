//
//  FriendsView.swift
//  CatDogKill
//
//  好友系统主界面
//

import SwiftUI

/// 好友系统主视图
struct FriendsView: View {
    @StateObject private var viewModel = FriendsViewModel()
    @State private var selectedTab = 0
    @State private var searchText = ""
    @State private var showingAddFriend = false
    @State private var newFriendUsername = ""
    @State private var errorMessage: String?
    @State private var showingError = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // 顶部搜索栏
                HStack {
                    TextField("搜索玩家...", text: $searchText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .onChange(of: searchText) { oldValue, newValue in
                            Task {
                                if newValue.count >= 2 {
                                    await viewModel.searchUsers(query: newValue)
                                }
                            }
                        }
                    
                    Button(action: { showingAddFriend = true }) {
                        Image(systemName: "person.badge.plus")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Color.blue)
                            .clipShape(Circle())
                    }
                }
                .padding()
                
                // 分段控制器
                Picker("标签", selection: $selectedTab) {
                    Text("好友列表").tag(0)
                    Text("好友请求").tag(1)
                    Text("搜索结果").tag(2)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                .padding(.vertical, 8)
                
                // 内容区域
                TabView(selection: $selectedTab) {
                    // 好友列表
                    FriendsListView(viewModel: viewModel)
                        .tag(0)
                    
                    // 好友请求
                    FriendRequestsView(viewModel: viewModel)
                        .tag(1)
                    
                    // 搜索结果
                    SearchResultsView(viewModel: viewModel, searchText: $searchText)
                        .tag(2)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .navigationTitle("好友")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        Task {
                            await viewModel.loadFriends()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .alert("错误", isPresented: $showingError) {
                Button("确定", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "未知错误")
            }
            .sheet(isPresented: $showingAddFriend) {
                AddFriendSheet(
                    username: $newFriendUsername,
                    onSubmit: {
                        Task {
                            do {
                                try await FriendManager.shared.sendFriendRequest(username: newFriendUsername)
                                newFriendUsername = ""
                                showingAddFriend = false
                            } catch {
                                errorMessage = error.localizedDescription
                                showingError = true
                            }
                        }
                    }
                )
            }
            .task {
                await viewModel.loadFriends()
                await viewModel.loadFriendRequests()
            }
        }
    }
}

// MARK: - 好友列表视图

struct FriendsListView: View {
    @ObservedObject var viewModel: FriendsViewModel
    @State private var selectedFriend: FriendUser?
    @State private var showingRemoveAlert = false
    
    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.friends.isEmpty {
                LoadingView(message: "加载中...")
            } else if viewModel.friends.isEmpty {
                EmptyStateView(
                    icon: "person.2",
                    title: "暂无好友",
                    subtitle: "去添加你的第一个好友吧！"
                )
            } else {
                List(viewModel.friends) { friend in
                    FriendRowView(friend: friend)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            selectedFriend = friend
                        }
                        .contextMenu {
                            Button(role: .destructive) {
                                selectedFriend = friend
                                showingRemoveAlert = true
                            } label: {
                                Label("移除好友", systemImage: "person.badge.minus")
                            }
                            
                            Button(role: .destructive) {
                                Task {
                                    do {
                                        try await FriendManager.shared.blockUser(userId: friend.id)
                                        await viewModel.loadFriends()
                                    } catch {
                                        // 处理错误
                                    }
                                }
                            } label: {
                                Label("拉黑", systemImage: "hand.raised")
                            }
                        }
                }
            }
        }
        .alert("移除好友", isPresented: $showingRemoveAlert) {
            Button("取消", role: .cancel) {}
            Button("移除", role: .destructive) {
                if let friend = selectedFriend {
                    Task {
                        do {
                            try await FriendManager.shared.removeFriend(friendId: friend.id)
                            await viewModel.loadFriends()
                        } catch {
                            // 处理错误
                        }
                    }
                }
            }
        } message: {
            Text("确定要移除 \(selectedFriend?.username ?? "此用户") 吗？")
        }
    }
}

// MARK: - 好友请求视图

struct FriendRequestsView: View {
    @ObservedObject var viewModel: FriendsViewModel
    
    var body: some View {
        Group {
            if viewModel.isLoadingRequests && viewModel.friendRequests.isEmpty {
                LoadingView(message: "加载中...")
            } else if viewModel.friendRequests.isEmpty {
                EmptyStateView(
                    icon: "envelope",
                    title: "暂无请求",
                    subtitle: "有新的好友请求会显示在这里"
                )
            } else {
                List(viewModel.friendRequests) { request in
                    FriendRequestRowView(
                        request: request,
                        onAccept: {
                            Task {
                                do {
                                    try await FriendManager.shared.acceptFriendRequest(requestId: request.id)
                                    await viewModel.loadFriendRequests()
                                    await viewModel.loadFriends()
                                } catch {
                                    // 处理错误
                                }
                            }
                        },
                        onReject: {
                            Task {
                                do {
                                    try await FriendManager.shared.rejectFriendRequest(requestId: request.id)
                                    await viewModel.loadFriendRequests()
                                } catch {
                                    // 处理错误
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

// MARK: - 搜索结果视图

struct SearchResultsView: View {
    @ObservedObject var viewModel: FriendsViewModel
    @Binding var searchText: String
    @State private var showingSendRequest = false
    @State private var selectedUser: FriendUser?
    
    var body: some View {
        Group {
            if searchText.isEmpty {
                EmptyStateView(
                    icon: "magnifyingglass",
                    title: "搜索玩家",
                    subtitle: "输入用户名搜索并添加好友"
                )
            } else if viewModel.isSearching {
                LoadingView(message: "搜索中...")
            } else if viewModel.searchResults.isEmpty {
                EmptyStateView(
                    icon: "magnifyingglass",
                    title: "未找到结果",
                    subtitle: "试试其他关键词"
                )
            } else {
                List(viewModel.searchResults) { user in
                    HStack {
                        AvatarView(avatarUrl: user.avatar, size: 50)
                        
                        VStack(alignment: .leading) {
                            Text(user.username)
                                .font(.headline)
                            Text("等级 \(user.level)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            selectedUser = user
                            showingSendRequest = true
                        }) {
                            Text("添加")
                                .font(.caption)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(20)
                        }
                    }
                }
            }
        }
        .alert("发送好友请求", isPresented: $showingSendRequest) {
            Button("取消", role: .cancel) {}
            Button("发送") {
                if let user = selectedUser {
                    Task {
                        do {
                            try await FriendManager.shared.sendFriendRequest(username: user.username)
                        } catch {
                            // 处理错误
                        }
                    }
                }
            }
        } message: {
            Text("确定要向 \(selectedUser?.username ?? "此用户") 发送好友请求吗？")
        }
    }
}

// MARK: - 添加好友弹窗

struct AddFriendSheet: View {
    @Binding var username: String
    let onSubmit: () -> Void
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("用户名")) {
                    TextField("输入用户名", text: $username)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                }
                
                Section {
                    Text("将通过用户名搜索并发送好友请求")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("添加好友")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("发送") {
                        onSubmit()
                    }
                    .disabled(username.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}

// MARK: - 视图模型

class FriendsViewModel: ObservableObject {
    @Published var friends: [FriendUser] = []
    @Published var friendRequests: [FriendRequest] = []
    @Published var searchResults: [FriendUser] = []
    @Published var isLoading = false
    @Published var isLoadingRequests = false
    @Published var isSearching = false
    
    func loadFriends() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            friends = try await FriendManager.shared.getFriendsList()
        } catch {
            print("加载好友列表失败：\(error)")
        }
    }
    
    func loadFriendRequests() async {
        isLoadingRequests = true
        defer { isLoadingRequests = false }
        
        do {
            friendRequests = try await FriendManager.shared.getFriendRequests()
        } catch {
            print("加载好友请求失败：\(error)")
        }
    }
    
    func searchUsers(query: String) async {
        isSearching = true
        defer { isSearching = false }
        
        do {
            searchResults = try await FriendManager.shared.searchUsers(query: query)
        } catch {
            print("搜索用户失败：\(error)")
        }
    }
}

// MARK: - 辅助视图

struct FriendRowView: View {
    let friend: FriendUser
    
    var body: some View {
        HStack {
            AvatarView(avatarUrl: friend.avatar, size: 50)
            
            VStack(alignment: .leading) {
                HStack {
                    Text(friend.username)
                        .font(.headline)
                    
                    if friend.isOnline {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                    }
                }
                
                HStack {
                    Text("等级 \(friend.level)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let winRate = friend.winRate {
                        Text("• 胜率 \(winRate)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct FriendRequestRowView: View {
    let request: FriendRequest
    let onAccept: () -> Void
    let onReject: () -> Void
    
    var body: some View {
        HStack {
            AvatarView(avatarUrl: request.from.avatar, size: 50)
            
            VStack(alignment: .leading) {
                Text(request.from.username)
                    .font(.headline)
                Text("等级 \(request.from.level)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            HStack(spacing: 12) {
                Button(action: onReject) {
                    Image(systemName: "xmark")
                        .font(.title3)
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.red)
                        .clipShape(Circle())
                }
                
                Button(action: onAccept) {
                    Image(systemName: "checkmark")
                        .font(.title3)
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.green)
                        .clipShape(Circle())
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct AvatarView: View {
    let avatarUrl: String?
    let size: CGFloat
    
    var body: some View {
        Group {
            if let url = avatarUrl, !url.isEmpty {
                AsyncImage(url: URL(string: url)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    defaultAvatar
                }
            } else {
                defaultAvatar
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
    
    private var defaultAvatar: some View {
        Image(systemName: "person.fill")
            .font(.system(size: size * 0.5))
            .foregroundColor(.gray)
            .frame(width: size, height: size)
            .background(Color.gray.opacity(0.2))
    }
}

struct LoadingView: View {
    let message: String
    
    var body: some View {
        VStack {
            ProgressView()
                .scaleEffect(1.5)
            Text(message)
                .foregroundColor(.secondary)
                .padding(.top)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.gray.opacity(0.5))
            
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Text(subtitle)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }
}

#Preview {
    FriendsView()
}
