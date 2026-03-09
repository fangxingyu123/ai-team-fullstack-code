//
//  Friend.swift
//  CatDogKill
//
//  好友系统数据模型
//

import Foundation

/// 好友请求状态
enum FriendRequestStatus: String, Codable {
    case pending   // 待处理
    case accepted  // 已接受
    case blocked   // 已拉黑
}

/// 用户信息
struct FriendUser: Codable, Identifiable, Hashable {
    let id: String
    let username: String
    let avatar: String?
    let level: Int
    var wins: Int?
    var losses: Int?
    var gamesPlayed: Int?
    var winRate: String?
    var isOnline: Bool
    
    init(id: String, username: String, avatar: String? = nil, level: Int = 1, 
         wins: Int? = nil, losses: Int? = nil, gamesPlayed: Int? = nil, 
         winRate: String? = nil, isOnline: Bool = false) {
        self.id = id
        self.username = username
        self.avatar = avatar
        self.level = level
        self.wins = wins
        self.losses = losses
        self.gamesPlayed = gamesPlayed
        self.winRate = winRate
        self.isOnline = isOnline
    }
    
    // 用于 Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: FriendUser, rhs: FriendUser) -> Bool {
        lhs.id == rhs.id
    }
}

/// 好友请求
struct FriendRequest: Codable, Identifiable {
    let id: String
    let from: FriendUser
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case from
        case createdAt
    }
    
    init(id: String, from: FriendUser, createdAt: Date) {
        self.id = id
        self.from = from
        self.createdAt = createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        from = try container.decode(FriendUser.self, forKey: .from)
        
        // 处理日期格式
        let dateString = try container.decode(String.self, forKey: .createdAt)
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        createdAt = isoFormatter.date(from: dateString) ?? Date()
    }
}

/// 好友列表响应
struct FriendsListResponse: Codable {
    let friends: [FriendUser]
}

/// 好友请求列表响应
struct FriendRequestsResponse: Codable {
    let requests: [FriendRequest]
}

/// 搜索结果响应
struct SearchUsersResponse: Codable {
    let users: [FriendUser]
}
