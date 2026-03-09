//
//  FriendManager.swift
//  CatDogKill
//
//  好友系统网络管理
//

import Foundation

/// 好友管理器 - 处理所有好友相关的网络请求
class FriendManager {
    static let shared = FriendManager()
    
    private let baseURL: String
    private var authToken: String?
    
    private init() {
        // 从环境变量或配置读取服务器地址
        self.baseURL = ProcessInfo.processInfo.environment["SERVER_URL"] 
            ?? "http://localhost:3000"
    }
    
    /// 设置认证 Token
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    // MARK: - 好友请求
    
    /// 获取好友请求列表
    func getFriendRequests() async throws -> [FriendRequest] {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let url = URL(string: "\(baseURL)/api/friends/requests")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let result = try decoder.decode(FriendRequestsResponse.self, from: data)
        return result.requests
    }
    
    /// 发送好友请求
    func sendFriendRequest(username: String) async throws {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let url = URL(string: "\(baseURL)/api/friends/request")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = ["targetUsername": username]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
    }
    
    /// 接受好友请求
    func acceptFriendRequest(requestId: String) async throws {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let url = URL(string: "\(baseURL)/api/friends/accept/\(requestId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
    }
    
    /// 拒绝好友请求
    func rejectFriendRequest(requestId: String) async throws {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let url = URL(string: "\(baseURL)/api/friends/reject/\(requestId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
    }
    
    // MARK: - 好友列表
    
    /// 获取好友列表
    func getFriendsList() async throws -> [FriendUser] {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let url = URL(string: "\(baseURL)/api/friends/list")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let result = try decoder.decode(FriendsListResponse.self, from: data)
        return result.friends
    }
    
    /// 移除好友
    func removeFriend(friendId: String) async throws {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let url = URL(string: "\(baseURL)/api/friends/remove/\(friendId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
    }
    
    // MARK: - 搜索
    
    /// 搜索用户
    func searchUsers(query: String) async throws -> [FriendUser] {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let url = URL(string: "\(baseURL)/api/friends/search?query=\(encodedQuery)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        let decoder = JSONDecoder()
        let result = try decoder.decode(SearchUsersResponse.self, from: data)
        return result.users
    }
    
    // MARK: - 拉黑
    
    /// 拉黑用户
    func blockUser(userId: String) async throws {
        guard let token = authToken else {
            throw FriendError.unauthorized
        }
        
        let url = URL(string: "\(baseURL)/api/friends/block/\(userId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
    }
    
    // MARK: - 辅助方法
    
    /// 处理 HTTP 响应
    private func handleResponse(_ response: URLResponse?) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FriendError.networkError
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw FriendError.unauthorized
        case 403:
            throw FriendError.forbidden
        case 404:
            throw FriendError.notFound
        case 400:
            throw FriendError.badRequest
        default:
            throw FriendError.serverError(statusCode: httpResponse.statusCode)
        }
    }
}

// MARK: - 错误类型

enum FriendError: LocalizedError {
    case unauthorized
    case forbidden
    case notFound
    case badRequest
    case networkError
    case serverError(statusCode: Int)
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "未授权，请重新登录"
        case .forbidden:
            return "无权执行此操作"
        case .notFound:
            return "请求的资源不存在"
        case .badRequest:
            return "请求参数错误"
        case .networkError:
            return "网络连接错误"
        case .serverError(let code):
            return "服务器错误 (\(code))"
        case .decodingError:
            return "数据解析错误"
        }
    }
}
