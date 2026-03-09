//
//  LeaderboardManager.swift
//  CatDogKill
//
//  排行榜网络请求管理
//

import Foundation

/// 排行榜玩家数据
struct LeaderboardPlayer: Codable, Identifiable {
    let rank: Int
    let userId: String
    let username: String
    let wins: Int
    let losses: Int
    let gamesPlayed: Int
    let winRate: Double
    let level: Int
    
    var id: String { userId }
    
    /// 胜率百分比字符串
    var winRatePercent: String {
        String(format: "%.0f%%", winRate * 100)
    }
    
    /// 排名徽章
    var rankBadge: String {
        switch rank {
        case 1: return "🥇"
        case 2: return "🥈"
        case 3: return "🥉"
        default: return "\(rank)."
        }
    }
}

/// 排行榜响应
struct LeaderboardResponse: Codable {
    let leaderboard: [LeaderboardPlayer]
}

/// 玩家排名响应
struct PlayerRankResponse: Codable {
    let rank: Int
    let total: Int
}

/// 排行榜管理器
class LeaderboardManager {
    static let shared = LeaderboardManager()
    
    private let baseURL: String
    private var authToken: String? {
        UserDefaults.standard.string(forKey: "cat_dog_kill_auth_token")
    }
    
    init(baseURL: String = "http://localhost:3000") {
        self.baseURL = baseURL
    }
    
    // MARK: - Public Methods
    
    /// 获取排行榜
    /// - Parameter limit: 返回数量限制（默认 100）
    /// - Returns: 排行榜玩家列表
    func getLeaderboard(limit: Int = 100) async throws -> [LeaderboardPlayer] {
        guard let url = URL(string: "\(baseURL)/api/game/leaderboard?limit=\(limit)") else {
            throw LeaderboardError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 添加认证 token（如果需要）
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw LeaderboardError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            let decoder = JSONDecoder()
            let leaderboardResponse = try decoder.decode(LeaderboardResponse.self, from: data)
            return leaderboardResponse.leaderboard
        } else {
            throw LeaderboardError.serverError(httpResponse.statusCode)
        }
    }
    
    /// 获取玩家自己的排名
    /// - Parameter userId: 用户 ID
    /// - Returns: 排名信息
    func getPlayerRank(userId: String) async throws -> PlayerRankResponse {
        guard var components = URLComponents(string: "\(baseURL)/api/game/leaderboard/rank") else {
            throw LeaderboardError.invalidURL
        }
        
        components.queryItems = [URLQueryItem(name: "userId", value: userId)]
        
        guard let url = components.url else {
            throw LeaderboardError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw LeaderboardError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            let decoder = JSONDecoder()
            return try decoder.decode(PlayerRankResponse.self, from: data)
        } else if httpResponse.statusCode == 404 {
            throw LeaderboardError.playerNotFound
        } else {
            throw LeaderboardError.serverError(httpResponse.statusCode)
        }
    }
    
    // MARK: - Helper Methods
    
    /// 更新认证 token
    func updateAuthToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: "cat_dog_kill_auth_token")
    }
}

// MARK: - Errors

enum LeaderboardError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(Int)
    case playerNotFound
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "无效的 URL"
        case .invalidResponse:
            return "无效的响应"
        case .serverError(let code):
            return "服务器错误 (\(code))"
        case .playerNotFound:
            return "玩家未找到"
        case .decodingError:
            return "数据解析失败"
        }
    }
}
