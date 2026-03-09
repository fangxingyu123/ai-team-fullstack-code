//
//  AchievementManager.swift
//  CatDogKill
//
// 成就网络管理
//

import Foundation

class AchievementManager: ObservableObject {
    static let shared = AchievementManager()
    
    @Published var userAchievements: UserAchievements?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000/api"
    private var authToken: String?
    
    private init() {}
    
    // 设置认证令牌
    func setAuthToken(_ token: String) {
        authToken = token
    }
    
    // 清除认证令牌
    func clearAuthToken() {
        authToken = nil
        userAchievements = nil
    }
    
    /// 获取所有成就列表
    func fetchAllAchievements() async -> [Achievement]? {
        guard let url = URL(string: "\(baseURL)/achievements") else {
            return nil
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return nil
            }
            
            let result = try JSONDecoder().decode([String: AnyCodable].self, from: data)
            
            // 解析成就数组
            if let achievementsData = result["achievements"]?.value as? [[String: Any]],
               let jsonData = try? JSONSerialization.data(withJSONObject: achievementsData) {
                let achievements = try JSONDecoder().decode([Achievement].self, from: jsonData)
                return achievements
            }
            
            return nil
        } catch {
            print("❌ Fetch achievements error: \(error)")
            return nil
        }
    }
    
    /// 获取用户成就进度
    func fetchUserAchievements() async {
        guard let url = URL(string: "\(baseURL)/achievements/my") else {
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw NSError(domain: "Invalid response", code: -1)
            }
            
            if httpResponse.statusCode == 401 {
                errorMessage = "未授权，请重新登录"
                isLoading = false
                return
            }
            
            guard httpResponse.statusCode == 200 else {
                let errorData = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
                errorMessage = errorData?["message"] as? String ?? "获取成就失败"
                isLoading = false
                return
            }
            
            let userAchievements = try JSONDecoder().decode(UserAchievements.self, from: data)
            self.userAchievements = userAchievements
            
        } catch {
            print("❌ Fetch user achievements error: \(error)")
            errorMessage = "网络错误：\(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    /// 获取其他用户的成就（公开信息）
    func fetchUserAchievements(userId: String) async -> PublicUserAchievements? {
        guard let url = URL(string: "\(baseURL)/achievements/user/\(userId)") else {
            return nil
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return nil
            }
            
            let publicAchievements = try JSONDecoder().decode(PublicUserAchievements.self, from: data)
            return publicAchievements
            
        } catch {
            print("❌ Fetch public achievements error: \(error)")
            return nil
        }
    }
    
    /// 刷新成就
    func refresh() async {
        await fetchUserAchievements()
    }
}

// 公开的用户成就信息（用于展示其他用户）
struct PublicUserAchievements: Codable {
    let userId: String
    let totalPoints: Int
    let unlockedCount: Int
    let totalCount: Int
    let completionRate: Int
    let unlockedAchievements: [UnlockedAchievementInfo]
}

// 已解锁成就信息
struct UnlockedAchievementInfo: Codable, Identifiable {
    let achievementId: String
    let name: String
    let icon: String
    let points: Int
    let unlockedAt: Date?
    
    var id: String { achievementId }
}

// 辅助类型：用于解析任意值
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if container.decodeNil() {
            value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unable to decode value"
            )
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            throw EncodingError.invalidValue(
                value,
                EncodingError.Context(
                    codingPath: encoder.codingPath,
                    debugDescription: "Unable to encode value"
                )
            )
        }
    }
}
